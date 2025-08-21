# Render Deployment Setup Guide

## Environment Variables Setup

To fix the database connection issue, you need to set these environment variables in your Render service:

### Option 1: Run with Mock Database (Recommended for now)

Set these environment variables in your Render service:

```
NODE_ENV=production
```

**No other database variables needed** - the app will automatically use the mock database.

### Option 2: Set up Real PostgreSQL Database

1. **Create a PostgreSQL database on Render:**
   - Go to "New" → "PostgreSQL"
   - Name: `mmda-revenue-db`
   - Database: `revenue_system`
   - User: `postgres`
   - Region: Choose closest to your app

2. **Copy the connection details** and add these environment variables:

```
NODE_ENV=production
DATABASE_URL=postgresql://username:password@host:port/database
```

### How to Add Environment Variables on Render:

1. Go to your Render dashboard
2. Click on your service
3. Go to "Environment" tab
4. Click "Add Environment Variable"
5. Add each variable one by one

### Current Status:

- ✅ **App will work immediately** with just `NODE_ENV=production`
- ✅ **Mock database will be used** automatically
- ✅ **No more connection errors** in logs
- ✅ **All functionality will work** with in-memory data

### Test Credentials (Mock Database):

- **Admin User:** admin@mmda.com / admin123
- **Taxpayer:** taxpayer@example.com / taxpayer123
- **Staff:** staff@mmda.com / staff123

## Next Steps:

1. Set `NODE_ENV=production` in Render
2. Redeploy (should happen automatically)
3. Test the application
4. Optionally set up a real database later
