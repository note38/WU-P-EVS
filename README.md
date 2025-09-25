# Voting System

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
npm run seed
npm prisma i
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Election Status Cron Job

This project includes a GitHub Actions workflow for automatically updating election statuses.

### Setup Instructions

1. Set up the following GitHub Secrets:
   - `CRON_SECRET`: A secure random string
   - `DEPLOYMENT_URL`: Your Vercel application URL (e.g., `https://your-app.vercel.app`)

2. Set the same `CRON_SECRET` as an environment variable in Vercel.

For detailed setup instructions, see [GitHub Actions Documentation](docs/github-actions.md).

### Troubleshooting

If you encounter the "Process completed with exit code 3" error, refer to the [GitHub Actions Troubleshooting Guide](docs/github-actions-troubleshooting.md).

If you encounter "000 status code" errors, refer to the [GitHub Actions 000 Error Guide](docs/github-actions-000-error.md).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.