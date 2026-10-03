// One-off: adapt the plain-HTML design stylesheet into a home-scoped stylesheet.
const fs = require('fs');
const src = 'C:/Users/hp/Documents/GitHub/Motohup-Egypt/new-design/moto-hub/css/style.css';
const dst = 'C:/Users/hp/Documents/GitHub/Motohup-Egypt/src/home.css';
let c = fs.readFileSync(src, 'utf8');

const lit = [
  ['MOTO HUB — style.css', 'MOTO HUB — home.css (scoped: global rules are prefixed so they never leak into other pages)'],
  ['body {', '.mh-home {'],
  ['body.is-locked', 'body.mh-locked'],
  ['h1, h2, h3, h4 {', '.mh-home h1, .mh-home h2, .mh-home h3, .mh-home h4 {'],
  ['::selection {', '.mh-home ::selection {'],
  [':focus-visible {', '.mh-home :focus-visible {'],
  ['::-webkit-scrollbar {', 'body.mh-active::-webkit-scrollbar {'],
  ['::-webkit-scrollbar-track {', 'body.mh-active::-webkit-scrollbar-track {'],
  ['::-webkit-scrollbar-thumb:hover {', 'body.mh-active::-webkit-scrollbar-thumb:hover {'],
  ['::-webkit-scrollbar-thumb {', 'body.mh-active::-webkit-scrollbar-thumb {'],
  ['html { scrollbar-color: var(--purple) var(--bg); scrollbar-width: thin; }',
   'body.mh-active { scrollbar-color: var(--purple) var(--bg); scrollbar-width: thin; }'],
  ['.container', '.mh-container'],
];
for (const [a, b] of lit) c = c.split(a).join(b);

const drop = [
  /\*,\s*\*::before,\s*\*::after\s*\{[^}]*\}\s*\n\s*\n/,
  /img\s*\{\s*max-width:\s*100%;\s*display:\s*block;\s*\}\s*\n\s*\n/,
  /a\s*\{\s*color:\s*inherit;\s*text-decoration:\s*none;\s*\}\s*\n\s*\n/,
  /ul\s*\{\s*list-style:\s*none;\s*\}\s*\n\s*\n/,
  /button\s*\{\s*font-family:\s*inherit;\s*cursor:\s*pointer;\s*border:\s*none;\s*background:\s*none;\s*color:\s*inherit;\s*\}\s*\n\s*\n/,
];
for (const re of drop) c = c.replace(re, '');

fs.writeFileSync(dst, c);
console.log('written', c.split('\n').length, 'lines');
