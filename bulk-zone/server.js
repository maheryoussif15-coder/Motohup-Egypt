const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');

const ROOT = __dirname;
const DATA = process.env.VERCEL ? path.join('/tmp', 'bulk-zone-data') : path.join(ROOT, 'data');
fs.mkdirSync(DATA, { recursive: true });
function loadEnv() {
  const file = path.join(ROOT, '.env');
  if (!fs.existsSync(file)) return;
  for (const rawLine of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = rawLine.replace(/^\uFEFF/, '');
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}
loadEnv();
if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.startsWith('change-this')) {
  console.error('Set ADMIN_PASSWORD in outputs/.env before starting. Copy .env.example to .env.');
  process.exit(1);
}
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.startsWith('generate-')) {
  console.error('Set SESSION_SECRET in outputs/.env before starting.');
  process.exit(1);
}
if (Boolean(process.env.TURSO_DATABASE_URL) !== Boolean(process.env.TURSO_AUTH_TOKEN)) {
  console.error('Set both TURSO_DATABASE_URL and TURSO_AUTH_TOKEN, or leave both empty.');
  process.exit(1);
}

const isTurso = Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
const isPg = Boolean(!isTurso && process.env.DATABASE_URL);
let libsql, pool;
if (isPg) {
  const { Pool } = require('pg');
  pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 5, idleTimeoutMillis: 30000 });
} else {
  const { createClient } = require('@libsql/client');
  libsql = isTurso
    ? createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })
    : createClient({ url: `file:${path.join(DATA, 'bulk-zone.db')}` });
}
function pgSql(sql) { let n = 0; return sql.replace(/\?/g, () => `$${++n}`); }
async function all(sql, args = []) {
  if (isPg) return (await pool.query(pgSql(sql), args)).rows;
  const r=await libsql.execute({sql,args}); return r.rows.map(row=>Object.fromEntries(r.columns.map((c,i)=>[c,row[i]])));
}
async function get(sql, args = []) {
  if (isPg) return (await pool.query(pgSql(sql), args)).rows[0];
  const rows=await all(sql,args); return rows[0];
}
async function run(sql, args = []) {
  if (isPg) {
    const q = /^\s*INSERT\s+INTO\s+(categories|products|promos|coupons|guides|orders)\b/i.test(sql) && !/\bRETURNING\b/i.test(sql) ? `${sql} RETURNING id` : sql;
    const r = await pool.query(pgSql(q), args);
    return { changes: r.rowCount, lastInsertRowid: r.rows?.[0]?.id };
  }
  const r=await libsql.execute({sql,args}); return {changes:r.rowsAffected,lastInsertRowid:r.lastInsertRowid==null?undefined:Number(r.lastInsertRowid)};
}

