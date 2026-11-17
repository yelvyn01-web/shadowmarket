# Rule: Compliance, Safety & Security Boundaries

## 1. Legal Reselling Compliance
- ShadowMarket is strictly a platform for legally authorized digital licenses (software keys, developer subscriptions, authorized digital game keys, cloud vouchers).
- Strictly prohibit and reject any tools, cheats, scripts, exploits, memory modifiers, or anti-cheat bypasses.

## 2. Security Boundaries
- Never request or process banking passwords, OTPs, or plain credit card information.
- Never commit `.env` or secret keys to version control.
- Enforce AES-256-GCM encryption for all sensitive digital keys.
- Row Level Security (RLS) must be enabled on every PostgreSQL table.
- Verify webhooks cryptographically using HMAC signatures.
- Never execute financial charges or spend funds. Use sandboxes for all testing.
- Never deploy to production or alter production domains without owner approval.
- Never claim payment or key delivery success without authoritative server verification.
