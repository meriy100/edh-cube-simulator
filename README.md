This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## Database (Prisma + Vercel Postgres)

This project saves parsed card entries from the top page to a Postgres database via Prisma.

1. Set DATABASE_URL in your environment (already present in .env.development.local for local dev).
2. Create the database tables from the Prisma schema:

```bash
npm run prisma:push
# or
yarn prisma:push
```

This will create the Card table defined in prisma/schema.prisma.

On submit, the app calls POST /api/cards and performs a bulk insert (createMany) for all parsed entries.

## Code Formatting (Prettier)

This project uses [Prettier](https://prettier.io/) for code formatting.

- Format all files:

```bash
npm run format
# or
yarn format
```

- Check formatting without writing changes:

```bash
npm run format:check
# or
yarn format:check
```
