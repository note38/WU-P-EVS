# Election Status Auto Update - GitHub Actions Cron Job

This GitHub Actions workflow automatically updates election statuses every minute by calling the cron endpoint.

## Setup Instructions

### 1. Required GitHub Secrets

You need to set up the following secrets in your GitHub repository:

**Go to: Repository Settings → Secrets and variables → Actions → New repository secret**

#### `CRON_SECRET`
- **Description**: Secret token for authenticating cron requests
- **Value**: A secure random string (e.g., generated using `openssl rand -hex 32`)
- **Example**: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

#### `DEPLOYMENT_URL` 
- **Description**: Your application's production URL (without trailing slash)
- **Value**: Your Vercel deployment URL
- **Example**: `https://your-app-name.vercel.app`

### 2. Environment Variable Setup

Make sure your deployment (Vercel) has the same `CRON_SECRET` environment variable set:

**In Vercel Dashboard:**
1. Go to your project settings
2. Navigate to Environment Variables
3. Add `CRON_SECRET` with the same value as your GitHub secret

### 3. Workflow Configuration

The workflow is configured to:
- ✅ Run every minute (`* * * * *`)
- ✅ Allow manual triggering via GitHub Actions UI
- ✅ Use proper authentication with CRON_SECRET
- ✅ Provide detailed logging and error handling
- ✅ Display update results and statistics

## Usage

### Automatic Execution
The workflow runs automatically every minute. You can monitor executions in:
**Repository → Actions → Election Status Auto Update**

### Manual Execution
1. Go to **Repository → Actions**
2. Click **Election Status Auto Update**
3. Click **Run workflow**
4. Optionally provide a reason for manual trigger
5. Click **Run workflow** button

## Monitoring and Logs

### Successful Execution Logs
```
🚀 Triggering election status update...
⏰ Current time: 2024-01-15 10:30:00
📊 Response Status: 200
📄 Response Body: {"success":true,"message":"Updated 2 election(s)","updatedCount":2}
✅ Election status update completed successfully
📈 Updated elections: 2
💬 Message: Updated 2 election(s)
🗳️ Updated Elections:
  - Student Council Election (ID: 1) → ACTIVE
  - Faculty Senate Election (ID: 3) → COMPLETED
🏁 Election status cron job completed at 2024-01-15 10:30:05
```

### No Updates Needed
```
🚀 Triggering election status update...
📊 Response Status: 200
✅ Election status update completed successfully
📈 Updated elections: 0
💬 Message: No elections need status updates
```

### Error Handling
```
❌ Election status update failed with status: 401
💥 Error response: {"error":"Unauthorized","message":"Invalid secret token"}
```

## Customization

### Change Frequency
Edit `.github/workflows/election-status-cron.yml`:

```yaml
schedule:
  # Every 5 minutes
  - cron: '*/5 * * * *'
  
  # Every hour at minute 0
  - cron: '0 * * * *'
  
  # Every day at 6:00 AM UTC
  - cron: '0 6 * * *'
```

### Cron Expression Reference
- `* * * * *` - Every minute
- `*/5 * * * *` - Every 5 minutes
- `0 * * * *` - Every hour
- `0 */6 * * *` - Every 6 hours
- `0 9 * * *` - Daily at 9:00 AM UTC
- `0 9 * * 1-5` - Weekdays at 9:00 AM UTC

## Security Features

✅ **Authentication**: Uses CRON_SECRET bearer token
✅ **User-Agent**: Identifies as GitHub Actions cron
✅ **HTTPS**: All requests use secure connections
✅ **Secret Protection**: Sensitive values stored as GitHub secrets
✅ **Error Handling**: Prevents information leakage in logs

## Troubleshooting

### Common Issues

1. **401 Unauthorized Error**
   - Check that `CRON_SECRET` matches between GitHub and Vercel
   - Verify secret is set correctly in both places

2. **Workflow Not Running**
   - Ensure the repository has Actions enabled
   - Check that the workflow file is in the main/master branch
   - Verify cron syntax is correct

3. **404 Not Found**
   - Check `DEPLOYMENT_URL` is correct
   - Ensure the cron endpoint exists and is deployed

4. **Rate Limiting**
   - Consider reducing frequency if hitting API limits
   - Monitor Vercel function execution limits

### Manual Testing

Test the cron endpoint manually using curl:

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "User-Agent: github-actions-cron/1.0" \
  https://your-app.vercel.app/api/cron/election-status
```

## Integration with Project

This cron job complements the existing election status management:

- **Frontend Hook**: `useElectionAutoStatus` (runs when viewing admin dashboard)
- **Manual API**: `/api/elections/auto-status-update` (manual triggers)
- **Cron Job**: `/api/cron/election-status` (automated background updates)

The GitHub Actions cron ensures status updates continue even when no one is actively using the admin dashboard.