const schemas = [
  `CREATE TABLE IF NOT EXISTS shipping_zones (id ${isPg ? 'SERIAL' : 'INTEGER'} PRIMARY KEY ${isPg ? '' : 'AUTOINCREMENT'}, name TEXT NOT NULL, price INTEGER NOT NULL DEFAULT 0, active INTEGER DEFAULT 1, sort_order INTEGER DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS categories (id ${isPg ? 'SERIAL' : 'INTEGER'} PRIMARY KEY ${isPg ? '' : 'AUTOINCREMENT'}, name TEXT NOT NULL, description TEXT DEFAULT '', image TEXT DEFAULT '', active INTEGER DEFAULT 1, sort_order INTEGER DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS products (id ${isPg ? 'SERIAL' : 'INTEGER'} PRIMARY KEY ${isPg ? '' : 'AUTOINCREMENT'}, name TEXT NOT NULL, subtitle TEXT DEFAULT '', category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL, image TEXT DEFAULT '', images TEXT DEFAULT '[]', price INTEGER NOT NULL DEFAULT 0, old_price INTEGER, badge TEXT DEFAULT '', rating TEXT DEFAULT '★★★★★', description TEXT DEFAULT '', benefits TEXT DEFAULT '', how_to_use TEXT DEFAULT '', warnings TEXT DEFAULT '', sizes TEXT DEFAULT '[]', flavors TEXT DEFAULT '[]', active INTEGER DEFAULT 1, featured INTEGER DEFAULT 0, sort_order INTEGER DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS coupons (id ${isPg ? 'SERIAL' : 'INTEGER'} PRIMARY KEY ${isPg ? '' : 'AUTOINCREMENT'}, code TEXT NOT NULL UNIQUE, discount_type TEXT NOT NULL DEFAULT 'percent', discount_value INTEGER NOT NULL DEFAULT 0, minimum_total INTEGER DEFAULT 0, max_uses INTEGER DEFAULT 0, uses INTEGER DEFAULT 0, active INTEGER DEFAULT 1, starts_at TEXT DEFAULT '', ends_at TEXT DEFAULT '')`,
  `CREATE TABLE IF NOT EXISTS promos (id ${isPg ? 'SERIAL' : 'INTEGER'} PRIMARY KEY ${isPg ? '' : 'AUTOINCREMENT'}, text TEXT NOT NULL, active INTEGER DEFAULT 1, sort_order INTEGER DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS guides (id ${isPg ? 'SERIAL' : 'INTEGER'} PRIMARY KEY ${isPg ? '' : 'AUTOINCREMENT'}, title TEXT NOT NULL, summary TEXT DEFAULT '', body TEXT DEFAULT '', source_url TEXT DEFAULT '', active INTEGER DEFAULT 1, sort_order INTEGER DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT DEFAULT '')`,
  `CREATE TABLE IF NOT EXISTS orders (id ${isPg ? 'SERIAL' : 'INTEGER'} PRIMARY KEY ${isPg ? '' : 'AUTOINCREMENT'}, customer_name TEXT NOT NULL, phone TEXT NOT NULL, address TEXT NOT NULL, notes TEXT DEFAULT '', items TEXT NOT NULL, subtotal INTEGER NOT NULL, discount INTEGER DEFAULT 0, total INTEGER NOT NULL, coupon_code TEXT DEFAULT '', status TEXT DEFAULT 'new', created_at TEXT DEFAULT '')`
];
async function initDb() {
  for (const sql of schemas) await run(sql);
  try { await run("ALTER TABLE products ADD COLUMN size_data TEXT DEFAULT '[]'"); } catch (_) {}
  for (const col of ["governorate TEXT DEFAULT ''", "shipping INTEGER DEFAULT 0"]) { try { await run(`ALTER TABLE orders ADD COLUMN ${col}`); } catch (_) {} }
  if (Number((await get('SELECT COUNT(*) AS n FROM shipping_zones')).n) === 0) {
    const govs = ['القاهرة','الجيزة','الإسكندرية','القليوبية','الشرقية','الدقهلية','الغربية','المنوفية','البحيرة','كفر الشيخ','دمياط','بورسعيد','الإسماعيلية','السويس','شمال سيناء','جنوب سيناء','الفيوم','بني سويف','المنيا','أسيوط','سوهاج','قنا','الأقصر','أسوان','البحر الأحمر','الوادي الجديد','مطروح'];
    for (let i = 0; i < govs.length; i++) await run('INSERT INTO shipping_zones(name,price,active,sort_order) VALUES(?,?,1,?)', [govs[i], 0, i + 1]);
  }
  if (Number((await get('SELECT COUNT(*) AS n FROM categories')).n) > 0) {
    const extraCategories = [
      ['الجينر','مكملات الكربوهيدرات وزيادة السعرات.','',1,5],
      ['الأحماض الأمينية','جلوتامين وأحماض أمينية ومكملات الأداء.','',1,6],
      ['حرق الدهون','منتجات مخصصة للتحكم بالوزن.','',1,7],
      ['الصحة العامة','مكملات الفيتامينات والمعادن والصحة العامة.','',1,8]
    ];
    for (const c of extraCategories) {
      if (!(await get('SELECT id FROM categories WHERE name=?',[c[0]]))) await run('INSERT INTO categories(name,description,image,active,sort_order) VALUES(?,?,?,?,?)',c);
    }
    await seedSupplementCatalog();
    return;
  }
  const catSeeds = [
    ['البروتين','منتجات البروتين لدعم احتياجك اليومي والتعافي.','https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=900&q=80',1,1],
    ['الكرياتين','مكملات الكرياتين لتمارين القوة عالية الشدة.','https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=900&q=80',1,2],
    ['الطاقة والأداء','منتجات ما قبل التمرين والطاقة.','https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80',1,3],
    ['الفيتامينات والصحة','مكملات غذائية عامة للاستخدام حسب الحاجة.','https://images.unsplash.com/photo-1550572017-edd951b55104?auto=format&fit=crop&w=900&q=80',1,4]
  ];
  for (const x of catSeeds) await run('INSERT INTO categories(name,description,image,active,sort_order) VALUES(?,?,?,?,?)', x);
  for (const c of [
    ['الجينر','مكملات الكربوهيدرات وزيادة السعرات.','',1,5],
    ['الأحماض الأمينية','جلوتامين وأحماض أمينية ومكملات الأداء.','',1,6],
    ['حرق الدهون','منتجات مخصصة للتحكم بالوزن.','',1,7],
    ['الصحة العامة','مكملات الفيتامينات والمعادن والصحة العامة.','',1,8]
  ]) await run('INSERT INTO categories(name,description,image,active,sort_order) VALUES(?,?,?,?,?)',c);
  const cats = await all('SELECT id,name FROM categories');
  const cid = name => cats.find(c => c.name === name).id;
  const prod = [
    ['واي بروتين جولد','بروتين مصل اللبن · 2 كجم',cid('البروتين'),'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=800&q=80',2450,2790,'الأكثر مبيعاً','★★★★★','مسحوق بروتين مصل اللبن؛ قد يساعد على استكمال كمية البروتين الغذائية عند الحاجة.','يوفر بروتيناً غذائياً يساهم في تلبية احتياج البروتين اليومي، مع التدريب والتغذية المتوازنة.','اخلط الحصة المحددة على الملصق بالماء أو مشروبك المفضل. اتبع تعليمات المنتج ولا تتجاوزها.','حساسية الحليب أو اللاكتوز؟ راجع المكونات واستشر مختصاً عند وجود حالة صحية أو أدوية.','["1 كجم","2 كجم"]','["شوكولاتة","فانيليا","فراولة"]',1,1,1],
    ['كرياتين مونوهيدرات','كرياتين نقي · 300 جم',cid('الكرياتين'),'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=800&q=80',790,950,'-17%','★★★★★','كرياتين مونوهيدرات للاستخدام مع برنامج تدريب منتظم.','قد يدعم الأداء في مجهودات عالية الشدة ومتقطعة مثل رفع الأثقال، بينما تختلف الاستجابة بين الأفراد.','استخدم فقط المقدار وطريقة الاستخدام المكتوبين على العبوة. حافظ على شرب السوائل واتبع إرشاد مختصك.','قد يتغير وزن الجسم بسبب احتباس الماء. استشر الطبيب قبل الاستخدام إذا لديك حالة صحية أو تتناول أدوية.','["150 جم","300 جم","500 جم"]','["بدون نكهة"]',1,1,2],
    ['بري ووركاوت إنرجي','طاقة وتركيز · 30 سيرفنج',cid('الطاقة والأداء'),'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80',1150,null,'جديد','★★★★☆','مزيج قبل التمرين؛ راجع الملصق لمعرفة المكونات ومحتوى الكافيين لكل حصة.','بعض المكونات مثل الكافيين قد تؤثر في اليقظة أو الإحساس بالمجهود، لكن التأثير يختلف وقد تظهر آثار غير مرغوبة.','اتبع ملصق المنتج بدقة. احسب الكافيين من كل المصادر، وتجنب تناوله قرب موعد النوم.','قد يسبب الكافيين أرقاً أو تململاً أو اضطراباً بالمعدة. غير مناسب للجميع؛ استشر مختصاً إذا كنت تتناول أدوية أو لديك حالة صحية.','["30 سيرفنج"]','["فواكه استوائية","بلو راسبيري","بدون نكهة"]',1,1,3],
    ['مالتي فيتامين','فيتامينات ومعادن · 60 كبسولة',cid('الفيتامينات والصحة'),'https://images.unsplash.com/photo-1550572017-edd951b55104?auto=format&fit=crop&w=800&q=80',560,null,'','★★★★★','تركيبة فيتامينات ومعادن؛ افحص المكونات والجرعات على العبوة.','قد يساهم في سد فجوات غذائية محددة عند وجود حاجة، ولا يستبدل الطعام المتنوع ولا يعالج مرضاً.','استخدم الجرعة المكتوبة على العبوة فقط، ويفضل مع وجبة إذا أوصى الملصق بذلك.','تجنب جمع عدة مكملات متشابهة دون مراجعة مجموع الجرعات. استشر الطبيب في الحمل أو المرض أو عند تناول الأدوية.','["60 كبسولة","120 كبسولة"]','["بدون نكهة"]',1,1,4],
    ['بروتين واي آيزوليت','عزل بروتين · 1.8 كجم',cid('البروتين'),'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=800&q=80',2890,3200,'اختيار المحترفين','★★★★★','بروتين مصل اللبن المعزول؛ تحقق من كمية البروتين والمكونات لكل حصة.','مصدر بروتين غذائي يمكن أن يساعد في الوصول للاحتياج اليومي بجانب الأطعمة.','اخلط الحصة حسب الملصق. اختر الحجم والنكهة من خيارات المنتج قبل الإضافة.','يحتوي على مشتقات الحليب. لا تستخدمه بديلاً عن نظام غذائي متوازن.','["900 جم","1.8 كجم"]','["شوكولاتة","فانيليا","كوكيز"]',1,1,5],
    ['كرياتين ميكرونايزد','ذوبان سريع · 300 جم',cid('الكرياتين'),'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=800&q=80',850,null,'','★★★★☆','كرياتين مونوهيدرات ناعم القوام.','قد يفيد في الأداء أثناء فترات قصيرة متكررة من التدريب عالي الشدة.','الجرعة وطريقة الاستخدام حسب ملصق المنتج. الاستخدام اليومي المنتظم يتبع إرشاد الشركة المصنعة أو مختص التغذية.','استشر الطبيب في حال وجود مشكلة بالكلى أو حالة صحية أو دواء منتظم.','["300 جم","500 جم"]','["بدون نكهة"]',1,0,6],
    ['أوميجا 3','زيت سمك · 90 كبسولة',cid('الفيتامينات والصحة'),'https://images.unsplash.com/photo-1550572017-edd951b55104?auto=format&fit=crop&w=800&q=80',620,710,'-13%','★★★★★','مكمل زيت سمك؛ افحص مقدار EPA وDHA على الملصق.','يوفر أحماض أوميجا 3. الفوائد المحتملة تختلف، والمكمل لا يستبدل الاستشارة أو العلاج الطبي.','اتبع الجرعة المكتوبة على العبوة وخذها حسب إرشادات الملصق.','قد يتفاعل مع أدوية، ومنها بعض مميعات الدم. استشر الطبيب أو الصيدلي قبل الاستخدام.','["90 كبسولة","180 كبسولة"]','["بدون نكهة"]',1,0,7],
    ['بيتا ألانين','تحمل وأداء · 200 جم',cid('الطاقة والأداء'),'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80',690,null,'','★★★★☆','مكمل بيتا ألانين؛ تختلف فائدة المنتج بحسب نوع التدريب والمكونات.','الدليل على تحسن الأداء يعتمد على نوع النشاط والجرعة المدروسة، وقد يحدث إحساس بالوخز.','اقرأ تعليمات العبوة ولا تتجاوزها. لا تخلطه مع منتجات أخرى قبل مراجعة المكونات.','قد يسبب وخزاً أو تنميلاً مؤقتاً. استشر مختصاً عند وجود حالة صحية أو أدوية.','["200 جم"]','["بدون نكهة","ليمون"]',1,0,8]
  ];
  for (const p of prod) await run('INSERT INTO products(name,subtitle,category_id,image,price,old_price,badge,rating,description,benefits,how_to_use,warnings,sizes,flavors,active,featured,sort_order) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',p);
  for (const text of ['خصم 10% على أول أوردر بكود FIRST10','شحن سريع لكل المحافظات','عروض Bulk Zone لفترة محدودة']) await run('INSERT INTO promos(text,active,sort_order) VALUES(?,1,?)',[text,1]);
  await run("INSERT INTO coupons(code,discount_type,discount_value,minimum_total,max_uses,uses,active) VALUES('FIRST10','percent',10,0,0,0,1)");
  const guideSeeds = [
    ['البروتين: دوره واستخدامه','مصدر غذائي للبروتين، وليس بديلاً للطعام.','يستخدم مسحوق البروتين لتكملة البروتين الغذائي عند الحاجة. الأساس هو إجمالي الغذاء والتدريب. راجع مسببات الحساسية وتعليمات العبوة.','https://ods.od.nih.gov/factsheets/ExerciseAndAthleticPerformance-Consumer/'],
    ['الكرياتين: القوة والتدريب','قد يدعم فترات التدريب القصيرة عالية الشدة.','الكرياتين من أكثر المكملات المدروسة للأداء في مجهودات عالية الشدة ومتقطعة. اختر منتجاً واضح المكونات واتبع تعليمات العبوة. استشر مختصاً عند وجود مرض أو أدوية.','https://ods.od.nih.gov/factsheets/ExerciseAndAthleticPerformance-HealthProfessional/'],
    ['الكافيين وما قبل التمرين','قد يزيد اليقظة؛ وقد يؤثر في النوم ويسبب آثاراً جانبية.','افحص كمية الكافيين في كل حصة ومصادره الأخرى خلال اليوم. اتبع الملصق، وتجنب تناوله قرب النوم. اسأل مختصاً إذا لديك حالة صحية أو تستخدم أدوية.','https://ods.od.nih.gov/factsheets/ExerciseAndAthleticPerformance-HealthProfessional/'],
    ['الفيتامينات والمعادن','مكملات لسد احتياج محدد، وليست بديلاً عن الغذاء المتنوع.','اقرأ المكونات والجرعات لتجنب التكرار بين المنتجات. اختيار المكمل يعتمد على احتياجك؛ استشر طبيباً أو صيدلياً عند الحاجة.','https://ods.od.nih.gov/factsheets/list-all/'],
    ['أوميجا 3','أحماض دهنية توجد في الأسماك وبعض المكملات.','تحقق من محتوى EPA وDHA. قد تتداخل مكملات أوميجا 3 مع بعض الأدوية؛ ناقشها مع الطبيب أو الصيدلي.','https://ods.od.nih.gov/factsheets/Omega3FattyAcids-Consumer/']
  ];
  for (let i=0;i<guideSeeds.length;i++) await run('INSERT INTO guides(title,summary,body,source_url,active,sort_order) VALUES(?,?,?,?,1,?)',[...guideSeeds[i],i+1]);
  await seedSupplementCatalog();
  const initialSettings=[['store_name',process.env.STORE_NAME||'Bulk Zone'],['whatsapp',process.env.WHATSAPP_NUMBER||''],['contact',''],['logo','assets/bulk-zone-logo.jpeg']];
  for(const [k,v] of initialSettings)await run('INSERT INTO settings(key,value) VALUES(?,?)',[k,v]);
}

