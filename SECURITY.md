# Security Guide

This document outlines security best practices and verification procedures for the Carlos Santos website project, with a focus on environment variable and secrets management.

## Table of Contents

- [Environment Variables Security](#environment-variables-security)
- [Security Verification Checklist](#security-verification-checklist)
- [Secret Rotation Procedures](#secret-rotation-procedures)
- [Incident Response](#incident-response)
- [Development Best Practices](#development-best-practices)

## Environment Variables Security

### Classification

Environment variables in this project are classified into two categories:

#### Public Variables (Client-Side Safe)

Variables with the `PUBLIC_` prefix are bundled into client-side JavaScript and visible in browser DevTools.

**Current Public Variables:**

- `PUBLIC_SUPABASE_URL` - Supabase project URL
- `PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (RLS-protected)

**Security Notes:**

- These values are visible to end users
- Supabase anon key is protected by Row-Level Security (RLS) policies
- Never add sensitive credentials with `PUBLIC_` prefix
- Safe to expose but should still be production-specific

#### Private Variables (Server-Side Only)

Variables without the `PUBLIC_` prefix are only available in server-side code.

**Current Private Variables:**

- `SUPABASE_SERVICE_ROLE_KEY` - Full database access, bypasses RLS
- `PATREON_WEBHOOK_SECRET` - Validates webhook signatures

**Security Requirements:**

- NEVER expose these in client-side code
- NEVER log these values (even partially)
- NEVER commit to version control
- Use only in server-side code (`+server.ts`, `hooks.server.ts`)
- Rotate immediately if compromised

### SvelteKit Security Features

The project uses SvelteKit's built-in environment variable security:

**Import Patterns:**

```typescript
// Public variables - available everywhere
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

// Private variables - server-side only (will cause build errors if used client-side)
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
```

**What SvelteKit Does:**

- Prevents private variables from being bundled in client code
- Throws build errors if private variables are imported in client components
- Validates variable access at compile time

**What You Must Do:**

- Always use `$env/static/private` for sensitive variables
- Never construct variable names dynamically to bypass checks
- Never pass private variables to client components as props
- Review build output to ensure no secrets in bundles

## Security Verification Checklist

Use this checklist before each deployment and periodically during development.

### Pre-Deployment Security Audit

#### 1. Version Control Security

- [ ] `.env` and `.env.local` files are in `.gitignore`
- [ ] No `.env` files are tracked by git: `git ls-files | grep -E '\.env$'`
- [ ] No secrets in git history: `git log -p --all -S "supabase" | grep -i "key"`
- [ ] `.env.example` contains only placeholder values
- [ ] No hardcoded secrets in source code

**Verification Commands:**

```bash
# Check if .env files are gitignored
grep -E '\.env$|\.env\.local' .gitignore

# Verify no .env files are tracked
git ls-files | grep -E '\.env$|\.env\.local'

# Search for potential hardcoded secrets (should return nothing concerning)
grep -r "sk_live" src/
grep -r "service_role" src/
grep -r "eyJ" src/  # JWT pattern
```

#### 2. Client Bundle Security

- [ ] Production build succeeds: `npm run build`
- [ ] Build output doesn't contain service role key
- [ ] Build output doesn't contain webhook secrets
- [ ] Client JavaScript bundles don't contain private variables

**Verification Commands:**

```bash
# Build the project
npm run build

# Check build output for secrets (should return nothing)
grep -r "service_role" build/
grep -r "PATREON_WEBHOOK_SECRET" build/

# Inspect client bundles for patterns (should only find PUBLIC_ variables)
find build -name "*.js" -type f -exec grep -l "SUPABASE" {} \;
```

#### 3. Environment Variable Validation

- [ ] All required variables defined in `.env.example`
- [ ] Validation module (`src/lib/server/env.ts`) exists
- [ ] Application fails fast with clear error if variables missing
- [ ] No placeholder values accepted by validation

**Verification Steps:**

1. Remove one variable from `.env`
2. Run `npm run dev`
3. Verify application fails with clear error message
4. Restore variable

#### 4. Deployment Platform Security

- [ ] Production environment variables configured
- [ ] Development credentials separate from production
- [ ] Service role key only in Production environment (not Preview)
- [ ] Webhook secret only in Production environment
- [ ] Team access to production secrets is restricted

#### 5. External Service Security

**Supabase:**

- [ ] RLS policies enabled on all tables
- [ ] Service role key only used server-side
- [ ] Anon key has appropriate RLS restrictions
- [ ] Production Supabase project separate from development

**Patreon:**

- [ ] Webhook signature verification implemented
- [ ] Webhook URL uses HTTPS
- [ ] Webhook secret rotated if ever exposed

### Continuous Security Monitoring

Perform these checks periodically:

**Weekly:**

- Review git commits for potential secret leaks
- Check deployment logs for security errors
- Verify webhook activity for anomalies

**Monthly:**

- Audit access to production secrets
- Review Supabase logs for unusual activity
- Consider rotating webhook secrets

**Quarterly:**

- Full security audit using complete checklist
- Review and update RLS policies
- Rotate all production secrets

## Secret Rotation Procedures

If a secret is compromised or for routine maintenance, follow these procedures:

### Supabase Service Role Key Rotation

**Impact:** High - Server-side functionality will break until updated
**Downtime:** Minimal if coordinated

1. **Generate New Key:**
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Navigate to: Project Settings → API
   - Click "Reset service_role key" (or generate new key if available)
   - Copy the new key immediately

2. **Update Production:**
   - Update `SUPABASE_SERVICE_ROLE_KEY` in deployment platform
   - Trigger redeployment or restart

3. **Verify:**
   - Test webhook endpoints
   - Test admin operations
   - Check deployment logs for errors

4. **Update Development:**
   - Update `.env` (or `.env.local`) in development environments
   - Notify team members to update their local environments

**Timeline:**

- Preparation: 5 minutes
- Execution: 2 minutes
- Verification: 5 minutes
- Total: ~15 minutes downtime possible

### Patreon Webhook Secret Rotation

**Impact:** Medium - Webhooks will fail until updated
**Downtime:** None if coordinated

1. **Generate New Secret:**
   - Go to [Patreon Developer Portal](https://www.patreon.com/portal/registration/register-clients)
   - Navigate to your application
   - Go to Webhooks settings
   - Generate new webhook secret
   - Copy the new secret

2. **Update Application First (Zero-Downtime Strategy):**
   - Update `PATREON_WEBHOOK_SECRET` in deployment platform
   - Deploy updated application
   - At this point, both old and new secrets could be validated (if dual-validation implemented)

3. **Update Patreon Configuration:**
   - Update webhook secret in Patreon settings
   - New webhooks will use new secret

4. **Verify:**
   - Trigger test webhook from Patreon
   - Check application logs for successful verification
   - Monitor webhook delivery logs

**Timeline:**

- Preparation: 5 minutes
- Execution: 5 minutes
- Verification: 5 minutes
- Total: ~15 minutes, no downtime

### Supabase Anon Key Rotation

**Impact:** Critical - All client authentication will break
**Downtime:** Significant unless carefully coordinated

1. **Plan for Downtime:**
   - Schedule during low-traffic period
   - Prepare user notification if necessary

2. **Generate New Key:**
   - Supabase Dashboard → Project Settings → API
   - Reset anon key
   - Copy new key

3. **Update and Deploy:**
   - Update `PUBLIC_SUPABASE_ANON_KEY` in deployment platform
   - Deploy immediately
   - Clear CDN cache if applicable

4. **Verify:**
   - Test user authentication
   - Test data fetching
   - Monitor error logs

**Timeline:**

- Preparation: 15 minutes
- Execution: 5 minutes
- Verification: 10 minutes
- Total: ~30 minutes including potential downtime

## Incident Response

### If a Secret is Exposed

**Immediate Actions (Within 5 Minutes):**

1. **Assess Exposure:**
   - What secret was exposed?
   - Where was it exposed (public repo, logs, error message)?
   - For how long was it exposed?
   - What access does this secret provide?

2. **Revoke Immediately:**
   - Follow rotation procedure for the exposed secret
   - Do NOT wait - rotate immediately even if it causes downtime

3. **Remove from Public View:**
   - If in git: Remove from repository and history (use BFG Repo-Cleaner or git filter-branch)
   - If in logs: Purge or redact logs
   - If in error tracking: Scrub error messages

**Follow-Up Actions (Within 24 Hours):**

4. **Audit Impact:**
   - Check Supabase logs for unauthorized access
   - Check webhook delivery logs for suspicious requests
   - Review application logs for anomalies during exposure period

5. **Update Documentation:**
   - Document the incident (date, secret, exposure method)
   - Update this guide with lessons learned
   - Add preventive measures

6. **Prevent Recurrence:**
   - Add pre-commit hooks to detect secrets
   - Implement automated secret scanning (e.g., gitleaks)
   - Review and improve developer training

### Service Role Key Exposure - Critical Severity

**Why Critical:**

- Bypasses all Row-Level Security policies
- Full read/write access to entire database
- Can create/modify/delete any data

**Immediate Actions:**

1. Rotate key immediately (follow rotation procedure)
2. Audit database for unauthorized modifications
3. Review Supabase logs for suspicious queries
4. Check for data exfiltration

**Investigation:**

- Review all database operations during exposure window
- Check for created/modified/deleted records
- Verify no unauthorized user accounts created
- Examine webhook logs for suspicious patterns

### Webhook Secret Exposure - High Severity

**Why High Severity:**

- Allows forged webhooks from malicious actors
- Could trigger unauthorized membership updates
- Could grant access to non-subscribers

**Immediate Actions:**

1. Rotate webhook secret immediately
2. Review recent webhook deliveries for anomalies
3. Audit subscriber database for unauthorized changes
4. Temporarily disable webhook processing if necessary

**Investigation:**

- Review webhook logs for suspicious sources
- Verify all recent membership changes are legitimate
- Check for patterns indicating automated attacks

## Development Best Practices

### Code Review Checklist

When reviewing pull requests:

- [ ] No hardcoded secrets or credentials
- [ ] Private variables only imported in server-side files
- [ ] No secrets in console.log or error messages
- [ ] Environment variables properly typed and validated
- [ ] New variables documented in `.env.example`
- [ ] Secrets not passed to client components as props

### Secure Coding Practices

**DO:**

- Use `$env/static/private` for sensitive variables
- Validate environment variables at application startup
- Use typed environment objects (`env.ts`)
- Implement proper error handling that doesn't leak secrets
- Document new environment variables in `.env.example`

**DON'T:**

- Hardcode credentials in source code
- Log environment variable values
- Pass private variables to client components
- Use placeholder values in production
- Commit `.env` files to version control
- Expose service role key in client-accessible code

### Local Development Security

**Setup:**

1. Copy `.env.example` to `.env`
2. Use development-specific credentials (separate Supabase project recommended)
3. Never use production credentials in development
4. Keep `.env` file secure and untracked

**Team Collaboration:**

- Share credentials securely (password manager, encrypted channels)
- Never send credentials via email or chat
- Document where to find credentials (project wiki, secrets manager)
- Rotate credentials when team members leave

### Logging Best Practices

**Safe Logging:**

```typescript
// Good - logs status without exposing secrets
console.log('Environment validated successfully');
console.log('Supabase URL:', env.PUBLIC_SUPABASE_URL);

// Bad - exposes secrets
console.log('Service role key:', env.SUPABASE_SERVICE_ROLE_KEY); // NEVER DO THIS
console.log('Environment:', env); // NEVER DO THIS
```

**Error Handling:**

```typescript
// Good - generic error without secret details
catch (error) {
  console.error('Supabase operation failed');
  throw new Error('Database error');
}

// Bad - might expose secrets in stack traces or messages
catch (error) {
  console.error('Supabase error:', error); // Might contain credentials
}
```

## Additional Security Resources

- [SvelteKit Environment Variables](https://kit.svelte.dev/docs/modules#$env-static-private)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [Vercel Environment Variables Security](https://vercel.com/docs/concepts/projects/environment-variables)

## Security Contact

If you discover a security vulnerability, please report it immediately:

1. **DO NOT** create a public GitHub issue
2. Contact project maintainers directly
3. Provide details of the vulnerability
4. Allow time for fix before public disclosure

---

**Last Updated:** 2025-12-15
**Next Scheduled Review:** 2026-01-15
