---
name: security-audit
description: >-
  Perform comprehensive security audits, vulnerability assessments, penetration testing, and hardening for ShadowMarket.
  Covers OWASP Top 10, Supabase RLS policy validation, AES-256-GCM key security, zero-leaks secrets policy,
  rate limiting, anti-cheat policy compliance, and HTTP security headers.
  Use when auditing code for security, running vulnerability scans, or hardening the platform (ตรวจสอบความปลอดภัย, Security Audit, OWASP, Pentest, Secret leaks, Hardening, Compliance).
---

# Security Audit & Hardening (การตรวจสอบความปลอดภัยและการป้องกันระบบ)

Use this skill to audit codebase security, verify authorization boundaries, validate encryption for digital licenses, enforce anti-cheat prohibitions, and harden ShadowMarket against cyber attacks.

---

## 1. Zero-Trust Policy & Platform Boundaries

1. **Strict Prohibition on Cheats & Bypasses**:
   - The platform strictly forbids software game cheats, aimbots, memory injectors, or anti-cheat bypasses.
   - Any product listing submitted must pass authorization checks verifying it is a legal license, digital gift code, or authorized developer tool.
2. **Never Expose Private Credentials**:
   - The agent and platform must NEVER log, store, or output banking credentials, private keys, or passwords.
   - All server environment variables (`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `LICENSE_ENCRYPTION_KEY`) must never be prefixed with `NEXT_PUBLIC_`.
3. **No Unverified Success Claims**:
   - Never claim an order is paid or a license is delivered without explicit cryptographic or database verification.

---

## 2. OWASP Top 10 Audit for Digital License Platforms

| Vulnerability | Attack Vector in License Reselling | Hardening & Mitigation |
| :--- | :--- | :--- |
| **A01: Broken Access Control** | User changes `orderId` in URL or API request to view other users' digital keys. | Enforce Supabase RLS (`auth.uid() = user_id`) and double-check ownership in Server Actions before key decryption. |
| **A02: Cryptographic Failures** | Storing license keys in plaintext in PostgreSQL or system logs. | Encrypt all license keys using AES-256-GCM with authenticated tags before database insertion. |
| **A03: Injection** | SQL injection in product search or order filtering. | Use Supabase query builder and parameterized queries exclusively; forbid string concatenation in raw SQL. |
| **A04: Insecure Design** | Malicious users placing bulk unpaid orders to reserve and drain all available license inventory. | Apply auto-expiration timers (15 mins) on reservations and rate limit checkout attempts. |
| **A05: Security Misconfiguration** | Missing HTTP security headers or public storage bucket write permissions. | Configure strict CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and private storage policies. |
| **A07: Identification & Auth Failures** | Brute-force attacks against customer and admin login forms. | Enforce rate limiting, password strength policies, and Supabase Auth secure sessions. |

---

## 3. Automated Vulnerability Scanning Queries

Run these verification queries in Supabase:

```sql
-- 1. Verify all public tables have RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;
-- Expected Result: 0 rows

-- 2. Inspect policies with open 'true' permissions on sensitive tables
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('license_keys', 'orders', 'order_items', 'audit_logs')
  AND (qual = 'true' OR qual IS NULL)
  AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'SELECT');
-- Expected Result: Only authorized admin policies or strictly scoped policies
```

---

## 4. Security Audit Checklist

- [ ] Zero secret keys (`*_SECRET_KEY`, `SERVICE_ROLE_KEY`) present in client-side bundles.
- [ ] License keys stored strictly as AES-256-GCM ciphertexts with IV and auth tag.
- [ ] Customers have zero direct SELECT permission on the `license_keys` table.
- [ ] Server Actions validate inputs with Zod and verify caller identity with `supabase.auth.getUser()`.
- [ ] Rate limiting implemented on authentication, checkout, and search routes.
- [ ] Webhook signature verification verified with HMAC-SHA256.
- [ ] Platform rules strictly prohibit game cheats, exploits, or anti-cheat bypasses.

---

## 5. Official Documentation References

- [OWASP Top 10 Web Application Security Risks](https://owasp.org/www-project-top-ten/)
- [Supabase Row Level Security Hardening Guide](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Node.js Crypto Security Best Practices](https://nodejs.org/api/crypto.html)
- [Content Security Policy (CSP) Reference (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Vercel Security Headers Reference](https://vercel.com/docs/security)
