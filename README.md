# Carlos Santos - Personal Brand Website

A modern personal brand website built with SvelteKit 2, Svelte 5, TypeScript, and Tailwind CSS. This site showcases photography, provides exclusive Patreon member content, and integrates with Supabase for backend services.

## Project Status

**Task 1: Project Initialization and Setup** - COMPLETED
**Task 2: Supabase Setup** - COMPLETED
**Task 3: Install and Configure shadcn-svelte** - COMPLETED

The project foundation is now in place with:

- SvelteKit 2.49.1 with Svelte 5.45.6
- TypeScript strict mode enabled
- Tailwind CSS v4 configured
- shadcn-svelte component library with base components
- Supabase client library installed
- ESLint and Prettier configured
- Git repository initialized

## Tech Stack

- **Frontend Framework**: SvelteKit 2 + Svelte 5
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase
- **Authentication**: Supabase Auth (to be configured)
- **Database**: Supabase PostgreSQL (to be configured)
- **UI Components**: shadcn-svelte

## Prerequisites

- Node.js 20+ (LTS recommended)
- npm or pnpm package manager
- Git

## Getting Started

### 1. Clone and Install

```bash
# Install dependencies
npm install
```

### 2. Environment Setup

Copy the environment template and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:

- `PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (server-side only)
- `PATREON_WEBHOOK_SECRET` - Your Patreon webhook secret

**Note**: Supabase and Patreon integration will be configured in upcoming tasks.

### 3. Development Server

Start the development server:

```bash
npm run dev

# Or open in browser automatically
npm run dev -- --open
```

The site will be available at `http://localhost:5173` (or next available port).

## UI Components

