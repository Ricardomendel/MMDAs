# 🚀 Deployment Guide

This guide covers various deployment options for the MMDA Revenue Mobilization System.

## 📋 Prerequisites

Before deploying, ensure you have:
- [ ] A GitHub repository set up
- [ ] Node.js installed locally
- [ ] Git configured
- [ ] Required API keys and tokens

## 🌐 Deployment Options

### **Option 1: Vercel (Recommended for Full-Stack)**

Vercel is excellent for full-stack applications and offers a generous free tier.

#### Setup Steps:

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy Frontend**
   ```bash
   cd client
   vercel --prod
   ```

4. **Deploy Backend**
   ```bash
   cd server
   vercel --prod
   ```

5. **Configure Environment Variables**
   - Go to your Vercel dashboard
   - Add environment variables from `.env.example`
   - Update `CLIENT_URL` to your frontend URL

#### GitHub Integration:
- Connect your GitHub repository to Vercel
- Automatic deployments on push to main branch
- Preview deployments for pull requests

---

### **Option 2: Railway**

Railway is great for backend deployment with automatic scaling.

#### Setup Steps:

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Connect Repository**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Service**
   - Set root directory to `server`
   - Add build command: `npm run build`
   - Add start command: `npm start`

4. **Environment Variables**
   - Add all variables from `.env.example`
   - Update `CLIENT_URL` to your frontend URL

5. **Deploy Frontend Separately**
   - Use Vercel or Netlify for frontend
   - Update backend CORS settings

---

### **Option 3: Render**

Render offers free hosting for both frontend and backend.

#### Setup Steps:

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Deploy Backend**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Set root directory to `server`
   - Build command: `npm run build`
   - Start command: `npm start`

3. **Deploy Frontend**
   - Click "New +" → "Static Site"
   - Connect your GitHub repository
   - Set root directory to `client`
   - Build command: `npm run build`
   - Publish directory: `build`

4. **Environment Variables**
   - Add backend environment variables
   - Update `CLIENT_URL` in backend

---

### **Option 4: GitHub Pages (Frontend Only)**

GitHub Pages is free but limited to static content.

#### Setup Steps:

1. **Build Frontend**
   ```bash
   cd client
   npm run build
   ```

2. **Deploy to GitHub Pages**
   ```bash
   npm install -g gh-pages
   gh-pages -d build
   ```

3. **Configure Repository**
   - Go to repository Settings
   - Pages section
   - Select source: "Deploy from a branch"
   - Choose `gh-pages` branch

4. **Custom Domain (Optional)**
   - Add your domain in repository settings
   - Update CNAME file

---

### **Option 5: Docker + Cloud Platform**

For more control and scalability.

#### Setup Steps:

1. **Build Docker Images**
   ```bash
   # Build client
   docker build -t mmda-client ./client
   
   # Build server
   docker build -t mmda-server ./server
   ```

2. **Deploy to Cloud Platform**
   - **DigitalOcean App Platform**
   - **Google Cloud Run**
   - **AWS ECS**
   - **Azure Container Instances**

3. **Environment Variables**
   - Set in cloud platform dashboard
   - Update `CLIENT_URL` and `DB_HOST`

---

## 🔧 Environment Configuration

### Required Environment Variables:

```env
# Server Configuration
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-frontend-domain.com

# Database
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=revenue_system
DB_USER=your_username
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# CORS (if needed)
CORS_ORIGIN=https://your-frontend-domain.com
```

### Production Database Setup:

1. **PostgreSQL on Railway/Render**
   - Create new PostgreSQL service
   - Get connection string
   - Update environment variables

2. **External Database (AWS RDS, DigitalOcean)**
   - Create database instance
   - Configure security groups
   - Update connection details

---

## 📱 Frontend Configuration

### Update API Base URL:

```typescript
// client/src/services/api.ts
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-backend-domain.com';
```

### Build Optimization:

```bash
# Production build
cd client
npm run build

# Analyze bundle size
npm run build --analyze
```

---

## 🔒 Security Considerations

### Production Checklist:

- [ ] Use HTTPS everywhere
- [ ] Set strong JWT secret
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set secure headers
- [ ] Use environment variables
- [ ] Regular security updates

### SSL/TLS:

- **Vercel/Railway/Render**: Automatic SSL
- **Custom Domain**: Configure SSL certificate
- **Load Balancer**: Set up SSL termination

---

## 📊 Monitoring & Analytics

### Recommended Tools:

1. **Application Monitoring**
   - Sentry (error tracking)
   - LogRocket (session replay)
   - New Relic (performance)

2. **Infrastructure Monitoring**
   - Uptime Robot (uptime)
   - Pingdom (performance)
   - StatusCake (monitoring)

3. **Analytics**
   - Google Analytics
   - Mixpanel
   - Amplitude

---

## 🚨 Troubleshooting

### Common Issues:

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **Environment Variables**
   - Ensure all required variables are set
   - Check for typos in variable names
   - Verify values are correct

3. **Database Connection**
   - Check database credentials
   - Verify network access
   - Test connection locally

4. **CORS Issues**
   - Update `CLIENT_URL` in backend
   - Configure CORS middleware properly
   - Check browser console for errors

---

## 📈 Scaling Considerations

### When to Scale:

- **Traffic**: >1000 concurrent users
- **Data**: >1GB database size
- **Performance**: Response time >2 seconds

### Scaling Options:

1. **Vertical Scaling**
   - Increase server resources
   - Upgrade database plan
   - Add more memory/CPU

2. **Horizontal Scaling**
   - Load balancer
   - Multiple server instances
   - Database read replicas

3. **CDN**
   - Cloudflare
   - AWS CloudFront
   - Vercel Edge Network

---

## 💰 Cost Estimation

### Free Tier Options:

- **Vercel**: $0/month (frontend + backend)
- **Railway**: $5/month (after free tier)
- **Render**: $0/month (with limitations)
- **GitHub Pages**: $0/month (frontend only)

### Paid Options:

- **Vercel Pro**: $20/month
- **Railway**: $5-50/month
- **Render**: $7-25/month
- **DigitalOcean**: $5-50/month

---

## 🎯 Next Steps

After deployment:

1. **Test thoroughly** on production
2. **Set up monitoring** and alerts
3. **Configure backups** for database
4. **Set up CI/CD** pipeline
5. **Document** deployment process
6. **Train team** on maintenance

---

## 📞 Support

For deployment issues:

1. Check platform documentation
2. Review error logs
3. Test locally first
4. Create GitHub issue
5. Contact platform support

---

**Happy Deploying! 🚀**
