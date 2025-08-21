# Render.com Deployment Guide

## 🚀 **Deploying MMDA Revenue System to Render**

### **Prerequisites**
- GitHub repository connected to Render
- Neon PostgreSQL database (already configured)
- Render account

### **Step 1: Connect Repository to Render**

1. **Go to [Render Dashboard](https://dashboard.render.com)**
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Select the repository: `MMDAs`**

### **Step 2: Configure Build Settings**

- **Name:** `mmda-revenue-server`
- **Environment:** `Node`
- **Region:** Choose closest to your users
- **Branch:** `main`
- **Build Command:** `cd server && npm install && npm run build`
- **Start Command:** `cd server && npm start`

### **Step 3: Set Environment Variables (CRITICAL)**

In your Render service dashboard, go to **Environment → Environment Variables** and add:

| Key | Value | Description |
|-----|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `5000` | Server port |
| `DATABASE_URL` | `postgresql://neondb_owner:npg_zp53GFvLgBlI@ep-muddy-pine-adb2hv5q-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require` | **Your Neon database URL** |
| `JWT_SECRET` | `your-super-secret-jwt-key-change-this-in-production` | **Change this to a secure random string** |
| `CLIENT_URL` | `https://your-frontend-domain.com` | **Your frontend URL** |

### **Step 4: Deploy**

1. **Click "Create Web Service"**
2. **Wait for build to complete**
3. **Check logs for any errors**

### **Step 5: Verify Deployment**

- **Health Check:** `https://your-service-name.onrender.com/health`
- **API Endpoint:** `https://your-service-name.onrender.com/api/auth/login`

### **Troubleshooting**

#### **Error: "DATABASE_URL must start with postgresql://"**
- **Solution:** Ensure `DATABASE_URL` is set correctly in Render environment variables
- **Check:** Go to Environment → Environment Variables in Render dashboard

#### **Error: "Cannot find module '../generated/prisma'"**
- **Solution:** This should be fixed with our latest build script updates
- **Check:** Ensure the latest code is deployed

#### **Build Fails**
- **Solution:** Check build logs in Render dashboard
- **Common Issues:** Node.js version, missing dependencies

### **Environment Variable Template**

```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://neondb_owner:npg_zp53GFvLgBlI@ep-muddy-pine-adb2hv5q-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CLIENT_URL=https://your-frontend-domain.com
```

### **Important Notes**

- **Never commit sensitive environment variables to Git**
- **Use Render's environment variable system for secrets**
- **The `DATABASE_URL` must be exactly as shown in your Neon dashboard**
- **JWT_SECRET should be a long, random string for security**

### **Support**

If you encounter issues:
1. Check Render deployment logs
2. Verify environment variables are set correctly
3. Ensure your Neon database is accessible
4. Check that the latest code with Prisma fixes is deployed
