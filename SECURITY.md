# Security policy

## Supported versions

Security updates are applied to the default branch (`main`). Use the latest release or commit when deploying to production.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for undisclosed security problems.

Instead, contact the maintainer privately:

- **GitHub:** [Esousa97](https://github.com/Esousa97) — use **Security advisories** on this repository if the feature is enabled, or open a draft security advisory as described in [GitHub’s documentation](https://docs.github.com/en/code-security/security-advisories).

Include:

- A short description of the issue and its impact
- Steps to reproduce or a proof of concept, if safe to share
- Affected versions or commit range, if known

You should receive an initial response within a reasonable time frame. Critical issues are prioritized.

## Scope notes

This service is designed as a **read-only** HTTP API. Deployment security (TLS, firewall rules, PAT storage, reverse proxy configuration) remains the operator’s responsibility; see the main `README.md` for operational guidance.
