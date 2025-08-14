# 🌟 MMDA Revenue Mobilization System

A comprehensive cloud-based revenue management system for Metropolitan, Municipal, and District Assemblies (MMDAs) in Ghana. This system streamlines tax collection, property management, and revenue tracking through a modern web application.

## ✨ Features

### 🏠 **Property Management**
- Property registration and assessment
- Tax calculation and billing
- Property search and verification

### 💰 **Revenue Collection**
- Multiple payment methods (Mobile Money, Bank Transfer, Cash)
- Automated tax calculations
- Payment tracking and receipts

### 👥 **User Management**
- Role-based access control (Admin, Staff, Taxpayer)
- User registration and authentication
- Profile management

### 📊 **Reporting & Analytics**
- Revenue reports and analytics
- Payment history tracking
- Performance dashboards

### 🔐 **Security Features**
- JWT authentication
- Role-based permissions
- Secure API endpoints

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Material-UI
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (with mock fallback for development)
- **Authentication**: JWT + bcrypt
- **State Management**: Redux Toolkit

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL (optional for development)

### Installation

1. **Clone the repository**
```bash
   git clone <your-repo-url>
   cd cloud-revenue-mobilization-system
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start Development**
   ```bash
npm run dev
```

   This will start both frontend (port 3000) and backend (port 5000)

### Available Scripts

- `npm run dev` - Start development servers
- `npm run build` - Build for production
- `npm run server` - Start backend only
- `npm run client` - Start frontend only
- `npm run install-all` - Install all dependencies

## 🌐 Deployment Options

### Option 1: GitHub Pages (Frontend Only)
```bash
# Build the frontend
cd client
npm run build

# Deploy to GitHub Pages
npm install -g gh-pages
gh-pages -d build
```

### Option 2: Vercel (Recommended for Full-Stack)
1. Connect your GitHub repository to Vercel
2. Configure build settings:
   - Frontend: `client` directory
   - Backend: `server` directory
3. Deploy automatically on push

### Option 3: Railway
1. Connect GitHub repository to Railway
2. Configure environment variables
3. Deploy with automatic scaling

### Option 4: Render
1. Connect GitHub repository to Render
2. Set up as a web service
3. Configure build and start commands

## 🔧 Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=revenue_system
DB_USER=your_username
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

## 📁 Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   ├── store/         # Redux store
│   │   └── App.tsx        # Main app component
│   └── package.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Express middleware
│   │   ├── config/        # Configuration files
│   │   └── index.ts       # Server entry point
│   └── package.json
├── docker-compose.yml      # Docker configuration
├── package.json            # Root package.json
└── README.md
```

## 🐳 Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build individually
docker build -t revenue-client ./client
docker build -t revenue-server ./server
```

## 🔒 Security Considerations

- All passwords are hashed using bcrypt
- JWT tokens for session management
- Input validation and sanitization
- CORS configuration
- Rate limiting (can be added)

## 📱 Mobile Responsiveness

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- All modern browsers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation

## 🚀 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Integration with banking systems
- [ ] SMS notifications
- [ ] Multi-language support
- [ ] Advanced reporting tools

---

**Built with ❤️ for Ghana's MMDAs**
