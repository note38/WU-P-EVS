# Clerk Authentication Integration Setup

This document explains how to set up Clerk authentication with your voting system database, including role-based permissions and security features.

## Overview

The system now uses Clerk for authentication while maintaining your existing database structure. Users can only sign in if their email exists in your database (either as an admin or voter), and they are automatically assigned the appropriate role based on their database record.

## 🔐 Security Features

### 1. Email Verification

- **Database Check**: Users can only sign in if their email exists in your database
- **Role Assignment**: Users are automatically assigned admin or voter roles based on their database record
- **Unauthorized Prevention**: Users without database records are automatically deleted from Clerk

### 2. Role-Based Access Control

- **Admin Routes**: Only users with admin role can access `/admin_dashboard` and `/api/admin/*`
- **Voter Routes**: Only users with voter role can access `/ballot` and `/api/voters/*`
- **Automatic Redirects**: Users are redirected to appropriate pages based on their role

### 3. Webhook Security

- **User Validation**: All new users are validated against your database
- **Automatic Cleanup**: Unauthorized users are automatically deleted
- **Role Synchronization**: User roles are automatically synced between Clerk and your database

## Database Changes

### Schema Updates

The following fields have been added to your database:

1. **User Model**:

   - `clerkId` (String, unique) - Stores Clerk's user ID
   - `password` (String, optional) - Made optional since Clerk handles auth

2. **Voter Model**:
   - `clerkId` (String, unique) - Stores Clerk's user ID
   - `hashpassword` (String, optional) - Made optional since Clerk handles auth

### Migration

Run the following command to apply database changes:

```bash
npx prisma db push
npx prisma generate
```

## Clerk Dashboard Configuration

### 1. Webhook Setup

1. Go to your Clerk Dashboard
2. Navigate to **Webhooks**
3. Create a new webhook endpoint:
   - **Endpoint URL**: `https://your-domain.com/api/webhooks/clerk`
   - **Events to send**:
     - `user.created`
     - `user.updated`
     - `user.deleted`
     - `session.created`
     - `session.revoked`

### 2. Environment Variables

**CRITICAL**: Add these to your `.env.local` file to fix the hosted sign-in redirect issue:

```env
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key
CLERK_SECRET_KEY=sk_test_your_secret_key

# IMPORTANT: These URLs must point to your custom pages, not hosted ones
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/ballot
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/ballot

# Webhook Secret (from Clerk Dashboard)
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret

# Development URLs (for local testing)
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=http://localhost:3000/ballot
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=http://localhost:3000/ballot
```

### 3. Clerk Dashboard Settings

**IMPORTANT**: In your Clerk Dashboard, you need to configure the following:

1. **Go to Clerk Dashboard → User & Authentication → Email, Phone, Username**
2. **Disable "Allow sign up"** - This prevents unauthorized sign-ups
3. **Go to Clerk Dashboard → User & Authentication → Social Connections**
4. **Configure Google OAuth** if you want to use Google sign-in
5. **Go to Clerk Dashboard → Paths**
6. **Set Sign-in path** to `/sign-in` (your custom page)
7. **Set Sign-up path** to `/sign-up` (your custom page)

### 4. Allowed Origins

In your Clerk Dashboard, add your domain to the allowed origins for:

- Sign-in redirect URLs
- Sign-up redirect URLs
- OAuth redirect URLs

For development, add:

- `http://localhost:3000`
- `https://77cf3bcd6119.ngrok-free.app` (your ngrok URL)

## How It Works

### 1. Sign-In Process

When a user tries to sign in:

1. **Email Check**: The system first checks if the email exists in your database
2. **User Type Detection**: Determines if the user is an admin or voter
3. **Clerk Authentication**: If email exists, proceeds with Clerk authentication
4. **Role Assignment**: User role is automatically set in Clerk metadata
5. **Database Sync**: User data is synced between Clerk and your database
6. **Role-Based Redirect**: User is redirected to appropriate page based on role

### 2. Webhook Processing

The webhook handles these events:

- **user.created**:
  - Checks if email exists in database
  - If not found, deletes the user from Clerk
  - If found, syncs user data and sets role
- **user.updated**: Updates user data and role in database
- **user.deleted**: Removes user from database
- **session.created**: Handles session creation

### 3. Access Control

- **Admins**: Can access `/admin_dashboard` and admin API routes
- **Voters**: Can access `/ballot` and voter API routes
- **Unauthorized**: Redirected to sign-in page with error message

## API Endpoints

