# 🚀 Render Deployment Guide for Forex Bot Backend

## 📋 **Prerequisites**

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **Git Repository**: Your code must be in a Git repository (GitHub, GitLab, etc.)
3. **Python 3.9+**: Ensure compatibility

## 🔧 **Deployment Steps**

### **Step 1: Prepare Your Repository**

Ensure your repository contains these files:
```
├── render_backend_server.py    # Production backend server
├── requirements.txt            # Python dependencies
├── render.yaml                # Render configuration
├── init_database.py           # Database initialization
└── README.md                  # Project documentation
```

### **Step 2: Connect to Render**

1. **Login to Render Dashboard**
2. **Click "New +" → "Web Service"**
3. **Connect your Git repository**
4. **Select the repository containing your forex bot code**

### **Step 3: Configure the Service**

**Service Name**: `WW-backend` (or your preferred name)

**Environment**: `Python 3`

**Build Command**:
```bash
pip install -r requirements.txt
python init_database.py
```

**Start Command**:
```bash
gunicorn render_backend_server:app --bind 0.0.0.0:$PORT
```

**Health Check Path**: `/api/health`

### **Step 4: Environment Variables**

Add these environment variables:

| Key | Value | Description |
|-----|-------|-------------|
| `PYTHON_VERSION` | `3.9.16` | Python version |
| `RENDER_ENVIRONMENT` | `production` | Environment identifier |

### **Step 5: Deploy**

1. **Click "Create Web Service"**
2. **Wait for the build to complete**
3. **Check the deployment logs for any errors**

## 🐛 **Troubleshooting Common Issues**

### **Issue 1: ModuleNotFoundError: flask_jwt_extended**

**Solution**: The `requirements.txt` now includes `flask-jwt-extended==4.5.3`

**If the issue persists**:
1. Check that `requirements.txt` is in your repository root
2. Ensure the file has no syntax errors
3. Verify all dependencies are listed

### **Issue 2: Database Connection Errors**

**Solution**: The `init_database.py` script runs during build to create the database

**If the issue persists**:
1. Check that `init_database.py` is in your repository
2. Verify the script has execute permissions
3. Check the build logs for database initialization errors

### **Issue 3: Port Binding Issues**

**Solution**: The `render_backend_server.py` uses `$PORT` environment variable automatically

**If the issue persists**:
1. Ensure your start command uses `$PORT`
2. Check that the service is configured as a web service (not background worker)

### **Issue 4: CORS Errors**

**Solution**: Update the CORS origins in `render_backend_server.py` with your actual frontend domain

```python
CORS(app, origins=[
    'https://your-actual-frontend-domain.onrender.com',  # Update this
    'http://localhost:5175',
    'http://localhost:3000'
])
```

## 📊 **Verification Steps**

### **After Successful Deployment**

1. **Health Check**: Visit `https://your-service-name.onrender.com/api/health`
2. **Test Endpoint**: Visit `https://your-service-name.onrender.com/api/test`
3. **YFinance Test**: Test `https://your-service-name.onrender.com/api/yfinance/price/EUR%2FUSD`

### **Expected Responses**

**Health Check**:
```json
{
  "status": "healthy",
  "timestamp": "2025-08-27T22:40:00.000Z",
  "bot_data_count": 2,
  "environment": "production"
}
```

**Test Endpoint**:
```json
{
  "message": "Backend server is working!",
  "timestamp": "2025-08-27T22:40:00.000Z",
  "environment": "production"
}
```

## 🔄 **Updating Your Deployment**

### **Automatic Updates**

- Render automatically redeploys when you push to your main branch
- Monitor the deployment logs for any new errors

### **Manual Updates**

1. **Go to your service dashboard**
2. **Click "Manual Deploy"**
3. **Select the branch/commit to deploy**

## 📈 **Monitoring & Logs**

### **View Logs**

1. **Service Dashboard → Logs**
2. **Real-time logs for debugging**
3. **Build logs for deployment issues**

### **Health Monitoring**

- **Health Check Path**: `/api/health`
- **Automatic restarts** if health checks fail
- **Uptime monitoring** in the dashboard

## 🚨 **Important Notes**

1. **Free Tier Limitations**:
   - Services spin down after 15 minutes of inactivity
   - First request after inactivity may take 30-60 seconds
   - Consider upgrading for production use

2. **Database Persistence**:
   - SQLite database is stored in the instance directory
   - Data persists between deployments
   - Consider external database for production

3. **Environment Variables**:
   - Never commit sensitive data (API keys, passwords)
   - Use Render's environment variable system
   - Update CORS origins for your actual domains

## 🆘 **Getting Help**

### **Render Support**

- **Documentation**: [docs.render.com](https://docs.render.com)
- **Community**: [community.render.com](https://community.render.com)
- **Status Page**: [status.render.com](https://status.render.com)

### **Common Commands**

**Check service status**:
```bash
curl https://your-service-name.onrender.com/api/health
```

**Test YFinance endpoint**:
```bash
curl "https://your-service-name.onrender.com/api/yfinance/price/EUR%2FUSD"
```

## ✅ **Success Checklist**

- [ ] Repository connected to Render
- [ ] Service created and configured
- [ ] Build completed successfully
- [ ] Health check endpoint responding
- [ ] Test endpoint working
- [ ] YFinance endpoints functional
- [ ] Database initialized
- [ ] CORS configured for your frontend
- [ ] Environment variables set
- [ ] Service accessible via HTTPS

---

**🎉 Congratulations!** Your forex bot backend is now deployed on Render and ready for production use!
