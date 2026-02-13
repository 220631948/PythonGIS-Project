# GitHub Secrets Configuration Guide

This document lists all GitHub secrets required for CI/CD pipelines to function correctly.

---

## Required Secrets

### Authentication & Security

#### `SECRET_KEY`
- **Type**: String
- **Required For**: Backend JWT authentication
- **Description**: 256-bit random secret key for JWT token signing
- **Generation**:
  ```bash
  python scripts/generate-secret-key.py
  # Or use openssl:
  openssl rand -hex 32
  ```
- **Example**: `a1b2c3d4e5f6...` (64 characters)
- **Used In**: All workflows (staging, production)

---

### Database Configuration

#### `STAGING_DATABASE_URL`
- **Type**: Connection String
- **Required For**: Staging deployment
- **Description**: PostgreSQL connection string for staging database
- **Format**: `postgresql+asyncpg://user:password@host:5432/dbname`
- **Example**: `postgresql+asyncpg://geohub_user:strongpassword@staging-db.example.com:5432/geohub_staging`
- **Used In**: `deploy-staging.yml`

#### `PRODUCTION_DATABASE_URL`
- **Type**: Connection String
- **Required For**: Production deployment
- **Description**: PostgreSQL connection string for production database
- **Format**: `postgresql+asyncpg://user:password@host:5432/dbname`
- **Example**: `postgresql+asyncpg://geohub_user:verystrongpassword@prod-db.example.com:5432/geohub_prod`
- **Security**: Use read-write user with minimal privileges
- **Used In**: `deploy-production.yml`

---

### SSH Configuration

#### `STAGING_SSH_KEY`
- **Type**: Private SSH Key
- **Required For**: Staging deployment
- **Description**: Private SSH key for accessing staging server
- **Generation**:
  ```bash
  ssh-keygen -t ed25519 -C "github-actions-staging" -f staging_deploy_key
  # Add public key to staging server: ~/.ssh/authorized_keys
  ```
- **Format**: Full private key including headers
  ```
  -----BEGIN OPENSSH PRIVATE KEY-----
  ...
  -----END OPENSSH PRIVATE KEY-----
  ```
- **Used In**: `deploy-staging.yml`

#### `STAGING_HOST`
- **Type**: String
- **Required For**: Staging deployment
- **Description**: Hostname or IP address of staging server
- **Example**: `staging.geohub.example.com` or `203.0.113.10`
- **Used In**: `deploy-staging.yml`

#### `STAGING_USER`
- **Type**: String
- **Required For**: Staging deployment
- **Description**: SSH username for staging server
- **Example**: `deploy` or `geohub`
- **Used In**: `deploy-staging.yml`

#### `PRODUCTION_SSH_KEY`
- **Type**: Private SSH Key
- **Required For**: Production deployment
- **Description**: Private SSH key for accessing production server
- **Generation**: Same as `STAGING_SSH_KEY` but separate key
- **Security**: Use different key than staging
- **Used In**: `deploy-production.yml`

#### `PRODUCTION_HOST`
- **Type**: String
- **Required For**: Production deployment
- **Description**: Hostname or IP address of production server
- **Example**: `geohub.example.com` or `198.51.100.20`
- **Used In**: `deploy-production.yml`

#### `PRODUCTION_USER`
- **Type**: String
- **Required For**: Production deployment
- **Description**: SSH username for production server
- **Example**: `deploy` or `geohub`
- **Used In**: `deploy-production.yml`

---

### Monitoring & Error Tracking

#### `SENTRY_DSN`
- **Type**: URL
- **Required For**: Production error tracking
- **Description**: Sentry Data Source Name for error reporting
- **Obtain From**: Sentry project settings → Client Keys (DSN)
- **Format**: `https://<key>@<org>.ingest.sentry.io/<project>`
- **Example**: `https://abc123def456@o123456.ingest.sentry.io/7891011`
- **Used In**: `deploy-production.yml`, Docker builds

