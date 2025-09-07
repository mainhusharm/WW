# Render Prisma Setup Guide (Free Plan)

Since Render's free plan doesn't support shell scripts, here's how to set up the Prisma database integration using environment variables and manual configuration.

## 🗄️ Step 1: Database Setup

### Option A: Use Render PostgreSQL (Recommended)

1. **Create PostgreSQL Database in Render:**
   - Go to Render Dashboard
   - Click "New +" → "PostgreSQL"
   - Name: `trading-platform-db`
   - Database: `trading_platform`
   - User: `trading_user`
   - Region: Choose closest to your app
   - Plan: Free (1GB storage)

2. **Get Database Connection String:**
   - After creation, go to your database dashboard
   - Copy the "External Database URL"
   - It will look like: `postgresql://trading_user:password@dpg-xxxxx-a.oregon-postgres.render.com/trading_platform`

### Option B: Use External PostgreSQL (Supabase/Neon)

1. **Create account at Supabase or Neon:**
   - Supabase: https://supabase.com
   - Neon: https://neon.tech

2. **Create new project and get connection string**

## 🚀 Step 2: Backend Service Setup

### Create Backend Service in Render:

1. **New Web Service:**
   - Connect your GitHub repository
   - Name: `trading-platform-backend`
   - Environment: `Node`
   - Build Command: `npm install && npm run db:generate`
   - Start Command: `node backend-server.js`
   - Plan: Free

2. **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=postgresql://trading_user:password@dpg-xxxxx-a.oregon-postgres.render.com/trading_platform
   ```

3. **Advanced Settings:**
   - Auto-Deploy: Yes
   - Branch: main

## 🎨 Step 3: Frontend Service Setup

### Create Frontend Service in Render:

1. **New Static Site:**
   - Connect your GitHub repository
   - Name: `trading-platform-frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Plan: Free

2. **Environment Variables:**
   ```
   VITE_API_URL=https://trading-platform-backend.onrender.com
   NODE_ENV=production
   ```

## 🔧 Step 4: Manual Database Migration

Since we can't run shell scripts, we need to manually set up the database:

### Method 1: Use Prisma Studio (Recommended)

1. **Temporarily modify backend-server.js:**
   ```javascript
   // Add this at the top of backend-server.js
   const { PrismaClient } = require('@prisma/client');
   const prisma = new PrismaClient();
   
   // Add this route for database setup
   app.get('/setup-db', async (req, res) => {
     try {
       // This will create tables if they don't exist
       await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "User" (
         "id" TEXT NOT NULL PRIMARY KEY,
         "email" TEXT NOT NULL UNIQUE,
         "password_hash" TEXT NOT NULL,
         "full_name" TEXT,
         "questionnaire_data" JSONB,
         "screenshot_url" TEXT,
         "risk_management_plan" TEXT,
         "status" TEXT NOT NULL DEFAULT 'PENDING',
         "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
         "updated_at" TIMESTAMP(3) NOT NULL
       );`;
       
       await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");`;
       await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "User_status_idx" ON "User"("status");`;
       await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User"("created_at");`;
       
       res.json({ success: true, message: 'Database tables created successfully' });
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   });
   ```

2. **Deploy and visit setup endpoint:**
   - Deploy your backend service
   - Visit: `https://your-backend.onrender.com/setup-db`
   - This will create the necessary tables

### Method 2: Use Database GUI

1. **Connect to your database using a GUI tool:**
   - pgAdmin, DBeaver, or TablePlus
   - Use the external connection string from Render

2. **Run the SQL manually:**
   ```sql
   CREATE TABLE IF NOT EXISTS "User" (
     "id" TEXT NOT NULL PRIMARY KEY,
     "email" TEXT NOT NULL UNIQUE,
     "password_hash" TEXT NOT NULL,
     "full_name" TEXT,
     "questionnaire_data" JSONB,
     "screenshot_url" TEXT,
     "risk_management_plan" TEXT,
     "status" TEXT NOT NULL DEFAULT 'PENDING',
     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updated_at" TIMESTAMP(3) NOT NULL
   );
   
   CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
   CREATE INDEX IF NOT EXISTS "User_status_idx" ON "User"("status");
   CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User"("created_at");
   ```

## 🔗 Step 5: Update Frontend API URL

1. **Update the frontend environment variable:**
   - In Render dashboard, go to your frontend service
   - Update `VITE_API_URL` to your backend URL
   - Example: `https://trading-platform-backend.onrender.com`

2. **Redeploy frontend:**
   - Trigger a new deployment to pick up the environment variable

## 🧪 Step 6: Test the System

1. **Test Backend:**
   - Visit: `https://your-backend.onrender.com/health`
   - Should return: `{"status":"OK","timestamp":"..."}`

2. **Test Database Setup:**
   - Visit: `https://your-backend.onrender.com/setup-db`
   - Should return: `{"success":true,"message":"Database tables created successfully"}`

3. **Test Frontend:**
   - Visit your frontend URL
   - Go to `/signup-prisma`
   - Try registering a user
   - Check `/customer-service-dashboard`

## 📝 Step 7: Environment Variables Summary

### Backend Service Environment Variables:
```
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://trading_user:password@dpg-xxxxx-a.oregon-postgres.render.com/trading_platform
```

### Frontend Service Environment Variables:
```
VITE_API_URL=https://trading-platform-backend.onrender.com
NODE_ENV=production
```

## 🚨 Troubleshooting

### Common Issues:

1. **Database Connection Failed:**
   - Check DATABASE_URL format
   - Ensure database is running
   - Verify credentials

2. **Build Failures:**
   - Check Node.js version (should be 18+)
   - Verify all dependencies are in package.json
   - Check build logs in Render dashboard

3. **API Not Working:**
   - Verify VITE_API_URL is correct
   - Check CORS settings in backend
   - Ensure backend is running

4. **Tables Not Created:**
   - Visit `/setup-db` endpoint manually
   - Check database permissions
   - Verify SQL syntax

## 🔄 Alternative: Use Render's Database Migrations

If you have access to Render's database features:

1. **Create a migration file:**
   ```sql
   -- migration.sql
   CREATE TABLE IF NOT EXISTS "User" (
     "id" TEXT NOT NULL PRIMARY KEY,
     "email" TEXT NOT NULL UNIQUE,
     "password_hash" TEXT NOT NULL,
     "full_name" TEXT,
     "questionnaire_data" JSONB,
     "screenshot_url" TEXT,
     "risk_management_plan" TEXT,
     "status" TEXT NOT NULL DEFAULT 'PENDING',
     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updated_at" TIMESTAMP(3) NOT NULL
   );
   
   CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
   CREATE INDEX IF NOT EXISTS "User_status_idx" ON "User"("status");
   CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User"("created_at");
   ```

2. **Upload and run the migration in Render's database dashboard**

## 📊 Monitoring

### Health Check Endpoints:
- Backend Health: `https://your-backend.onrender.com/health`
- Database Setup: `https://your-backend.onrender.com/setup-db`
- API Users: `https://your-backend.onrender.com/api/users`

### Logs:
- Check Render dashboard logs for both services
- Monitor database connection status
- Watch for build and deployment errors

This setup will give you a fully functional Prisma-based system on Render's free plan without needing shell scripts!
