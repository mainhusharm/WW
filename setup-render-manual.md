# Manual Render Setup (No Shell Scripts)

Since Render's free plan doesn't support shell scripts, follow these manual steps:

## 🗄️ Step 1: Create Database

1. **Go to Render Dashboard**
2. **Click "New +" → "PostgreSQL"**
3. **Configure:**
   - Name: `trading-platform-db`
   - Database: `trading_platform`
   - User: `trading_user`
   - Region: Choose closest to your app
   - Plan: Free

4. **Wait for creation (2-3 minutes)**
5. **Copy the External Database URL** (you'll need this)

## 🚀 Step 2: Create Backend Service

1. **Go to Render Dashboard**
2. **Click "New +" → "Web Service"**
3. **Connect GitHub Repository:**
   - Repository: `mainhusharm/WW`
   - Branch: `main`

4. **Configure Service:**
   - Name: `trading-platform-backend`
   - Environment: `Node`
   - Build Command: `npm install && npm run db:generate`
   - Start Command: `node backend-server-render.js`
   - Plan: Free

5. **Add Environment Variables:**
   ```
   NODE_ENV = production
   PORT = 10000
   DATABASE_URL = [paste your database URL here]
   ```

6. **Click "Create Web Service"**
7. **Wait for deployment (5-10 minutes)**

## 🎨 Step 3: Create Frontend Service

1. **Go to Render Dashboard**
2. **Click "New +" → "Static Site"**
3. **Connect GitHub Repository:**
   - Repository: `mainhusharm/WW`
   - Branch: `main`

4. **Configure Service:**
   - Name: `trading-platform-frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Plan: Free

5. **Add Environment Variables:**
   ```
   VITE_API_URL = https://trading-platform-backend.onrender.com
   NODE_ENV = production
   ```

6. **Click "Create Static Site"**
7. **Wait for deployment (5-10 minutes)**

## 🔧 Step 4: Setup Database Tables

1. **Wait for backend deployment to complete**
2. **Go to your backend service dashboard**
3. **Copy the service URL** (e.g., `https://trading-platform-backend.onrender.com`)
4. **Visit the setup endpoint:**
   ```
   https://your-backend-url.onrender.com/setup-db
   ```
5. **You should see:**
   ```json
   {
     "success": true,
     "message": "Database tables and indexes created successfully",
     "timestamp": "2024-01-01T00:00:00.000Z"
   }
   ```

## 🧪 Step 5: Test the System

1. **Test Backend Health:**
   ```
   https://your-backend-url.onrender.com/health
   ```

2. **Test Database Connection:**
   ```
   https://your-backend-url.onrender.com/test-db
   ```

3. **Test Frontend:**
   - Go to your frontend URL
   - Visit `/signup-prisma`
   - Try registering a user
   - Check `/customer-service-dashboard`

## 📝 Environment Variables Summary

### Backend Service:
```
NODE_ENV = production
PORT = 10000
DATABASE_URL = postgresql://trading_user:password@dpg-xxxxx-a.oregon-postgres.render.com/trading_platform
```

### Frontend Service:
```
VITE_API_URL = https://trading-platform-backend.onrender.com
NODE_ENV = production
```

## 🔄 Alternative: Use render.yaml

If you prefer, you can use the `render-prisma.yaml` file:

1. **Rename `render-prisma.yaml` to `render.yaml`**
2. **Push to GitHub**
3. **In Render Dashboard, click "New +" → "Blueprint"**
4. **Connect your repository**
5. **Render will automatically create all services**

## 🚨 Troubleshooting

### Backend Issues:
- Check build logs in Render dashboard
- Verify DATABASE_URL is correct
- Ensure all dependencies are in package.json

### Database Issues:
- Visit `/setup-db` endpoint manually
- Check database is running
- Verify connection string format

### Frontend Issues:
- Check VITE_API_URL is correct
- Verify build completed successfully
- Check browser console for errors

### Common Errors:
1. **"Module not found"** → Check package.json dependencies
2. **"Database connection failed"** → Verify DATABASE_URL
3. **"Build failed"** → Check Node.js version (should be 18+)
4. **"CORS error"** → Backend CORS is configured for all origins

## 📊 Monitoring

### Health Check URLs:
- Backend: `https://your-backend.onrender.com/health`
- Database Setup: `https://your-backend.onrender.com/setup-db`
- Database Test: `https://your-backend.onrender.com/test-db`
- API Users: `https://your-backend.onrender.com/api/users`

### Logs:
- Check Render dashboard logs for both services
- Monitor database connection status
- Watch for build and deployment errors

## 🎯 Final Result

After completing these steps, you'll have:
- ✅ PostgreSQL database with Prisma schema
- ✅ Backend API with all endpoints
- ✅ Frontend with signup and dashboard
- ✅ Real-time user management system
- ✅ All running on Render's free plan

The system will be accessible at:
- Frontend: `https://trading-platform-frontend.onrender.com`
- Backend: `https://trading-platform-backend.onrender.com`
- Database: Managed by Render