#### `SENTRY_AUTH_TOKEN`
- **Type**: Auth Token (Optional)
- **Required For**: Sentry release tracking (optional)
- **Description**: Sentry authentication token for creating releases
- **Obtain From**: Sentry → Settings → Auth Tokens
- **Permissions**: `project:releases` and `org:read`
- **Used In**: Production deployment (optional)

---

### Code Coverage

#### `CODECOV_TOKEN`
- **Type**: Token
- **Required For**: Coverage report uploads
- **Description**: Codecov upload token for repository
- **Obtain From**: Codecov → Repository Settings → Upload Token
- **Example**: `abc12345-6789-0def-ghij-klmn01234567`
- **Used In**: `test-suite.yml`

---

### Notifications

#### `SLACK_WEBHOOK_URL` (Optional)
- **Type**: URL
- **Required For**: Slack deployment notifications
- **Description**: Incoming webhook URL for Slack channel
- **Obtain From**: Slack → Apps → Incoming Webhooks
- **Format**: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX`
- **Used In**: `deploy-staging.yml`, `deploy-production.yml`

#### `DISCORD_WEBHOOK_URL` (Optional)
- **Type**: URL
- **Required For**: Discord deployment notifications
- **Description**: Webhook URL for Discord channel
- **Obtain From**: Discord → Server Settings → Integrations → Webhooks
- **Format**: `https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz`
- **Used In**: `deploy-staging.yml`, `deploy-production.yml`

---

### API Tokens

#### `DEPLOYMENT_API_TOKEN` (Optional)
- **Type**: Token
- **Required For**: Deployment record tracking
- **Description**: API token for updating deployment records
- **Generate**: Custom token from your deployment tracking system
- **Used In**: `deploy-production.yml`

#### `GITHUB_TOKEN`
- **Type**: Token (Automatic)
- **Required For**: All workflows
- **Description**: Automatically provided by GitHub Actions
- **Scope**: Repository access for Actions
- **Used In**: All workflows (automatic)

---

### Security Scanning

#### `GITLEAKS_LICENSE` (Optional)
- **Type**: License Key
- **Required For**: Gitleaks Pro features (optional)
- **Description**: Gitleaks license key for premium features
- **Obtain From**: Gitleaks website (if using Pro)
- **Used In**: `security-audit.yml`

---

## How to Add Secrets

### Via GitHub Web Interface

1. Navigate to your repository on GitHub
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Enter secret name (exact match from above)
5. Paste secret value
6. Click **Add secret**

### Via GitHub CLI

```bash
# Install GitHub CLI if not already installed
# https://cli.github.com/

# Authenticate
gh auth login

# Add a secret
gh secret set SECRET_KEY --body "$(python scripts/generate-secret-key.py)"

# Add from file
gh secret set STAGING_SSH_KEY < ~/.ssh/staging_deploy_key

