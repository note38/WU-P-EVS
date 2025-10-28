# Clerk Dashboard Configuration for Email-Only Authentication

To ensure your deployment environment behaves the same as your localhost (showing direct email code input instead of "Use another method"), you need to configure your Clerk Dashboard settings.

## Steps to Configure:

1. **Login to Clerk Dashboard**
   - Go to https://dashboard.clerk.com/
   - Select your application

2. **Navigate to User & Authentication Settings**
   - In the left sidebar, click on "User & Authentication"

3. **Configure Email Settings**
   - Under the "Email" section:
     - Enable "Email verification code"
     - Disable "Email verification link" (optional but recommended for consistency)
   
4. **Disable Other Authentication Methods**
   - Under "Phone": Disable all options
   - Under "Username": Disable if not needed
   - Under "Password": You can keep this enabled or disable it
   - Under "Passkeys": Disable
   - Under "SSO connections": Disable all unless specifically needed

5. **Configure Allowed Strategies (if available)**
   - Some Clerk plans allow you to restrict authentication strategies
   - If available, set allowed strategies to only include "email_code"

## Why This Happens:

The "Use another method" button appears when:
- Multiple authentication strategies are enabled in the Clerk Dashboard
- A user has previously used a different authentication method
- Environment variables differ between localhost and deployment

By restricting authentication to only email code in the dashboard, you ensure consistent behavior across all environments.

## Environment Variables:

Ensure these variables are correctly set in your deployment environment:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
```

## Testing:

After making these changes:
1. Clear your browser cache/cookies for the deployment site
2. Try signing in again
3. You should now see the direct email code input without the "Use another method" option

## Additional Troubleshooting:

If you're still seeing the "Use another method" button after making these changes:

1. **Check for cached sessions**: 
   - Clear your browser cache and cookies for the deployment site
   - Try signing in with an incognito/private browser window

2. **Verify user accounts**:
   - If a user has previously signed in with a different method, Clerk may default to showing multiple options
   - You may need to reset the user's authentication methods in the Clerk Dashboard

3. **Check environment variables**:
   - Ensure your deployment environment has the correct Clerk keys
   - Make sure there are no conflicting environment variables

4. **Review Clerk Dashboard settings**:
   - Double-check that only email verification code is enabled
   - Ensure no other authentication methods are accidentally enabled

## Code-Level Configuration:

The code changes we've made will help enforce the email code strategy, but the primary fix needs to happen in the Clerk Dashboard as described above.