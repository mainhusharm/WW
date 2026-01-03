# 🔧 Add Environment Variables to Render Backend

## 📋 **Required Environment Variables**

You need to add these environment variables to your Render backend service:

### 1. Go to Render Dashboard
1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click on your **Backend** service
3. Go to **Environment** tab
4. Click **"Add Environment Variable"**

### 2. Add These Variables:

```
DATABASE_URL=postgresql://trading_user:LO9gh4RP1imqjzFH4TCxu1CdqZOcJn5g@dpg-d2rgcod6ubrc73elq3a0-a.oregon-postgres.render.com/trading_platform_iv50
```

```
SECRET_KEY=your-secret-key-here
```

```
FLASK_ENV=production
```

```
PORT=10000
```

### 3. Generate Secret Key (if needed):

If you need a secret key, run this in your terminal:

```python
import secrets
print(f"SECRET_KEY={secrets.token_hex(32)}")
```

### 4. Save and Redeploy

1. Click **"Save Changes"**
2. Render will automatically redeploy your backend
3. Wait for deployment to complete (2-3 minutes)

## 🧪 **Test the Connection**

Once deployed, test these endpoints:

```bash
# Health check (should show database connected)
curl https://backend-ox9b.onrender.com/health

# Get customers from database
curl https://backend-ox9b.onrender.com/api/customers

# Get statistics
curl https://backend-ox9b.onrender.com/api/stats
```

## ✅ **Expected Results**

- ✅ **Health endpoint** shows `"database_status": true`
- ✅ **Customers endpoint** returns real users from your database
- ✅ **Stats endpoint** shows actual user counts
- ✅ **Enhanced Data tab** displays real user data

## 🚨 **If Still Not Working**

1. **Check Render logs** for any errors
2. **Verify DATABASE_URL** is correct
3. **Test database connection** using pgHero
4. **Check if users table exists** in your database

---

**After adding these environment variables, your Enhanced Data tab should show real user data from your PostgreSQL database!** 🚀
