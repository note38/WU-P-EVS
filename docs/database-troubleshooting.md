# Database Connection Troubleshooting

This document provides guidance on troubleshooting database connection issues that may cause the data logs to not appear in production while working fine in localhost.

## Common Issues

### 1. Missing DATABASE_URL Environment Variable

The most common issue is that the `DATABASE_URL` environment variable is not set in the production environment.

#### Solution:

1. Check your Vercel project settings
2. Go to your project → Settings → Environment Variables
3. Add a new environment variable:
   - Name: `DATABASE_URL`
   - Value: Your production database connection string
   - Check "Production" environment

### 2. Incorrect Database Connection String

The database connection string might be incorrect or missing required parameters.

#### Solution:

Ensure your DATABASE_URL follows this format:

```
postgresql://username:password@host:port/database_name
```

For example:

```
postgresql://user:password@localhost:5432/voting_system
```

## Testing Database Connection

### 1. Using the Test Endpoint

We've created a test endpoint to verify database connectivity:

```
GET /api/test-db
```

This endpoint will return information about:

- Database connection status
- Environment variables
- Table counts (if connected)

### 2. Using the Test Script

Run the database test script locally:

```bash
npm run test:db
```

This will:

- Check if DATABASE_URL is set
- Test database connectivity
- Show table counts

### 3. Manual Verification

You can also manually check your environment variables:

```bash
# For Linux/Mac
echo $DATABASE_URL

# For Windows Command Prompt
echo %DATABASE_URL%

# For Windows PowerShell
echo $env:DATABASE_URL
```

## Debugging Steps

### Step 1: Check Environment Variables

1. Log into your Vercel dashboard
2. Navigate to your project
3. Go to Settings → Environment Variables
4. Verify that `DATABASE_URL` is set for Production environment

### Step 2: Check Application Logs

1. In Vercel, go to your project
2. Click on the "Logs" tab
3. Look for error messages related to:
   - Prisma client initialization
   - Database connection failures
   - Environment variable issues

### Step 3: Test the API Endpoints

Try accessing these endpoints directly:

- `/api/test-db` - Test database connectivity
- `/api/logs/voters` - Test voter logs endpoint
- `/api/logs/votes` - Test vote logs endpoint
- `/api/logs/admin` - Test admin logs endpoint
- `/api/logs/activity` - Test activity logs endpoint

Example:

```
curl https://your-domain.com/api/test-db
```

### Step 4: Check Prisma Client Initialization

The application now includes better error handling for Prisma client initialization. Check the logs for messages like:

- "Prisma client is not initialized"
- "DATABASE_URL environment variable is not set"
- "Failed to create Prisma client"

## Production Deployment Checklist

- [ ] DATABASE_URL environment variable is set in Vercel
- [ ] Database connection string is correct
- [ ] Database is accessible from the production environment
- [ ] Required database tables exist
- [ ] Database user has proper permissions

## Common Error Messages

### "Prisma client is not initialized"

This means the DATABASE_URL environment variable is not set in production.

### "Database connection failed"

This indicates the connection string is set but the database is not accessible.

### "Failed to fetch data"

This usually means the API endpoint is working but there's an issue with the database query.

## Contact Support

If you continue to experience issues:

1. Check the application logs in Vercel
2. Verify your database is accessible from the internet (if using external database)
3. Ensure your database credentials are correct
4. Contact your database provider if issues persist
