# Domo Starter for NodeJS, Typescript, Prisma - Type Grapqhl

It includes features for:

- Auth0 authentication
- Graphql Subscriptions
- Triggers on Operations
- Express compatible

## Main dependencies

- Node 20.9.0
- Express 4.19.2
- Prisma 5.11.0
- Graphql 15.3.0
- Apollo Server 4.10.2
- TypeGraphql 1.1.1
- Prisma TypeGraphql 0.27.2
- TypeScript 5.4.3
- Nodemon 3.1.0

## Run

1. Install

   ```bash
    npm i --legacy-peer-deps
   ```

2. Generate types

   ```bash
    npx prisma generate
   ```

3. Run

   ```bash
    npm run dev
   ```

## Production run

1. Build

   ```bash
    npm run build
   ```

2. Run

   ```bash
    npm run start
   ```