async function seedSupplementCatalog() {
  const cats = await all('SELECT id,name FROM categories');
  const category = names => cats.find(c => names.some(n => c.name.toLowerCase().includes(n.toLowerCase())))?.id ?? null;
  const protein=category(['البروتين']), creatine=category(['الكرياتين']), performance=category(['الطاقة والأداء']), health=category(['الصحة العامة']), amino=category(['الأحماض الأمينية']), gainer=category(['الجينر']), burner=category(['حرق الدهون']);
  const rows = [
    ['Hydro Whey Mango 2.27kg','Hydro Whey · Mango · 2.27 kg',protein,'hydro-whey-mango-2270g.jpg'],
    ['Kevin Levrone Anabolic Iso Whey','Whey isolate + creatine + BCAA',protein,'kevin-levrone-anabolic-iso-whey.jpg'],
    ['FA Gold Whey Isolate 2kg','Whey protein isolate · 2 kg',protein,'fa-gold-whey-isolate-2kg.jpg'],
    ['Tractor Carb Lemon Mint','Carbohydrate powder · Lemon Mint',gainer,'tractor-carb-lemon-mint.jpg'],
    ['MuscleSeeds Creatine 300g','Creatine monohydrate · Unflavored · 300 g',creatine,'muscleseeds-creatine-unflavored-300g.jpg'],
    ['Cloma Black Spider 25','Ephedra capsules · 100 capsules',burner,'cloma-black-spider-ephedra.jpg'],
    ['Yava Labs Multivitamin','Multivitamin · 60 capsules',health,'yava-multivitamin-60caps.jpg'],
    ['CLA + Carnitine','CLA + Carnitine · 50 servings',burner,'cla-carnitine.jpg'],
    ['Crea Legend 200g','Creatine supplement · 200 g',creatine,'crea-legend-creatine-200g.jpg'],
    ['Mass Gainer Red 7kg','Mass gainer · 7 kg',gainer,'mass-gainer-red-bag-7kg.jpg'],
    ['Nutrex Lipo 6 Black Ultra','Thermogenic capsules · 60 capsules',burner,'nutrex-lipo6-black-ultra.jpg'],
    ['Farah GainSecret 5kg','Mass gainer · Chocolate · 5 kg',gainer,'farah-gainsecret-5kg.jpg'],
    ['Kevin Levrone Anabolic Creatine 300g','Creatine · 300 g',creatine,'kevin-levrone-anabolic-creatine-300g.jpg'],
    ['DY Creatine Monohydrate 300g','Creatine monohydrate · 300 g',creatine,'dy-creatine-monohydrate-300g.jpg'],
    ['Kevin Levrone Gold Creatine 300g','Creatine monohydrate · 300 g',creatine,'kevin-levrone-gold-creatine-300g.jpg'],
    ['Premium Pre-Hell','Pre-workout · 30 servings',performance,'premium-pre-hell.jpg'],
    ['Whey 100 Red White','Whey protein · 1 kg',protein,'whey-100-red-white.jpg'],
    ['MuscleSeeds Vitamin C 1000','Vitamin C · 100 coated tablets',health,'muscleseeds-vitamin-c1000.jpg'],
    ['Mavfit Carbofit Berry','Carbohydrate supplement',gainer,'mavfit-carbofit-berry.jpg'],
    ['Yava Labs Omega 3','Omega 3 · 90 capsules',health,'yava-omega-3-90caps.jpg'],
    ['Kevin Levrone Anabolic Glutamine 200g','Glutamine · 200 g',amino,'kevin-levrone-anabolic-glutamine-200g.jpg'],
    ['14 Joint Guard','Joint support · 90 capsules',health,'14-joint-guard-90caps.jpg'],
    ['Farah AAKG 300g','Arginine Alpha Ketoglutarate · 300 g',amino,'farah-aakg-300g.jpg'],
    ['14 Creatine Orange 500g','Creatine monohydrate · Orange · 500 g',creatine,'14-creatine-orange-500g.jpg'],
    ['Nutrabolics Mass Fusion 5.44kg','Mass gainer · 5.44 kg',gainer,'nutrabolics-mass-fusion-5440g.jpg'],
    ['Kevin Levrone Gold Whey','Whey protein concentrate',protein,'kevin-levrone-gold-whey.jpg'],
    ['Red Mass Gainer 500g','Mass gainer',gainer,'red-mass-gainer-500g.jpg'],
    ['Pure Gavic Creatine 500g','Creatine monohydrate · 500 g',creatine,'pure-gavic-creatine-500g.jpg'],
    ['Skull Labs Ripped Mass 3kg','Mass gainer · 3 kg',gainer,'skull-labs-ripped-mass-3kg.jpg'],
    ['Redcon1 Total War','Pre-workout · 30 servings',performance,'redcon1-total-war-preworkout.jpg'],
    ['The Curse Pre-workout','Pre-workout · Fruit punch · 50 servings',performance,'the-curse-preworkout.jpg'],
    ['NPP Ultra Mass','Mass gainer',gainer,'npp-ultra-mass.jpg'],
    ['ResultMeds Magnesium Complex','Magnesium complex',health,'resultmeds-magnesium-complex.jpg'],
    ['Thor Amino Complex','Amino acid complex · 30 servings',amino,'thor-amino-complex.jpg'],
    ['Yava Labs Creatine 300g','Creatine monohydrate · 300 g',creatine,'yava-creatine-300g.jpg'],
    ['Muscletech Hydroxycut Hardcore Elite','Thermogenic capsules · 110 capsules',burner,'muscletech-hydroxycut-hardcore.jpg'],
    ['Azgard Creatine Nano 300g','Creatine monohydrate · 300 g',creatine,'azgard-creatine-nano-300g.jpg'],
    ['14 Hyper Rush','Pre-workout · 40 servings',performance,'14-hyper-rush-preworkout.jpg'],
    ['Dragon L-Glutamine 500g','L-Glutamine · 500 g',amino,'dragon-glutamine-500g.jpg'],
    ['DY Hood & Guts','Pre-workout · Pear Kiwi · 380 g',performance,'dy-hood-guts-preworkout.jpg'],
    ['Scitec Jumbo Gainer','Mass gainer · Vanilla',gainer,'scitec-jumbo-gainer.jpg'],
    ['Maxfit Carbofit','Carbohydrate supplement · Blueberry',gainer,'maxfit-carbofit.jpg'],
    ['MuscleSeeds Zinc & Copper','Zinc and copper supplement',health,'muscleseeds-zinc-copper.jpg'],
    ['Tractor Twin Turbo','Pre-workout · Mango',performance,'tractor-twin-turbo-preworkout.jpg']
  ];
  const imageMigrationKey='supplement_catalog_images_v1';
  const shouldMigrateImages=!(await get('SELECT value FROM settings WHERE key=?',[imageMigrationKey]));
  const sectionMigrationKey='supplement_catalog_sections_v1';
  const shouldActivateSections=!(await get('SELECT value FROM settings WHERE key=?',[sectionMigrationKey]));
  if (shouldActivateSections) {
    for (const id of [protein,creatine,performance].filter(Boolean)) await run('UPDATE categories SET active=1 WHERE id=?',[id]);
  }
  const categoryPrices = new Map([[protein,2200],[creatine,850],[performance,1100],[health,450],[amino,650],[gainer,1800],[burner,950]]);
  const categoryCounts = new Map();
  for (let i=0;i<rows.length;i++) {
    const [name,subtitle,categoryId,file]=rows[i], image=`assets/products/${file}`;
    const count=categoryCounts.get(categoryId)||0; categoryCounts.set(categoryId,count+1);
    const price=(categoryPrices.get(categoryId)||600)+(count%4)*150;
    const existing=await get('SELECT id,price FROM products WHERE name=? OR image=?',[name,image]);
    if (existing) {
      if (!Number(existing.price)) await run('UPDATE products SET price=? WHERE id=?',[price,existing.id]);
      if (shouldMigrateImages) await run('UPDATE products SET image=? WHERE id=?',[image,existing.id]);
      continue;
    }
    await run('INSERT INTO products(name,subtitle,category_id,image,price,old_price,badge,rating,description,benefits,how_to_use,warnings,sizes,flavors,active,featured,sort_order) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',[
      name,subtitle,categoryId,image,price,null,'','★★★★★',subtitle,'راجع ملصق العبوة لمعرفة المكونات والمعلومات الخاصة بالمنتج.','اتبع تعليمات الاستخدام المطبوعة على عبوة المنتج.','استشر طبيباً أو صيدلياً عند وجود حالة صحية أو أدوية منتظمة.','[]','[]',1,0,100+i
    ]);
  }
  if (shouldMigrateImages) await run('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO NOTHING',[imageMigrationKey,'done']);
  if (shouldActivateSections) await run('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO NOTHING',[sectionMigrationKey,'done']);
}