# Add interactively (paste and press Ctrl+D)
gh secret set PRODUCTION_DATABASE_URL
```

---

## Secret Priority

### Critical (Required for Deployment)
1. `SECRET_KEY`
2. `STAGING_DATABASE_URL`
3. `PRODUCTION_DATABASE_URL`
4. `STAGING_SSH_KEY`
5. `STAGING_HOST`
6. `STAGING_USER`
7. `PRODUCTION_SSH_KEY`
8. `PRODUCTION_HOST`
9. `PRODUCTION_USER`

### High Priority (Required for Full Functionality)
10. `SENTRY_DSN`
11. `CODECOV_TOKEN`

### Optional (Enhanced Features)
12. `SLACK_WEBHOOK_URL`
13. `DISCORD_WEBHOOK_URL`
14. `DEPLOYMENT_API_TOKEN`
15. `SENTRY_AUTH_TOKEN`
16. `GITLEAKS_LICENSE`

---

## Security Best Practices

### SSH Keys
- ✅ Use separate keys for staging and production
- ✅ Use Ed25519 keys (modern, secure, fast)
- ✅ Restrict SSH user to deployment directories only
- ✅ Use SSH key passphrases (store in secret manager)
- ✅ Rotate keys every 90 days
- ❌ Never commit private keys to repository
- ❌ Never reuse keys across environments

### Database Credentials
- ✅ Use separate databases for staging and production
- ✅ Use read-write user with minimal privileges (no DROP, CREATE USER)
- ✅ Rotate passwords every 90 days
- ✅ Use connection pooling (configured in app)
- ✅ Enable SSL/TLS for database connections
- ❌ Never use superuser credentials
- ❌ Never hardcode passwords in code

### Secret Keys
- ✅ Use cryptographically random 256-bit keys
- ✅ Rotate SECRET_KEY every 6-12 months
- ✅ Use different SECRET_KEY for staging and production
- ❌ Never use default or weak keys
- ❌ Never share keys between environments

### API Tokens
- ✅ Use minimal scopes/permissions required
- ✅ Rotate tokens regularly
- ✅ Revoke tokens immediately if compromised
- ❌ Never log tokens in application logs
- ❌ Never expose tokens in error messages

---

## Validation Checklist

Before deploying, verify all required secrets are configured:

```bash
# List all secrets (names only, values hidden)
gh secret list

# Check if specific secret exists
gh secret list | grep SECRET_KEY
gh secret list | grep STAGING_DATABASE_URL
gh secret list | grep PRODUCTION_DATABASE_URL
```

### Required Secrets Checklist
- [ ] `SECRET_KEY`
- [ ] `STAGING_DATABASE_URL`
- [ ] `STAGING_SSH_KEY`
- [ ] `STAGING_HOST`
- [ ] `STAGING_USER`
- [ ] `PRODUCTION_DATABASE_URL`
- [ ] `PRODUCTION_SSH_KEY`
- [ ] `PRODUCTION_HOST`
- [ ] `PRODUCTION_USER`
- [ ] `SENTRY_DSN`
- [ ] `CODECOV_TOKEN`

---

## Troubleshooting

### Secret Not Found Error
**Error**: `Error: Secret SECRET_KEY not found`
**Solution**: Add the secret via GitHub Settings → Secrets and variables → Actions

### Invalid Database URL
**Error**: `asyncpg.InvalidCatalogNameError: database "geohub" does not exist`
**Solution**: Verify database URL format and database exists

### SSH Authentication Failed
**Error**: `Permission denied (publickey)`
**Solution**:
1. Verify public key is in `~/.ssh/authorized_keys` on server
2. Verify private key is correct (no extra newlines)
3. Test SSH manually: `ssh -i key_file user@host`

### Sentry DSN Invalid
**Error**: `Sentry DSN is invalid`
**Solution**: Copy DSN exactly from Sentry project settings, including `https://` prefix

---

## Environment-Specific Configuration

### Staging Environment
- Lower resource allocation
- More verbose logging
- Relaxed rate limits
- Test Sentry environment (`SENTRY_ENVIRONMENT=staging`)

### Production Environment
- Higher resource allocation
- Production logging level
- Strict rate limits
- Production Sentry environment (`SENTRY_ENVIRONMENT=production-blue` or `production-green`)

---

## Secret Rotation Schedule

### Every 30 Days
- Review access logs
- Audit secret usage

### Every 90 Days
- Rotate SSH keys
- Rotate database passwords

### Every 180 Days
- Rotate SECRET_KEY (requires re-authentication of all users)
- Rotate API tokens

### Immediately
- Rotate any secret that may have been compromised
- Rotate secrets after team member departure
- Rotate after security incident

---

## Support

For questions about secret configuration:
1. Check this documentation
2. Review workflow files in `.github/workflows/`
3. Consult infrastructure team
4. Open GitHub issue with `[infrastructure]` tag

---

*Last Updated: 2026-02-12*
