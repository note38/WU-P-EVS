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
- A user has previously authenticated with a different method
- Environment variables differ between localhost and deployment

By restricting authentication to only email code in the dashboard, you ensure consistent behavior across all environments.

## Environment Variables:

Ensure these variables are correctly set in your deployment environment:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
```

## Code-Level Configuration:

The code changes we've made will help enforce the email code strategy, but the primary fix needs to happen in the Clerk Dashboard as described above.

## Testing:

After making these changes:

1. Clear your browser cache/cookies for the deployment site
2. Try signing in again
3. You should now see the direct email code input without the "Use another method" option

## Debugging:

If the issue persists, use the debug script at `scripts/debug-auth-flow.js`:

1. Open your browser's developer console
2. Navigate to your sign-in page
3. Paste the script and press Enter
4. Check the console output for diagnostic information

## Additional Notes:

- The issue is primarily caused by Clerk Dashboard configuration, not code
- The CSS changes we made help hide UI elements but won't fix the underlying strategy selection
- Make sure your production environment has the same Clerk keys as your development environment
- If you're using a different Clerk instance for production, ensure it has the same configuration
