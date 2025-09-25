# Election Status Cron Job Troubleshooting

This document provides guidance for troubleshooting issues with the GitHub Actions cron job for election status updates.

## Common Issues and Solutions

### 1. Exit Code 3 Error

**Error Message**: `Process completed with exit code 3`

**Cause**: This error typically occurs when the curl command fails due to:

- Malformed URL
- Missing or incorrect `DEPLOYMENT_URL` secret
- Network connectivity issues

**Solution**:

1. Verify that `DEPLOYMENT_URL` is set correctly in GitHub Secrets
2. Ensure the URL doesn't have trailing slashes
3. Confirm the application is deployed and accessible

### 2. 401 Unauthorized Error

**Error Message**: `❌ Election status update failed with status: 401`

**Cause**: Authentication failure due to mismatched `CRON_SECRET`

**Solution**:

1. Ensure `CRON_SECRET` is identical in both GitHub Secrets and Vercel Environment Variables
2. Verify there are no extra spaces or characters in the secret values
3. Regenerate the secret if needed

### 3. 404 Not Found Error

**Error Message**: `❌ Election status update failed with status: 404`

**Cause**: The endpoint URL is incorrect or the application is not deployed

**Solution**:

1. Check that `DEPLOYMENT_URL` points to the correct application URL
2. Verify the application is deployed and running
3. Confirm the `/api/cron/election-status` endpoint exists

## Required Configuration

### GitHub Secrets

Set these secrets in your repository:

- `CRON_SECRET`: A secure random string
- `DEPLOYMENT_URL`: Your Vercel application URL (e.g., `https://your-app.vercel.app`)

### Vercel Environment Variables

Set this environment variable in Vercel:

- `CRON_SECRET`: Must match the GitHub secret exactly

## Debugging Steps

### 1. Test Locally

Run the test scripts to verify the endpoint works:

```bash
# Test with bash script
./scripts/test-cron.sh

# Test with PowerShell (Windows)
./scripts/test-cron.ps1

# Test with Node.js script
npm run debug:cron
```

### 2. Check GitHub Actions Logs

1. Go to your repository → Actions
2. Click on the failed workflow run
3. Expand the "Call Election Status Cron Endpoint" step
4. Review the error messages

### 3. Verify Secrets

1. Go to repository Settings → Secrets and variables → Actions
2. Check that both `CRON_SECRET` and `DEPLOYMENT_URL` are set
3. Ensure `DEPLOYMENT_URL` doesn't have trailing slashes

### 4. Check Vercel Logs

1. Go to your Vercel dashboard
2. Select your project
3. Check the logs for the `/api/cron/election-status` endpoint
4. Look for any error messages

## Manual Testing

You can manually trigger the workflow to test it:

1. Go to repository → Actions
2. Select "Election Status Auto Update"
3. Click "Run workflow"
4. Monitor the execution

## Security Considerations

- Keep `CRON_SECRET` secure and random
- Use HTTPS for all communications
- Regularly rotate secrets
- Monitor logs for unauthorized access attempts

## Performance Optimization

For production environments, consider using the configurable workflow with a less frequent schedule:

- Every 5 minutes instead of every minute
- Adjust based on your application's needs

## Contact Support

If issues persist:

1. Check the application logs in Vercel
2. Verify all environment variables are correctly set
3. Ensure the database is accessible
4. Contact the development team with detailed error logs