let dbDiagnostic={category:'initializing',code:'PENDING'};
function describeDatabaseFailure(error) {
  const message=String(error?.message||'').toLowerCase();
  const code=String(error?.code||'');
  let category='unknown';
  if (/auth|token|unauthor|credential/.test(message)) category='credentials';
  else if (/connect|timeout|socket|dns|network|fetch/.test(message)) category='connection';
  else if (/eacces|eperm|read.only|readonly|cantopen/.test(message)) category='storage';
  else if (/no such table|syntax|constraint|column|schema/.test(message)) category='schema';
  return {category,code:/^[A-Z0-9_]{1,32}$/.test(code)?code:'UNCLASSIFIED'};
}
const dbReady = initDb().catch(error=>{dbDiagnostic=describeDatabaseFailure(error);throw error;});
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '7mb' }));
app.use(async (_req,res,next)=>{
  try { await dbReady; next(); }
  catch (e) {
    console.error('Database setup failed:',e.message);
    if (_req.path==='/api/health') return res.status(503).json({ok:false,error:'database unavailable',diagnostic:dbDiagnostic});
    res.status(503).json({error:'قاعدة البيانات غير متاحة حالياً'});
  }
});
const cookieName = 'bulkzone_admin';
const loginAttempts = new Map();
function sessionToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + 8 * 60 * 60 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', process.env.SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}
function isAdmin(req) {
  const token = (req.headers.cookie || '').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1);
  if (!token) return false;
  const [payload, sig] = token.split('.'); if (!payload || !sig) return false;
  const expected = crypto.createHmac('sha256', process.env.SESSION_SECRET).update(payload).digest();
  let got; try { got = Buffer.from(sig,'base64url'); } catch { return false; }
  if (got.length !== expected.length || !crypto.timingSafeEqual(got, expected)) return false;
  try { return JSON.parse(Buffer.from(payload,'base64url').toString()).exp > Date.now(); } catch { return false; }
}
function admin(req,res,next){ if(!isAdmin(req)) return res.status(401).json({error:'يلزم تسجيل الدخول'}); next(); }
function cleanText(v, max=1000){ return String(v ?? '').trim().slice(0,max); }
function jsonField(v, fallback=[]){ try { const x=typeof v==='string'?JSON.parse(v):v; return Array.isArray(x)?x:fallback; } catch { return fallback; } }
function toProduct(p){ if(!p)return p; return {...p,images:jsonField(p.images),sizes:jsonField(p.sizes),flavors:jsonField(p.flavors),size_data:jsonField(p.size_data),active:Boolean(p.active),featured:Boolean(p.featured)}; }
function toCategory(c){return {...c,active:Boolean(c.active)}}
function toCoupon(c){return {...c,active:Boolean(c.active)}}
function toGuide(g){return {...g,active:Boolean(g.active)}}
function toPromo(p){return {...p,active:Boolean(p.active)}}
function validImage(s){return typeof s==='string' && (s.startsWith('https://') || /^data:image\/(png|jpeg|webp|gif);base64,/.test(s)) && s.length<6_500_000;}
function safeOptions(v){return JSON.stringify(jsonField(v).map(x=>String(x).trim().slice(0,80)).filter(Boolean).slice(0,30));}
function couponDiscount(coupon,subtotal){ if(!coupon||!Number(coupon.active)|| (Number(coupon.minimum_total)>subtotal))return 0; const v=coupon.discount_type==='fixed'?Number(coupon.discount_value):Math.round(subtotal*Number(coupon.discount_value)/100); return Math.max(0,Math.min(subtotal,v)); }
function couponLive(c){const now=Date.now();return c&&Number(c.active) && (!c.max_uses||Number(c.uses)<Number(c.max_uses)) && (!c.starts_at||Date.parse(c.starts_at)<=now) && (!c.ends_at||Date.parse(c.ends_at)>=now)}
app.get('/api/store',async(req,res)=>{
  try {
    const [cats,prods,promos,coupons,guides,settingRows,zones]=await Promise.all([all('SELECT * FROM categories WHERE active=1 ORDER BY sort_order,id'),all('SELECT * FROM products WHERE active=1 ORDER BY featured DESC,sort_order,id'),all('SELECT * FROM promos WHERE active=1 ORDER BY sort_order,id'),all('SELECT * FROM coupons WHERE active=1 ORDER BY id'),all('SELECT id,title,summary,body,source_url,sort_order FROM guides WHERE active=1 ORDER BY sort_order,id'),all('SELECT key,value FROM settings'),all('SELECT id,name,price FROM shipping_zones WHERE active=1 ORDER BY sort_order,id')]);
    const settings=Object.fromEntries(settingRows.map(x=>[x.key,x.value]));
    const publicCoupons=coupons.filter(c=>couponLive(c)).map(c=>({code:c.code,discount_type:c.discount_type,discount_value:c.discount_value,minimum_total:c.minimum_total}));
    res.json({store:{name:settings.store_name||process.env.STORE_NAME||'Bulk Zone',currency:process.env.STORE_CURRENCY||'EGP',whatsapp:settings.whatsapp||process.env.WHATSAPP_NUMBER||'',contact:settings.contact||'',logo:settings.logo||'assets/bulk-zone-logo.jpeg'},categories:cats.map(toCategory),products:prods.map(toProduct),promos:promos.map(toPromo),coupons:publicCoupons,guides,shipping:zones.map(z=>({id:z.id,name:z.name,price:Number(z.price)||0}))});
  }catch(e){console.error(e);res.status(500).json({error:'تعذر تحميل المتجر'})}
});
app.post('/api/coupons/validate',async(req,res)=>{
  try{const code=cleanText(req.body.code,40).toUpperCase();const subtotal=Math.max(0,Math.floor(Number(req.body.subtotal)||0));const c=await get('SELECT * FROM coupons WHERE UPPER(code)=?', [code]);if(!couponLive(c))return res.status(400).json({error:'كود الخصم غير صالح أو انتهت صلاحيته'});if(subtotal<Number(c.minimum_total||0))return res.status(400).json({error:`الحد الأدنى للطلب ${c.minimum_total} ج.م`});res.json({code:c.code,discount:couponDiscount(c,subtotal),message:'تم تطبيق الخصم'});}catch(e){console.error(e);res.status(500).json({error:'تعذر التحقق من الكود'})}
});
app.post('/api/orders',async(req,res)=>{
  try{
    const name=cleanText(req.body.customer?.name,120),phone=cleanText(req.body.customer?.phone,40),address=cleanText(req.body.customer?.address,500),notes=cleanText(req.body.customer?.notes,600),gov=cleanText(req.body.customer?.governorate,60);
    const input=Array.isArray(req.body.items)?req.body.items:[];if(!name||!phone||!address||!input.length)return res.status(400).json({error:'أدخل الاسم ورقم الهاتف والعنوان والمنتجات'});
    if(input.length>30)return res.status(400).json({error:'عدد المنتجات كبير'});
    const items=[];let subtotal=0;
    for(const row of input){const id=Math.floor(Number(row.productId||row.id));const qty=Math.max(1,Math.min(20,Math.floor(Number(row.qty)||1)));const p=await get('SELECT * FROM products WHERE id=? AND active=1',[id]);if(!p)return res.status(400).json({error:'أحد المنتجات لم يعد متاحاً'});const sizes=jsonField(p.sizes),flavors=jsonField(p.flavors);const size=cleanText(row.size,80),flavor=cleanText(row.flavor,80);if(sizes.length&&!sizes.includes(size))return res.status(400).json({error:`اختار الحجم المتاح لمنتج ${p.name}`});if(flavors.length&&!flavors.includes(flavor))return res.status(400).json({error:`اختار الطعم المتاح لمنتج ${p.name}`});const sd=jsonField(p.size_data).find(x=>x.name===size),price=Math.max(0,Number(sd&&sd.price!=null?sd.price:p.price));subtotal+=price*qty;items.push({productId:p.id,name:p.name,price,qty,size,flavor,image:p.image});}
    let c=null;const code=cleanText(req.body.couponCode,40).toUpperCase();if(code){c=await get('SELECT * FROM coupons WHERE UPPER(code)=?',[code]);if(!couponLive(c))return res.status(400).json({error:'كود الخصم غير صالح'});if(subtotal<Number(c.minimum_total||0))return res.status(400).json({error:`الحد الأدنى للطلب ${c.minimum_total} ج.م`});}
    const discount=couponDiscount(c,subtotal);
    const zones=await all('SELECT * FROM shipping_zones WHERE active=1');let zone=null;
    if(zones.length){zone=zones.find(z=>z.name===gov);if(!zone)return res.status(400).json({error:'اختار المحافظة'});}
    const shipping=zone?Math.max(0,Number(zone.price)||0):0,total=subtotal-discount+shipping;
    const result=await run('INSERT INTO orders(customer_name,phone,address,notes,items,subtotal,discount,total,coupon_code,status,created_at,governorate,shipping) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',[name,phone,address,notes,JSON.stringify(items),subtotal,discount,total,c?.code||'','new',new Date().toISOString(),zone?zone.name:'',shipping]);
    if(c)await run('UPDATE coupons SET uses=uses+1 WHERE id=?',[c.id]);
    res.status(201).json({id:result.lastInsertRowid,total,discount,shipping,message:'وصل طلبك، هنكلمك لتأكيد التفاصيل'});
  }catch(e){console.error(e);res.status(500).json({error:'حصلت مشكلة أثناء تسجيل الأوردر'})}
});
app.post('/api/admin/login',async(req,res)=>{
  const ip=req.ip||req.socket.remoteAddress||'unknown',record=loginAttempts.get(ip)||{count:0,until:0};
  if(record.until>Date.now()&&record.count>=8)return res.status(429).json({error:'محاولات كثيرة. انتظر دقائق ثم حاول تاني'});
  const pass=String(req.body.password||'');const a=Buffer.from(pass),b=Buffer.from(process.env.ADMIN_PASSWORD);
  if(a.length!==b.length||!crypto.timingSafeEqual(a,b)){record.count++;record.until=record.count>=8?Date.now()+10*60*1000:0;loginAttempts.set(ip,record);return res.status(401).json({error:'كلمة المرور غير صحيحة'});}
  loginAttempts.delete(ip);
  res.cookie(cookieName,sessionToken(),{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',maxAge:8*60*60*1000,path:'/'}).json({ok:true});
});
app.post('/api/admin/logout',(req,res)=>res.clearCookie(cookieName,{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',path:'/'}).json({ok:true}));
app.get('/api/admin/session',(req,res)=>res.json({authenticated:isAdmin(req)}));
app.get('/api/admin/data',admin,async(req,res)=>{
  try{const [categories,products,promos,coupons,guides,orders,settings,shipping]=await Promise.all([all('SELECT * FROM categories ORDER BY sort_order,id'),all('SELECT * FROM products ORDER BY sort_order,id'),all('SELECT * FROM promos ORDER BY sort_order,id'),all('SELECT * FROM coupons ORDER BY id'),all('SELECT * FROM guides ORDER BY sort_order,id'),all('SELECT * FROM orders ORDER BY id DESC LIMIT 500'),all('SELECT key,value FROM settings'),all('SELECT * FROM shipping_zones ORDER BY sort_order,id')]);res.json({shipping:shipping.map(z=>({...z,active:Boolean(z.active)})),categories:categories.map(toCategory),products:products.map(toProduct),promos:promos.map(toPromo),coupons:coupons.map(toCoupon),guides:guides.map(toGuide),orders:orders.map(o=>({...o,items:jsonField(o.items)})),settings:Object.fromEntries(settings.map(x=>[x.key,x.value]))});}catch(e){console.error(e);res.status(500).json({error:'تعذر تحميل لوحة التحكم'})}
});
const entityMap={shipping:{table:'shipping_zones',fields:['name','price','active','sort_order']},categories:{table:'categories',fields:['name','description','image','active','sort_order']},products:{table:'products',fields:['name','subtitle','category_id','image','images','price','old_price','badge','rating','description','benefits','how_to_use','warnings','sizes','size_data','flavors','active','featured','sort_order']},promos:{table:'promos',fields:['text','active','sort_order']},coupons:{table:'coupons',fields:['code','discount_type','discount_value','minimum_total','max_uses','active','starts_at','ends_at']},guides:{table:'guides',fields:['title','summary','body','source_url','active','sort_order']}};
function normalizeEntity(kind,b){const obj={...b};if(kind==='categories'){obj.name=cleanText(obj.name,100);obj.description=cleanText(obj.description,600);if(obj.image&&!validImage(obj.image))throw Error('صيغة صورة القسم غير صالحة');obj.image=obj.image||'';obj.active=obj.active?1:0;obj.sort_order=Math.floor(Number(obj.sort_order)||0)}
 if(kind==='products'){obj.name=cleanText(obj.name,140);obj.subtitle=cleanText(obj.subtitle,180);obj.description=cleanText(obj.description,1500);obj.benefits=cleanText(obj.benefits,1500);obj.how_to_use=cleanText(obj.how_to_use,1500);obj.warnings=cleanText(obj.warnings,1500);obj.badge=cleanText(obj.badge,60);obj.rating=cleanText(obj.rating,20);obj.image=obj.image||'';if(obj.image&&!validImage(obj.image))throw Error('صيغة صورة المنتج غير صالحة');obj.images=JSON.stringify((Array.isArray(obj.images)?obj.images:jsonField(obj.images)).filter(validImage).slice(0,5));obj.sizes=safeOptions(obj.sizes);if(Array.isArray(obj.size_data)){const sd=obj.size_data.map(x=>({name:cleanText(x?.name,80),price:x?.price===''||x?.price==null?null:Math.max(0,Math.floor(Number(x.price)||0)),image:validImage(x?.image)?x.image:''})).filter(x=>x.name).slice(0,30);obj.size_data=JSON.stringify(sd);obj.sizes=JSON.stringify(sd.map(x=>x.name))}else delete obj.size_data;obj.flavors=safeOptions(obj.flavors);obj.price=Math.max(0,Math.floor(Number(obj.price)||0));obj.old_price=obj.old_price===''||obj.old_price==null?null:Math.max(0,Math.floor(Number(obj.old_price)||0));obj.category_id=obj.category_id?Number(obj.category_id):null;obj.active=obj.active?1:0;obj.featured=obj.featured?1:0;obj.sort_order=Math.floor(Number(obj.sort_order)||0)}
 if(kind==='shipping'){obj.name=cleanText(obj.name,60);obj.price=Math.max(0,Math.floor(Number(obj.price)||0));obj.active=obj.active?1:0;obj.sort_order=Math.floor(Number(obj.sort_order)||0)}
 if(kind==='promos'){obj.text=cleanText(obj.text,220);obj.active=obj.active?1:0;obj.sort_order=Math.floor(Number(obj.sort_order)||0)}
 if(kind==='coupons'){obj.code=cleanText(obj.code,40).toUpperCase();obj.discount_type=obj.discount_type==='fixed'?'fixed':'percent';obj.discount_value=Math.max(0,Math.floor(Number(obj.discount_value)||0));obj.minimum_total=Math.max(0,Math.floor(Number(obj.minimum_total)||0));obj.max_uses=Math.max(0,Math.floor(Number(obj.max_uses)||0));obj.active=obj.active?1:0;obj.starts_at=cleanText(obj.starts_at,40);obj.ends_at=cleanText(obj.ends_at,40)}
 if(kind==='guides'){obj.title=cleanText(obj.title,180);obj.summary=cleanText(obj.summary,500);obj.body=cleanText(obj.body,2000);obj.source_url=cleanText(obj.source_url,500);obj.active=obj.active?1:0;obj.sort_order=Math.floor(Number(obj.sort_order)||0)}
 if(!obj.name&&kind==='categories'||!obj.name&&kind==='products'||!obj.text&&kind==='promos'||!obj.code&&kind==='coupons'||!obj.title&&kind==='guides'||!obj.name&&kind==='shipping')throw Error('أكمل الحقول المطلوبة');return obj;}
app.post('/api/admin/:kind',admin,async(req,res)=>{try{const kind=req.params.kind,meta=entityMap[kind];if(!meta)return res.status(404).json({error:'قسم غير موجود'});const obj=normalizeEntity(kind,req.body);const fields=meta.fields.filter(f=>Object.hasOwn(obj,f));const r=await run(`INSERT INTO ${meta.table}(${fields.join(',')}) VALUES(${fields.map(()=>'?').join(',')})`,fields.map(f=>obj[f]));res.status(201).json({id:r.lastInsertRowid});}catch(e){console.error(e);res.status(400).json({error:e.message||'تعذر الحفظ'})}});
app.put('/api/admin/:kind/:id',admin,async(req,res)=>{try{const kind=req.params.kind,meta=entityMap[kind];if(!meta)return res.status(404).json({error:'قسم غير موجود'});const obj=normalizeEntity(kind,req.body);const fields=meta.fields.filter(f=>Object.hasOwn(obj,f));const r=await run(`UPDATE ${meta.table} SET ${fields.map(f=>`${f}=?`).join(',')} WHERE id=?`,[...fields.map(f=>obj[f]),Number(req.params.id)]);if(!r.changes)return res.status(404).json({error:'العنصر غير موجود'});res.json({ok:true});}catch(e){console.error(e);res.status(400).json({error:e.message||'تعذر الحفظ'})}});
app.delete('/api/admin/:kind/:id',admin,async(req,res)=>{try{const kind=req.params.kind,meta=entityMap[kind];if(!meta)return res.status(404).json({error:'قسم غير موجود'});await run(`DELETE FROM ${meta.table} WHERE id=?`,[Number(req.params.id)]);res.json({ok:true})}catch(e){console.error(e);res.status(400).json({error:e.message||'تعذر الحذف'})}});
app.patch('/api/admin/orders/:id',admin,async(req,res)=>{const allowed=['new','confirmed','preparing','shipped','completed','cancelled'];const status=cleanText(req.body.status,20);if(!allowed.includes(status))return res.status(400).json({error:'حالة غير صالحة'});const r=await run('UPDATE orders SET status=? WHERE id=?',[status,Number(req.params.id)]);res.json({ok:r.changes>0})});
app.put('/api/admin/settings',admin,async(req,res)=>{try{const fields={store_name:cleanText(req.body.store_name,120),whatsapp:cleanText(req.body.whatsapp,30).replace(/[^0-9]/g,''),contact:cleanText(req.body.contact,200),logo:req.body.logo||'assets/bulk-zone-logo.jpeg'};if(fields.logo&&!validImage(fields.logo)&&!fields.logo.startsWith('assets/'))return res.status(400).json({error:'صيغة الشعار غير صالحة'});for(const [k,v]of Object.entries(fields)){const old=await get('SELECT key FROM settings WHERE key=?',[k]);if(old)await run('UPDATE settings SET value=? WHERE key=?',[v,k]);else await run('INSERT INTO settings(key,value) VALUES(?,?)',[k,v])}res.json({ok:true})}catch(e){console.error(e);res.status(400).json({error:e.message||'تعذر الحفظ'})}});
app.get('/api/health',async(req,res)=>{try{await get('SELECT 1 AS ok');res.json({ok:true,database:isTurso?'turso':isPg?'postgres':'sqlite'})}catch(e){res.status(503).json({ok:false,error:'database unavailable'})}});
app.use('/data',(_req,res)=>res.sendStatus(404));
app.use(express.static(path.join(ROOT,'public'),{extensions:['html'],index:'index.html',dotfiles:'ignore'}));
app.use((err,req,res,next)=>{console.error(err);res.status(413).json({error:'حجم الطلب أكبر من المسموح'})});

if (process.env.VERCEL) {
  module.exports = app;
  dbReady.catch(e=>console.error('Database setup failed:',e.message));
} else {
  dbReady.then(()=>{
  const port=Number(process.env.PORT)||3000;
  app.listen(port,()=>console.log(`Bulk Zone running at http://localhost:${port} (${isTurso?'Turso Cloud':isPg?'PostgreSQL':'SQLite'})`));
  }).catch(e=>{console.error('Database setup failed:',e.message);process.exit(1)});
}

