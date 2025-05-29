# Voter Credentials Setup Guide

## Overview

This system now includes automated credential sending functionality for voters. When voters are added to elections, they can automatically receive their login credentials via email.

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# Email Configuration (Resend)
RESEND_API_KEY="your_resend_api_key_here"
FROM_EMAIL="WUP Voting System <noreply@yourdomain.com>"

# Application URLs
NEXT_PUBLIC_BASE_URL="http://localhost:3000"  # Update for production
```

## Getting Resend API Key

1. Go to [Resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email domain (or use their free testing domain)
4. Go to API Keys section and create a new API key
5. Copy the API key to your environment variables

## Features Added

### 1. Bulk Credential Sending

- **Endpoint**: `POST /api/elections/[electionId]/voters/send-credentials`
- **Usage**: Send credentials to multiple voters at once
- **Body**: `{ "voterIds": [1, 2, 3] }`

### 2. Individual Credential Sending

- **Endpoint**: `POST /api/voters/[voterId]/send-credentials`
- **Usage**: Send credentials to a specific voter
- **Body**: Empty (automatic password generation)

### 3. Automatic Credential Sending

- When creating a voter with an election assignment, credentials are automatically sent
- Can be disabled by passing `"sendCredentials": false` in the request body

### 4. Enhanced Voter Creation

- **Endpoint**: `POST /api/voters`
- **Enhanced**: Now automatically sends credentials when voter is assigned to an election
- **Security**: Uses secure password generation (12 characters with mixed case, numbers, and symbols)

## Usage Examples

### Send credentials to multiple voters:

```javascript
const response = await fetch(
  `/api/elections/${electionId}/voters/send-credentials`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ voterIds: [1, 2, 3, 4, 5] }),
  }
);
```

### Send credentials to a single voter:

```javascript
const response = await fetch(`/api/voters/${voterId}/send-credentials`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
});
```

### Create voter with automatic credential sending:

```javascript
const response = await fetch("/api/voters", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    yearId: 1,
    electionId: 1,
    sendCredentials: true, // Default is true
  }),
});
```

## Email Template Features

The email template includes:

- Professional WUP branding
- Voter's full name and academic year
- Login credentials (email and password)
- Direct login link
- Security notice about credential confidentiality
- Responsive design for mobile devices

## Security Features

1. **Secure Password Generation**: 12-character passwords with mixed case, numbers, and special characters
2. **Password Hashing**: Passwords are hashed with bcrypt (12 rounds)
3. **Automatic Password Regeneration**: New passwords are generated each time credentials are sent
4. **Credential Tracking**: System tracks when credentials have been sent to voters
5. **Election Validation**: Ensures voters are only sent credentials for valid elections

## Error Handling

The system provides detailed error responses:

- Missing voter information
- Invalid election assignments
- Email delivery failures
- Individual failure tracking in bulk operations

## Frontend Integration

The voter management interface already includes:

- Bulk credential sending for selected voters
- Individual credential resending
- Status indicators for credential delivery
- Success/error notifications

## Troubleshooting

### Common Issues:

1. **Email not sending**:

   - Check RESEND_API_KEY is valid
   - Verify FROM_EMAIL domain is configured in Resend
   - Check server logs for detailed error messages

2. **Invalid login link**:

   - Ensure NEXT_PUBLIC_BASE_URL is set correctly
   - Update for production environment

3. **Password issues**:

   - Passwords are automatically regenerated on each credential send
   - Check if bcrypt is properly installed

4. **Template rendering issues**:
   - Ensure @react-email packages are installed
   - Check that email template path is correct
