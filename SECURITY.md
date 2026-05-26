# Security Policy

## Supported Versions

AeroNav is maintained from the `main` branch. Security fixes are applied to the latest released source unless otherwise noted.

## Reporting a Vulnerability

Please do not open public issues for suspected security vulnerabilities.

Report security issues privately to the project maintainer, including:

- affected version or commit
- reproduction steps
- impact assessment
- any relevant logs or screenshots with secrets removed

Sensitive areas include administrator login, session cookies, JSON import/export, Cloudflare Worker routes, D1 migrations, and deployment configuration.

## Secret Handling

Never commit real `.dev.vars`, `.env` files, Cloudflare tokens, D1 database IDs, administrator passwords, or session secrets. Use `.dev.vars.example` as the local template.