### Check Email Existence

```
POST /api/auth/check-email
Content-Type: application/json

{
  "email": "user@example.com"
}
```

Response:

```json
{
  "allowed": true,
  "userType": "admin",
  "message": "User found as admin"
}
```

### Validate Session

```
GET /api/auth/validate-session
```

Response:

```json
{
  "userType": "admin",
  "role": "ADMIN",
  "userId": 1,
  "username": "admin_user",
  "avatar": "/avatars/avatar.jpg"
}
```

## Usage in Components

### Using the Custom Hook

```tsx
import { useClerkAuth } from "@/hooks/use-clerk-auth";

function MyComponent() {
  const { user, isAdmin, isVoter, isLoading } = useClerkAuth();

  if (isLoading) return <div>Loading...</div>;

  if (isAdmin) {
    return <div>Admin Dashboard</div>;
  }

  if (isVoter) {
    return <div>Voter Interface</div>;
  }

  return <div>Not authenticated</div>;
}
```

### Role-Based Route Protection

```tsx
// In your layout or page components
useEffect(() => {
  if (isLoaded && !isUserLoading && databaseUser && !isAdmin) {
    // If user is not admin, redirect to appropriate page
    router.push("/ballot");
  }
}, [isLoaded, isUserLoading, databaseUser, isAdmin, router]);
```

## Security Features

1. **Email Verification**: Only users with emails in your database can sign in
2. **Role-Based Access**: Admins and voters have different access levels
3. **Database Sync**: User data is automatically synced between Clerk and your database
4. **Webhook Verification**: All webhook requests are verified using Clerk's signature
5. **Automatic Cleanup**: Unauthorized users are automatically deleted
6. **Session Validation**: All sessions are validated against database records

## Troubleshooting

### Common Issues

1. **Webhook Not Working**:

   - Check webhook URL is correct
   - Verify webhook secret in environment variables
   - Check server logs for webhook errors

2. **User Not Found**:

   - Ensure user email exists in database
   - Check if user was properly synced via webhook
   - Verify user role is set correctly

3. **Authentication Errors**:

   - Verify Clerk environment variables
   - Check if user has proper role in database
   - Ensure webhook is processing correctly

4. **Role Assignment Issues**:

   - Check Clerk user metadata for role
   - Verify database sync is working
   - Check webhook logs for role assignment

5. **Redirected to Hosted Sign-in Page**:
   - **CRITICAL**: Check your environment variables
   - Ensure `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` is set
   - Verify Clerk Dashboard paths are configured correctly
   - Check that your custom sign-in page exists at `/sign-in`

### Debug Mode

Enable debug logging by adding to your `.env`:

```env
DEBUG=clerk:*
```

## Migration from NextAuth

If you're migrating from NextAuth:

1. Update your components to use `useClerkAuth()` instead of NextAuth hooks
2. Remove NextAuth configuration files
3. Update middleware to use Clerk middleware
4. Test authentication flow thoroughly
5. Verify role-based access control is working

## Support

For issues related to:

- **Clerk**: Check [Clerk Documentation](https://clerk.com/docs)
- **Database**: Check Prisma logs and database connection
- **Webhooks**: Check server logs and webhook delivery status
- **Role Assignment**: Check Clerk user metadata and webhook logs

## Testing

### Test Cases

1. **Admin Sign-In**:

   - Use admin email from database
   - Should redirect to `/admin_dashboard`
   - Should have admin permissions

2. **Voter Sign-In**:

   - Use voter email from database
   - Should redirect to `/ballot`
   - Should have voter permissions

3. **Unauthorized Sign-In**:

   - Use email not in database
   - Should show error message
   - Should not create Clerk user

4. **Role-Based Access**:

   - Admin trying to access voter routes should be redirected
   - Voter trying to access admin routes should be redirected

5. **OAuth Sign-In**:
   - Google sign-in should work with proper role assignment
   - Should redirect based on user role

## Quick Fix for Hosted Sign-in Redirect

If you're still being redirected to the hosted sign-in page:

1. **Check your `.env.local` file** and ensure these variables are set:

   ```env
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   ```

2. **In Clerk Dashboard**:

   - Go to **Paths** section
   - Set **Sign-in path** to `/sign-in`
   - Set **Sign-up path** to `/sign-up`

3. **Restart your development server**:

   ```bash
   npm run dev
   ```

4. **Clear browser cache** and try again

The key is ensuring that your environment variables and Clerk Dashboard settings are pointing to your custom pages, not the hosted ones.
