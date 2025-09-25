# GitHub Actions Cron Job 000 Status Code Error

This document explains the "000 status code" error in GitHub Actions cron jobs and how to resolve it.

## What is the 000 Status Code?

The 000 status code from curl indicates that the request failed to complete successfully. This is not an HTTP status code but rather a curl-specific indicator that the connection could not be established or was terminated before completion.

## Common Causes

### 1. Incorrect or Missing DEPLOYMENT_URL

**Problem**: The `DEPLOYMENT_URL` secret is not set, is set to a placeholder value, or is incorrect.

**Solution**:

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Check the `DEPLOYMENT_URL` value
4. Ensure it's your actual Vercel deployment URL (e.g., `https://your-app-name.vercel.app`)
5. Make sure there are no typos in the URL

### 2. DNS Resolution Issues

**Problem**: GitHub Actions cannot resolve the domain name in your URL.

**Solution**:

1. Verify the domain name is correct
2. Check if the application is deployed and accessible
3. Try accessing the URL in your browser

### 3. Network Connectivity Problems

**Problem**: GitHub Actions runners cannot connect to your application due to network restrictions.

**Solution**:

1. Ensure your Vercel application is publicly accessible
2. Check if there are any firewall rules blocking GitHub Actions IP ranges
3. Verify your application is not in a development-only state

### 4. SSL/TLS Certificate Issues

**Problem**: SSL certificate problems prevent the connection from being established.

**Solution**:

1. Ensure your Vercel application has a valid SSL certificate
2. Check if there are any certificate errors when accessing the URL in a browser

## Diagnostic Steps

### Step 1: Verify GitHub Secrets

1. Go to your repository → Settings → Secrets and variables → Actions
2. Check that `DEPLOYMENT_URL` is set to your actual Vercel URL
3. Ensure `CRON_SECRET` is set and matches your Vercel environment variable

### Step 2: Test URL Accessibility

1. Open your `DEPLOYMENT_URL` in a browser
2. Verify the application loads correctly
3. Try accessing the cron endpoint directly:
   `https://your-app-name.vercel.app/api/cron/election-status`

### Step 3: Run Advanced Debug Script

Use the advanced debug script to get detailed information:

```bash
npm run debug:cron:advanced
```

### Step 4: Check GitHub Actions Logs

1. Go to your repository → Actions
2. Click on the failed workflow run
3. Look for the detailed curl output in the logs

## Solutions

### 1. Fix DEPLOYMENT_URL Secret

Make sure your `DEPLOYMENT_URL` secret is set correctly:

- It should be your actual Vercel deployment URL
- It should not contain placeholder text like "your-deployment-url"
- It should not have trailing slashes
- Example: `https://your-app-name.vercel.app`

### 2. Verify Vercel Deployment

1. Go to your Vercel dashboard
2. Check that your application is deployed successfully
3. Verify the URL is accessible
4. Check the deployment logs for any errors

### 3. Test with Manual curl

Test the endpoint manually from your local machine:

```bash
curl -v \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "User-Agent: github-actions-cron/1.0" \
  https://your-app-name.vercel.app/api/cron/election-status
```

### 4. Check Vercel Logs

1. Go to your Vercel dashboard
2. Select your project
3. Go to the "Functions" tab
4. Find the `/api/cron/election-status` function
5. Check its logs for any errors

## Prevention

### 1. Regular Testing

- Test your cron endpoint regularly using the provided scripts
- Monitor the GitHub Actions logs for any issues

### 2. Environment Synchronization

- Always ensure GitHub Secrets and Vercel Environment Variables are synchronized
- Use the same `CRON_SECRET` value in both places

### 3. URL Validation

- Always store URLs without trailing slashes
- Verify URLs are accessible before setting them as secrets

## Advanced Debugging

If the basic troubleshooting steps don't resolve the issue:

### 1. Enable Verbose Logging

The updated workflow now includes verbose curl output for better debugging.

### 2. Manual Testing with Advanced Debug Script

Run the advanced debug script locally:

```bash
npm run debug:cron:advanced
```

### 3. Check Network Connectivity

Test DNS resolution and port connectivity:

```bash
nslookup your-app-name.vercel.app
telnet your-app-name.vercel.app 443
```

## Contact Support

If you continue to experience issues:

1. Document the exact error message from GitHub Actions
2. Include the timestamp of the failed run
3. Provide your DEPLOYMENT_URL (without the secret)
4. Share any relevant logs from Vercel
