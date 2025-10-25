# Deployment Guide - Gemini Browser

This guide covers deploying the Gemini Browser to Cloudflare Pages.

## Prerequisites

- A Cloudflare account (free tier works)
- A GitHub account with this repository
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

## Cloudflare Pages Deployment

### Step 1: Connect Your Repository

1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Pages** in the sidebar
3. Click **Create a project**
4. Click **Connect to Git**
5. Authorize Cloudflare to access your GitHub account
6. Select the `web-browser` repository

### Step 2: Configure Build Settings

Configure the following build settings:

- **Production branch**: `main`
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/` (leave empty)

### Step 3: Set Environment Variables

In the Cloudflare Pages project settings, add the following environment variables:

#### Required Variables

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `VITE_GEMINI_API_KEY` | Your API key | Get from [Google AI Studio](https://aistudio.google.com/apikey) |

#### Optional Variables

| Variable Name | Default Value | Description |
|--------------|---------------|-------------|
| `VITE_GEMINI_MODEL` | `models/gemma-3-27b-it` | Gemini model to use |

**Important Notes:**
- Environment variables in Cloudflare Pages must use the `VITE_` prefix to be accessible in the browser
- Never commit your API key to the repository
- The API key will be embedded in the client-side code, so use API key restrictions in Google Cloud Console

### Step 4: Deploy

1. Click **Save and Deploy**
2. Cloudflare will automatically build and deploy your application
3. The first deployment typically takes 2-5 minutes
4. Once complete, you'll receive a `*.pages.dev` URL

### Step 5: Configure Custom Domain (Optional)

1. In your Cloudflare Pages project, go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain name
4. Follow the DNS configuration instructions
5. Wait for DNS propagation (usually a few minutes)

## Environment Variable Configuration

### Local Development

For local development, create a `.env.local` file in the project root:

```bash
# Copy the example file
cp .env.local.example .env.local

# Edit with your API key
VITE_GEMINI_API_KEY=your_api_key_here
GEMINI_API_KEY=your_api_key_here
VITE_GEMINI_MODEL=models/gemma-3-27b-it
GEMINI_MODEL=models/gemma-3-27b-it
```

### Production (Cloudflare Pages)

Environment variables are set in the Cloudflare Dashboard:

1. Go to your Pages project
2. Click **Settings** → **Environment variables**
3. Add variables for **Production** and **Preview** environments
4. Click **Save**
5. Redeploy for changes to take effect

## API Key Security

### Restricting Your API Key

To secure your Gemini API key:

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find your API key
3. Click **Edit API key**
4. Under **Application restrictions**:
   - Select **HTTP referrers (web sites)**
   - Add your Cloudflare Pages domain: `https://your-project.pages.dev/*`
   - Add your custom domain if applicable: `https://yourdomain.com/*`
5. Under **API restrictions**:
   - Select **Restrict key**
   - Enable only **Generative Language API**
6. Click **Save**

### Rate Limiting

Be aware of Gemini API quotas:
- Free tier: 15 requests per minute
- Consider implementing client-side rate limiting for production use

## Continuous Deployment

Cloudflare Pages automatically deploys:
- **Production**: Every push to the `main` branch
- **Preview**: Every pull request creates a preview deployment

### Deployment Workflow

1. Make changes locally
2. Commit and push to a feature branch
3. Create a pull request
4. Cloudflare creates a preview deployment
5. Review the preview
6. Merge to `main` for production deployment

## Troubleshooting

### Build Failures

**Issue**: Build fails with "Module not found"
- **Solution**: Ensure all dependencies are in `package.json`, run `npm install` locally first

**Issue**: Build fails with "Out of memory"
- **Solution**: Cloudflare Pages has 1GB memory limit. This project should build fine, but check for memory leaks

### Runtime Errors

**Issue**: "Gemini API key not found"
- **Solution**: Verify `VITE_GEMINI_API_KEY` is set in Cloudflare environment variables
- **Solution**: Redeploy after adding environment variables

**Issue**: API calls fail with CORS errors
- **Solution**: Check that `_headers` file is in the `public/` directory
- **Solution**: Verify API key restrictions allow your domain

**Issue**: Service Worker not registering
- **Solution**: Ensure `sw.js` is in the `public/` directory
- **Solution**: Check browser console for specific errors
- **Solution**: Verify HTTPS is enabled (required for service workers)

### Performance Issues

**Issue**: Slow initial load
- **Solution**: Service worker will cache assets after first visit
- **Solution**: Consider enabling Cloudflare's "Auto Minify" for JS/CSS/HTML

**Issue**: Screenshot previews not loading
- **Solution**: This is expected behavior - the thum.io service may be slow or blocked
- **Solution**: The app gracefully falls back to a placeholder view

## Monitoring

### Cloudflare Analytics

View deployment and traffic analytics:
1. Go to your Pages project
2. Click **Analytics**
3. Monitor:
   - Page views
   - Unique visitors
   - Bandwidth usage
   - Build history

### Error Tracking

Check for errors:
1. Browser DevTools Console (F12)
2. Cloudflare Pages **Functions** logs (if using Functions)
3. Network tab for failed API requests

## Updating the Deployment

### Update Environment Variables

1. Go to **Settings** → **Environment variables**
2. Edit the variable
3. Click **Save**
4. Trigger a new deployment (push to main or manual redeploy)

### Manual Redeploy

1. Go to **Deployments**
2. Find the deployment you want to redeploy
3. Click **⋯** → **Retry deployment**

### Rollback

1. Go to **Deployments**
2. Find a previous successful deployment
3. Click **⋯** → **Rollback to this deployment**

## Advanced Configuration

### Custom Build Command

If you need to customize the build process, update `package.json`:

```json
{
  "scripts": {
    "build": "vite build",
    "build:production": "NODE_ENV=production vite build"
  }
}
```

### Preview Deployments

Every pull request gets a unique preview URL:
- Format: `https://<hash>.<project>.pages.dev`
- Automatically deleted when PR is closed
- Uses preview environment variables

## Support

For issues specific to:
- **Gemini Browser**: Open an issue on GitHub
- **Cloudflare Pages**: Check [Cloudflare Docs](https://developers.cloudflare.com/pages/)
- **Gemini API**: See [Google AI Studio Docs](https://ai.google.dev/docs)

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)

