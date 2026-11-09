# Bulk Zone deployment

This project is deployed from the `bulk-zone-deploy` branch with the Vercel project root set to `bulk-zone/`.

Keep credentials in Vercel Environment Variables. Do not commit `.env` files or database tokens.

The public `/api/health` endpoint reports only a safe database error category and code when database initialization fails; it never returns connection strings or credentials.
