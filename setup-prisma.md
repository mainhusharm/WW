# Prisma Database Setup Guide

## 1. Environment Configuration

Create a `.env` file in the root directory with the following content:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/trading_platform?schema=public"

# Backend Server Configuration
PORT=3001
NODE_ENV=development

# Frontend Configuration
VITE_API_URL=http://localhost:3001
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Database Setup

### Option A: Using PostgreSQL (Recommended)

1. Install PostgreSQL locally or use a cloud service like Supabase, Railway, or Neon
2. Create a database named `trading_platform`
3. Update the `DATABASE_URL` in your `.env` file with your actual credentials

### Option B: Using SQLite (Development)

If you want to use SQLite for development, update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

## 4. Initialize Prisma

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Or create and run migrations
npm run db:migrate
```

## 5. Start the Backend Server

```bash
npm run backend
```

## 6. Start the Frontend

```bash
npm run dev
```

## 7. Access the Application

- **Signup Form**: http://localhost:5175/signup-prisma
- **Customer Service Dashboard**: http://localhost:5175/customer-service-dashboard
- **Backend API**: http://localhost:3001/health

## 8. Database Management

```bash
# Open Prisma Studio (Database GUI)
npm run db:studio

# Reset database
npx prisma db push --force-reset
```

## Features

✅ **Complete Prisma Integration**
- PostgreSQL database with proper schema
- User model with all required fields
- Proper indexing and constraints

✅ **TypeScript Support**
- Full type safety with Prisma client
- Zod validation schemas
- Proper error handling

✅ **Real-time Dashboard**
- Live user data fetching
- Status management
- localStorage integration
- Auto-refresh functionality

✅ **User Registration**
- Comprehensive signup form
- File upload support
- Questionnaire data collection
- Risk management plan input

✅ **API Endpoints**
- User registration: `POST /api/auth/register`
- Fetch users: `GET /api/users`
- Update status: `PATCH /api/users/:id/status`
- Get user: `GET /api/users/:id`

## Testing the System

1. Go to http://localhost:5175/signup-prisma
2. Fill out the registration form with real data
3. Submit the form - data will be saved to PostgreSQL
4. You'll be redirected to the dashboard with your user data
5. Check localStorage in browser dev tools to see stored data
6. The dashboard shows all registered users in real-time
7. You can update user statuses and see changes immediately

## Troubleshooting

- Make sure PostgreSQL is running
- Check that the DATABASE_URL is correct
- Ensure the backend server is running on port 3001
- Check browser console for any errors
- Use Prisma Studio to inspect the database directly
