# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| `main` branch | Yes |
| Older branches | No |

## Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

If you discover a security vulnerability in Lynqo, please report it responsibly:

1. **Email the maintainer directly** at the email address listed in the GitHub profile.
2. Include the following in your report:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fix (optional but appreciated)

### What to expect

- You will receive an acknowledgment within **48 hours**.
- We will investigate and aim to release a patch within **7 days** for critical issues.
- You will be credited in the release notes (unless you prefer to remain anonymous).

## Security Best Practices for Contributors

- Never commit `.env` files or secrets — use `.env.example` as a template.
- All authentication routes are protected with JWT — do not weaken these checks.
- Rate limiting is enforced on all API routes via `express-rate-limit`.
- Input validation is performed with `express-validator` — always validate new routes.
- Media uploads go through Cloudinary — never store files locally in production.
