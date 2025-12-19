# WUP Develop Voting System

Develop Electronic Voting System for Wesleyan University-Philippines

## Prerequisites

Before running the application, ensure you have:

- Node.js (v18 or higher)
- PostgreSQL database
- Clerk account for authentication
- Resend account for email services

## Environment Setup

1. Copy the `.env.example` file to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Configure the following environment variables in your `.env` file:

### Database Configuration

```env
DATABASE_URL="postgresql://username:password@localhost:5432/voting_system"
```

### Clerk Authentication

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
CLERK_SECRET_KEY="your_clerk_secret_key"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/api/auth/validate-session?redirect=true"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/api/auth/validate-session?redirect=true"
```

### Email Service (Resend)

```env
RESEND_API_KEY="your_resend_api_key"
```

### Application Configuration

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

## Getting Clerk Keys

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application or select an existing one
3. Navigate to "API Keys" section
4. Copy the "Publishable Key" and "Secret Key"
5. Paste them into your `.env` file

## Configuring Clerk Dashboard for Email-Only Authentication

To ensure consistent behavior and prevent the "Use another method" button:

1. Login to your Clerk Dashboard
2. Navigate to "User & Authentication"
3. Under "Email" section:
   - Enable "Email verification code"
   - Disable "Email verification link" (optional)
4. Under other authentication methods:
   - Disable "Phone"
   - Disable "Username" (if not needed)
   - Disable "Password" (if not needed)
   - Disable "Passkeys"
   - Disable all "SSO connections"

## Installation

```bash
npm install
```

## Database Setup

1. Make sure your PostgreSQL database is running
2. Run the database migrations:
   ```bash
   npx prisma migrate dev
   ```
3. Seed the database (optional):
   ```bash
   npm run seed
   ```

## Running the Application

### Development Mode

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## Troubleshooting

### "Failed to fetch" Error During Sign-in

This error typically occurs due to:

1. **Missing Environment Variables**: Ensure all Clerk environment variables are properly set in your `.env` file.

2. **Network Connectivity Issues**: Check your internet connection and firewall settings.

3. **Incorrect Clerk Keys**: Verify that your `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are correct.

4. **Clerk Dashboard Configuration**: Make sure only email code authentication is enabled in your Clerk Dashboard.

### Debugging Authentication Flow

Use the built-in debug script to diagnose authentication issues:

1. Open your browser's developer console
2. Navigate to your sign-in page
3. Paste the contents of `scripts/debug-auth-flow.js` and press Enter
4. Check the console output for diagnostic information

## Testing

Run the test suite:

```bash
npm test
```

## Deployment

For deployment instructions, refer to the [Deployment Configuration](docs/deployment.md) documentation.