This project uses [shadcn-svelte](https://www.shadcn-svelte.com/) for UI components with Svelte 5 compatibility.

### Installed Components

- **Button** - Variants: default, outline, ghost, destructive, link
- **Card** - Includes CardHeader, CardTitle, CardDescription, CardContent
- **Separator** - Visual dividers between sections

### Adding New Components

To add additional shadcn-svelte components:

```bash
npx shadcn-svelte@latest add [component-name]
```

Example:

```bash
npx shadcn-svelte@latest add badge
```

### Theme Configuration

Theme colors and styles are configured in `src/app.css` using CSS variables:

- Base style: `default`
- Base color: `slate` (professional, developer-focused palette)
- Supports both light and dark modes

Component imports:

```svelte
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
</script>
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Run TypeScript type checking
- `npm run lint` - Check code formatting and linting
- `npm run format` - Auto-format code with Prettier

## Project Structure

```
carlos-santos-site/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   └── ui/   # shadcn-svelte UI components
│   │   └── utils.ts  # Utility functions (cn helper)
│   ├── routes/       # SvelteKit routes and pages
│   └── app.css       # Global Tailwind CSS + theme
├── static/           # Static assets
├── components.json   # shadcn-svelte configuration
├── .env.example      # Environment variables template
└── package.json      # Project dependencies
```

## Architecture

For detailed information about the system design, technology choices, and architectural decisions, see **[ARCHITECTURE.md](./ARCHITECTURE.md)**.

Key topics covered:

- System overview and design approach
- Why monolithic SvelteKit was chosen over alternatives
- Database architecture and Row-Level Security
- Data flow from Patreon webhooks to database
- Type system and TypeScript conventions
- Scalability considerations and extension points

## Next Steps

The following tasks are planned for upcoming development:

1. **Task 4**: Landing Page Design and Implementation
2. **Task 5**: Build photography showcase with galleries
3. **Task 6**: Implement Patreon member portal
4. **Task 7**: Add webhook handling for Patreon sync
5. **Task 8**: Deploy to production

## Development Notes

- **TypeScript**: Strict mode is enabled for maximum type safety
- **Tailwind CSS**: Using v4 with modern configuration
- **Code Quality**: ESLint and Prettier configured for consistent code style
- **Git**: .gitignore configured to exclude sensitive files and build artifacts

## Deployment

This project is optimized for deployment on modern serverless platforms. The recommended platform is Vercel due to its seamless SvelteKit integration, but instructions for other platforms are also provided.

### Patreon Integration Setup

Before deploying to production, you need to configure Patreon webhooks for automatic subscriber management. See **[PATREON_SETUP.md](./PATREON_SETUP.md)** for complete step-by-step instructions.

Quick overview:

- Create Patreon app in Developer Portal
- Configure webhook URL pointing to your deployment
- Set up webhook secret as environment variable
- Test webhook delivery and database updates

### Environment Variables in Production

All environment variables from `.env.example` must be configured in your deployment platform before deploying. The application validates these at startup and will fail with clear error messages if any are missing or invalid.

**Required Variables:**

- `PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key (safe for client)
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (server-only, bypasses RLS)
- `PATREON_WEBHOOK_SECRET` - Your Patreon webhook secret for signature verification

**Security Notes:**

- Use PRODUCTION Supabase credentials (separate from development)
- Never commit actual secrets to version control
- The service role key bypasses Row-Level Security - keep it secret
- Environment variables prefixed with `PUBLIC_` are bundled in client code

### Deploying to Vercel (Recommended)

Vercel provides the best developer experience for SvelteKit applications with automatic deployments and preview environments.

#### Step 1: Initial Setup

1. Install Vercel CLI (optional but recommended):

   ```bash
   npm install -g vercel
   ```

2. Connect your repository:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your Git repository (GitHub, GitLab, or Bitbucket)
   - Vercel will automatically detect SvelteKit

#### Step 2: Configure Environment Variables

**Via Vercel Dashboard:**

1. Navigate to your project in Vercel
2. Go to **Settings** → **Environment Variables**
3. Add each variable from `.env.example`:

   **PUBLIC_SUPABASE_URL**
   - Value: Your production Supabase URL (e.g., `https://abcdefgh.supabase.co`)
   - Environment: Production, Preview (optional)

   **PUBLIC_SUPABASE_ANON_KEY**
   - Value: Your production Supabase anonymous key
   - Environment: Production, Preview (optional)

   **SUPABASE_SERVICE_ROLE_KEY**
   - Value: Your production Supabase service role key
   - Environment: Production only (keep separate for previews)
   - Note: This is sensitive - only add to Production environment

   **PATREON_WEBHOOK_SECRET**
   - Value: Your Patreon webhook secret
   - Environment: Production only

4. Click "Save" after adding each variable

**Via Vercel CLI:**

```bash
# Set production environment variables
vercel env add PUBLIC_SUPABASE_URL production
vercel env add PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add PATREON_WEBHOOK_SECRET production

# Follow prompts to enter values securely
```

#### Step 3: Deploy

**Automatic Deployment:**

- Push to your main/master branch
- Vercel automatically builds and deploys
- Check deployment logs in Vercel dashboard

**Manual Deployment via CLI:**

```bash
vercel --prod
```

#### Step 4: Verify Deployment

1. Check the deployment URL provided by Vercel
2. Verify the application loads correctly
3. Check browser console for any environment variable errors
4. Test Supabase connectivity (authentication, data fetching)

#### Troubleshooting Vercel Deployments

**Build Failures:**

- Check build logs in Vercel dashboard
- Verify all dependencies are in `package.json`
- Ensure TypeScript types are correct (`npm run check`)

**Environment Variable Issues:**

- Application will fail fast if variables are missing
- Check error logs for specific missing variables
- Remember: Changes require redeployment (trigger via dashboard or git push)

**Runtime Errors:**

- Check Function Logs in Vercel dashboard
- Verify Supabase credentials are correct and for production project
- Ensure webhook URLs are updated in Patreon settings

### Deploying to Netlify

Netlify is another excellent option with similar features to Vercel.

#### Step 1: Initial Setup

1. Go to [netlify.com](https://www.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect your Git repository
4. Netlify will detect SvelteKit automatically

#### Step 2: Build Settings

Netlify should auto-detect these, but verify:

- **Build command**: `npm run build`
- **Publish directory**: `build`

#### Step 3: Environment Variables

1. In your site dashboard, go to **Site settings** → **Environment variables**
2. Click "Add a variable" for each required variable:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `PATREON_WEBHOOK_SECRET`

3. Set scopes:
   - Production: All variables
   - Deploy Previews: Public variables only (optional)

#### Step 4: Deploy

- Push to your repository
- Netlify automatically builds and deploys
- Check deploy logs for any issues

### Other Deployment Options

#### Cloudflare Pages

1. Connect repository at [pages.cloudflare.com](https://pages.cloudflare.com)
2. Build settings:
   - Build command: `npm run build`
   - Output directory: `build`
3. Add environment variables in **Settings** → **Environment variables**
4. Note: May require SvelteKit adapter changes (`@sveltejs/adapter-cloudflare`)

#### Self-Hosted (Node.js)

For self-hosted deployments using Node.js:

1. Install the Node adapter:

   ```bash
   npm install -D @sveltejs/adapter-node
   ```

2. Update `svelte.config.js`:

   ```javascript
   import adapter from '@sveltejs/adapter-node';
   ```

3. Build the application:

   ```bash
   npm run build
   ```

4. Set environment variables on your server:

   ```bash
   export PUBLIC_SUPABASE_URL="your-url"
   export PUBLIC_SUPABASE_ANON_KEY="your-key"
   export SUPABASE_SERVICE_ROLE_KEY="your-service-key"
   export PATREON_WEBHOOK_SECRET="your-secret"
   ```

5. Run the server:
   ```bash
   node build
   ```

### Post-Deployment Configuration

After successful deployment, update external service configurations:

#### Supabase

- No changes needed - credentials already configured

#### Patreon

1. Go to [Patreon Developer Portal](https://www.patreon.com/portal/registration/register-clients)
2. Navigate to your app's webhook settings
3. Update webhook URL to: `https://your-domain.com/api/webhooks/patreon`
4. Verify webhook secret matches your `PATREON_WEBHOOK_SECRET` environment variable

### Deployment Checklist

Before deploying to production:

- [ ] All environment variables configured in deployment platform
- [ ] Using PRODUCTION Supabase credentials (not development)
- [ ] Build succeeds locally (`npm run build`)
- [ ] TypeScript checks pass (`npm run check`)
- [ ] Tests pass (if implemented)
- [ ] `.env` and sensitive files in `.gitignore`
- [ ] No hardcoded secrets in source code
- [ ] Patreon webhook URL updated to production domain
- [ ] Database migrations applied (if any)
- [ ] Supabase RLS policies reviewed and tested

### Monitoring and Maintenance

**Vercel:**

- Monitor deployments in Vercel dashboard
- Check Function Logs for runtime errors
- Set up alerts for deployment failures

**Netlify:**

- Check Deploy Logs for build issues
- Monitor Functions for runtime errors
- Set up deploy notifications

**Environment Variable Updates:**

- Changing variables requires redeployment
- Use platform UI or CLI to update
- Test in preview/staging environment first

## Support

For questions or issues, please refer to:

- [SvelteKit Documentation](https://kit.svelte.dev/)
- [Svelte 5 Documentation](https://svelte.dev/docs/svelte/overview)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Supabase Documentation](https://supabase.com/docs)

---

Built with SvelteKit and Svelte 5
