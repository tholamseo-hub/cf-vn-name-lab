# SEO Brief Vault — Cloudflare MVP

A tiny MVP designed to validate the workflow: code → GitHub → Cloudflare Workers → real URL, without a VPS.

## What it uses
- Cloudflare Worker: API + app entry point
- Workers Static Assets: frontend
- D1 binding `DB`: saves SEO briefs
- R2 binding `FILES`: optional attachments

The first deployment works even before D1/R2 are connected. The UI shows which bindings are active.

## Cloudflare setup
1. Workers & Pages → Create application → Import a repository.
2. Choose this GitHub repository.
3. Worker name must be `cf-vn-name-lab` (same as `wrangler.jsonc`).
4. Deploy command: `npx wrangler deploy`.
5. Save and Deploy.

### Add D1
Create a D1 database (suggested name: `seo-brief-vault-db`) and bind it to the Worker as `DB`.
Run `migrations/0001_init.sql` against that database in the D1 console.

### Add R2
Create an R2 bucket (suggested name: `seo-brief-vault-files`) and bind it to the Worker as `FILES`.

After both bindings exist, redeploy/restart if Cloudflare requests it. `/api/status` should show Worker ✓ D1 ✓ R2 ✓.
