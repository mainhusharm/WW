# PostgreSQL Deployment Guide for TraderEdge Pro

## 🗄️ Database Setup

### Option 1: Supabase (Recommended - Free Tier)

1. **Create Supabase Account**
   - Go to https://supabase.com
   - Sign up for a free account
   - Create a new project

2. **Get Database Connection String**
   - Go to Settings → Database
   - Copy the "Connection string" (URI format)
   - It will look like: `postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`

3. **Set Environment Variable**
   ```bash
   export DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
   ```

### Option 2: Neon (Free Tier)

1. **Create Neon Account**
   - Go to https://neon.tech
   - Sign up for a free account
   - Create a new project

2. **Get Database Connection String**
   - Copy the connection string from the dashboard
   - It will look like: `postgresql://[user]:[password]@[host]/[database]?sslmode=require`

### Option 3: Railway (Free Tier)

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up for a free account
   - Create a new PostgreSQL database

2. **Get Database Connection String**
   - Copy the DATABASE_URL from the database service

## 🚀 Backend Deployment

### 1. Install Dependencies

```bash
npm install express cors pg
```

### 2. Set Environment Variables

Create a `.env` file:
```env
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
NODE_ENV=production
PORT=3000
```

### 3. Initialize Database

```bash
# Run the database setup script
node setup_database.js
```

### 4. Start the Backend

```bash
# Start the production backend
node production-backend.cjs
```

## 🌐 Frontend Configuration

Update your frontend to use the production backend:

```env
VITE_API_URL=https://www.traderedgepro.com
```

## 📊 Database Schema

The database includes these tables:

- **users** - User registration and profile data
- **user_progress** - User progress and questionnaire data
- **payments** - Payment tracking and history

## 🔧 Testing the Setup

1. **Test Database Connection**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Test Registration**
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "firstName": "Test",
       "lastName": "User",
       "email": "test@example.com",
       "password": "password123",
       "phone": "+1234567890",
       "country": "United States",
       "plan_type": "premium"
     }'
   ```

## 🚨 Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check if DATABASE_URL is set correctly
   - Verify database is running and accessible

2. **SSL Certificate Error**
   - Add `?sslmode=require` to your DATABASE_URL
   - Or set `ssl: { rejectUnauthorized: false }` in production

3. **Table Already Exists**
   - This is normal - the script checks before creating tables

### Logs

Check the backend logs for:
- Database connection status
- Table creation messages
- Registration attempts

## 📈 Production Considerations

1. **Password Hashing**
   - Implement proper password hashing (bcrypt)
   - Never store plain text passwords

2. **JWT Tokens**
   - Replace mock tokens with proper JWT implementation
   - Set appropriate expiration times

3. **Rate Limiting**
   - Implement rate limiting for registration endpoint
   - Add CAPTCHA for production use

4. **Monitoring**
   - Set up database monitoring
   - Monitor registration success rates
   - Set up alerts for failures

## 🔐 Security

- Use environment variables for sensitive data
- Enable SSL/TLS for database connections
- Implement proper input validation
- Use prepared statements to prevent SQL injection
- Set up proper CORS policies
