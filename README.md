# StoreScore

StoreScore is a full-stack store rating platform where users can browse stores, view community ratings, and submit their own reviews. Administrators can manage users and stores, while store owners can view their store performance.

## Features

- User signup and JWT-based login
- Role-based access for administrators, users, and store owners
- Search, filter, and sort the store directory
- Submit ratings from 1 to 5
- User profile and password management
- Admin dashboard with platform statistics
- Admin forms and tables for users and stores
- Store owner rating overview
- Responsive React interface

## Technology

- React 18 and Vite
- Node.js and Express
- PostgreSQL
- Axios
- JWT and bcryptjs

## Project Structure

```text
client/       React frontend
server/       Express API
database/     PostgreSQL schema and seed script
```

## Setup

Requirements: Node.js 18+ and a Supabase project.

Install dependencies:

```powershell
cd client
npm install

cd ..\server
npm install
```

Configure Supabase:

1. Open the Supabase Dashboard and select **SQL Editor**.
2. Run the contents of `database/schema.sql`.
3. Copy the transaction pooler connection string from **Project Settings > Database > Connection string**.

Create environment files from the included examples:

```text
client/.env
server/.env
```

The client API URL should be:

```text
VITE_API_BASE_URL=http://localhost:5000/api
```

The server environment should include the Supabase connection string and JWT secret:

```text
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@[pooler-host]:6543/postgres?pgbouncer=true
JWT_SECRET=replace_with_a_long_random_secret
PORT=5000
```

The connection string is used over TLS. URL-encode any special characters in the database password. Seed the default administrator with:

```powershell
cd server
npm run seed
```

## Run Locally

Start the API in one terminal:

```powershell
cd server
npm run dev
```

Start the frontend in another terminal:

```powershell
cd client
npm run dev
```

The application runs at `http://localhost:5173` and the API runs at `http://localhost:5000`.

## Main Routes

- `/` - StoreScore overview
- `/stores` - Searchable store directory
- `/login` - User login
- `/signup` - User registration
- `/profile` - User profile and password management
- `/admin` - Administrator dashboard
- `/owner` - Store owner dashboard

## Default Admin Account

The seed script creates this development administrator:

```text
Email: admin@storerating.com
Password: AdminPass@123
```

Change this password before using the application outside local development.
