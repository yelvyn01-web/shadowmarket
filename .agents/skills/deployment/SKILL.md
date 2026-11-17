---
name: deployment
description: >-
  Deploy and maintain production web applications with continuous integration and continuous deployment (CI/CD).
  Covers Vercel/Cloudflare deployment, environment variables configuration, custom domains, SSL/TLS certificates,
  GitHub Actions workflows, performance monitoring, and rollback strategies.
  Use when deploying, configuring production environments, or launching a site (เปิดเว็บไซต์ออนไลน์, Deployment, Vercel, CI/CD, GitHub Actions, Domain, SSL, Production release, Monitoring).
---

# Deployment (การเปิดเว็บไซต์ออนไลน์และการเผยแพร่สู่ Production)

Use this skill to deploy, automate CI/CD pipelines, configure custom domains with SSL/TLS, manage environment secrets, and monitor production web applications for ShadowMarket.

---

## 1. Production Go-Live Checklist

Complete all pre-flight checks before pointing production traffic:

- [ ] **Owner Explicit Approval**: Written confirmation from the store owner before initiating production deployment.
- [ ] **Build Verification**: Run `npm run build` locally or in CI with zero TypeScript or ESLint errors.
- [ ] **Database Migrations**: Apply all PostgreSQL schema migrations and verify RLS on the production Supabase project.
- [ ] **Environment Variables**: Configure all secrets in the Vercel project dashboard (never in client-exposed variables).
- [ ] **Webhook Endpoints**: Configure live payment gateway webhooks (e.g., Stripe) pointing to `https://yourdomain.com/api/webhooks/payment`.
- [ ] **Health Check**: Verify `/api/health` returns status `200 OK`.

---

## 2. Vercel Deployment Configuration

Create `vercel.json` to enforce HTTP security headers:

```json
{
  "buildCommand": "next build",
  "framework": "nextjs",
  "regions": ["sin1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ]
}
```

---

## 3. GitHub Actions CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Run TypeScript Check
        run: npx tsc --noEmit

      - name: Run Unit Tests
        run: npm run test

      - name: Build Next.js Application
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
```

---

## 4. Custom Domain, DNS & SSL Configuration

1. **DNS Record Setup**:
   - For root apex domain (`example.com`):
     - Record Type: `A`
     - Name: `@`
     - Value: `76.76.21.21` (Vercel IP)
   - For subdomain (`www.example.com`):
     - Record Type: `CNAME`
     - Name: `www`
     - Value: `cname.vercel-dns.com`
2. **SSL / TLS**:
   - Vercel automatically provisions Let's Encrypt certificates.
   - Verify HTTPS redirect is active (`http://example.com` automatically forwards to `https://example.com`).

---

## 5. Instant Rollback & Disaster Recovery Strategy

1. **Vercel Instant Rollback**:
   - In case of critical regression in production:
     1. Open Vercel Dashboard -> Deployments.
     2. Locate the previous verified deployment.
     3. Click `...` -> **Promote to Production** (traffic switches instantly).
2. **Non-Destructive Database Migrations**:
   - Never run destructive schema drops directly in production. Always write backwards-compatible additive migrations.

---

## 6. Official Documentation References

- [Vercel Deployment Documentation](https://vercel.com/docs/deployments/overview)
- [Vercel Custom Domains and DNS](https://vercel.com/docs/projects/domains/add-a-domain)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Let's Encrypt SSL/TLS Overview](https://letsencrypt.org/howitworks/)
- [Next.js Production Checklist](https://nextjs.org/docs/app/building-your-application/deploying/production-checklist)
