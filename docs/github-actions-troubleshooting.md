# GitHub Actions Cron Job Error Troubleshooting

This guide helps you troubleshoot the "Process completed with exit code 3" error in your GitHub Actions cron job.

## Understanding Exit Code 3

Exit code 3 from curl typically indicates:
- **URL Malformed**: The URL is incorrectly formatted
- **Failed to Parse URL**: Issues with URL construction
- **Protocol Failure**: Problems with the HTTP request

## Common Causes and Solutions

### 1. Incorrect DEPLOYMENT_URL Secret

**Problem**: The `DEPLOYMENT_URL` secret is missing, malformed, or has trailing slashes.

**Solution**:
1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Check the `DEPLOYMENT_URL` value
4. Ensure it follows this format: `https://your-app.vercel.app` (no trailing slash)
5. Verify the URL is accessible by visiting it in your browser

### 2. Missing CRON_SECRET

**Problem**: The `CRON_SECRET` is not set or doesn't match the Vercel environment variable.

**Solution**:
1. Verify `CRON_SECRET` is set in GitHub Secrets
2. Check that it matches exactly with the Vercel environment variable
3. Ensure there are no extra spaces or characters

### 3. Network/Connectivity Issues

**Problem**: GitHub Actions cannot reach your deployed application.

**Solution**:
1. Verify your application is deployed and running
2. Check if there are any firewall restrictions
3. Ensure your Vercel application is not in a development-only state

## Diagnostic Steps

### Step 1: Check GitHub Secrets

1. Go to your repository → Settings → Secrets and variables → Actions
2. Verify both secrets are present:
   - `CRON_SECRET`: Should be a long random string
   - `DEPLOYMENT_URL`: Should be your Vercel URL without trailing slash

### Step 2: Verify Vercel Configuration

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Verify `CRON_SECRET` is set with the same value as GitHub

### Step 3: Test the Endpoint Manually

Use one of these methods to test:

**Using curl**:
```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_CRON_SECRET_HERE" \
  -H "User-Agent: github-actions-cron/1.0" \
  https://your-app.vercel.app/api/cron/election-status
```

**Using the test scripts**:
```bash
# Bash (Linux/Mac)
./scripts/test-cron.sh

# PowerShell (Windows)
./scripts/test-cron.ps1

# Node.js
npm run debug:cron
```

### Step 4: Check GitHub Actions Logs

1. Go to your repository → Actions
2. Click on the failed workflow run
3. Expand the "Call Election Status Cron Endpoint" step
4. Look for specific error messages

## Improved Error Handling

The updated workflow now includes better error handling:

1. **Secret Validation**: Checks if required secrets are set
2. **URL Sanitization**: Removes trailing slashes from URLs
3. **Detailed Logging**: Provides more informative error messages
4. **Graceful Error Handling**: Distinguishes between client and server errors

## Preventive Measures

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
Add this to your workflow for more detailed information:
```yaml
env:
  DEBUG: true
```

### 2. Manual Testing with Debug Script
Run the debug script locally:
```bash
npm run debug:cron
```

### 3. Check Vercel Function Logs
1. Go to your Vercel dashboard
2. Select your project
3. Go to the "Functions" tab
4. Find the `/api/cron/election-status` function
5. Check its logs for any errors

## Contact Support

If you continue to experience issues:

1. Document the exact error message from GitHub Actions
2. Include the timestamp of the failed run
3. Provide your DEPLOYMENT_URL (without the secret)
4. Share any relevant logs from Vercel

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- [Curl Exit Codes Documentation](https://curl.se/libcurl/c/libcurl-errors.html)