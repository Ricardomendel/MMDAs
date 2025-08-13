#!/bin/bash

# Cloud-Based Revenue Mobilization System for MMDAs in Ghana
# Setup Script

set -e

echo "🚀 Starting Cloud-Based Revenue Mobilization System Setup..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Check system requirements
print_status "Checking system requirements..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js version: $(node -v)"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed."
    exit 1
fi

print_success "npm version: $(npm -v)"

# Check Docker (optional)
if command -v docker &> /dev/null; then
    print_success "Docker is available"
    DOCKER_AVAILABLE=true
else
    print_warning "Docker not found. Will use local installation."
    DOCKER_AVAILABLE=false
fi

# Check Docker Compose (optional)
if command -v docker-compose &> /dev/null; then
    print_success "Docker Compose is available"
    DOCKER_COMPOSE_AVAILABLE=true
else
    print_warning "Docker Compose not found."
    DOCKER_COMPOSE_AVAILABLE=false
fi

echo ""
print_status "System requirements check completed."
echo ""

# Create necessary directories
print_status "Creating project directories..."

mkdir -p logs
mkdir -p uploads
mkdir -p server/logs
mkdir -p server/uploads

print_success "Directories created successfully."
echo ""

# Copy environment file
print_status "Setting up environment configuration..."

if [ ! -f .env ]; then
    cp env.example .env
    print_success "Environment file created from template."
    print_warning "Please edit .env file with your configuration before starting the application."
else
    print_warning "Environment file already exists. Skipping creation."
fi

echo ""

# Install dependencies
print_status "Installing dependencies..."

# Install root dependencies
print_status "Installing root dependencies..."
npm install

# Install server dependencies
print_status "Installing server dependencies..."
cd server
npm install
cd ..

# Install client dependencies
print_status "Installing client dependencies..."
cd client
npm install
cd ..

print_success "All dependencies installed successfully."
echo ""

# Database setup
print_status "Setting up database..."

if [ "$DOCKER_AVAILABLE" = true ] && [ "$DOCKER_COMPOSE_AVAILABLE" = true ]; then
    print_status "Using Docker for database setup..."
    
    # Start database services
    docker-compose up -d postgres redis
    
    # Wait for database to be ready
    print_status "Waiting for database to be ready..."
    sleep 10
    
    # Run database migrations
    print_status "Running database migrations..."
    cd server
    npm run migrate
    cd ..
    
    print_success "Database setup completed with Docker."
else
    print_warning "Docker not available. Please manually set up PostgreSQL and Redis."
    print_status "Manual setup instructions:"
    echo "1. Install PostgreSQL 14+ and create database 'revenue_system'"
    echo "2. Install Redis 6+"
    echo "3. Update .env file with your database credentials"
    echo "4. Run: cd server && npm run migrate"
fi

echo ""

# Build client for production (optional)
read -p "Do you want to build the client for production? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Building client for production..."
    cd client
    npm run build
    cd ..
    print_success "Client built successfully."
fi

echo ""

# Create startup scripts
print_status "Creating startup scripts..."

# Development startup script
cat > start-dev.sh << 'EOF'
#!/bin/bash
echo "Starting Cloud-Based Revenue Mobilization System in development mode..."
echo "=================================================="

# Start the application
npm run dev

echo ""
echo "Application started successfully!"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:5000"
echo "Database Admin: http://localhost:8080"
echo "Redis Admin: http://localhost:8081"
EOF

chmod +x start-dev.sh

# Production startup script
cat > start-prod.sh << 'EOF'
#!/bin/bash
echo "Starting Cloud-Based Revenue Mobilization System in production mode..."
echo "=================================================="

# Build client
echo "Building client..."
cd client
npm run build
cd ..

# Start with Docker Compose
docker-compose --profile production up -d

echo ""
echo "Application started successfully!"
echo "Frontend: http://localhost"
echo "Backend API: http://localhost/api"
EOF

chmod +x start-prod.sh

print_success "Startup scripts created."
echo ""

# Create health check script
print_status "Creating health check script..."

cat > health-check.sh << 'EOF'
#!/bin/bash
echo "Health Check - Cloud-Based Revenue Mobilization System"
echo "=================================================="

# Check if services are running
echo "Checking services..."

# Check backend API
if curl -s http://localhost:5000/health > /dev/null; then
    echo "✅ Backend API: Running"
else
    echo "❌ Backend API: Not running"
fi

# Check frontend
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend: Running"
else
    echo "❌ Frontend: Not running"
fi

# Check database (if using Docker)
if command -v docker &> /dev/null; then
    if docker ps | grep -q "revenue_system_db"; then
        echo "✅ Database: Running"
    else
        echo "❌ Database: Not running"
    fi
    
    if docker ps | grep -q "revenue_system_redis"; then
        echo "✅ Redis: Running"
    else
        echo "❌ Redis: Not running"
    fi
fi

echo ""
echo "Health check completed."
EOF

chmod +x health-check.sh

print_success "Health check script created."
echo ""

# Create backup script
print_status "Creating backup script..."

cat > backup.sh << 'EOF'
#!/bin/bash
echo "Backup - Cloud-Based Revenue Mobilization System"
echo "=================================================="

BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "Creating backup in: $BACKUP_DIR"

# Backup database
if command -v docker &> /dev/null; then
    echo "Backing up database..."
    docker exec revenue_system_db pg_dump -U postgres revenue_system > "$BACKUP_DIR/database.sql"
fi

# Backup uploads
echo "Backing up uploads..."
cp -r uploads "$BACKUP_DIR/"

# Backup logs
echo "Backing up logs..."
cp -r logs "$BACKUP_DIR/"

# Create archive
tar -czf "$BACKUP_DIR.tar.gz" -C backups "$(basename "$BACKUP_DIR")"
rm -rf "$BACKUP_DIR"

echo "Backup completed: $BACKUP_DIR.tar.gz"
EOF

chmod +x backup.sh

print_success "Backup script created."
echo ""

# Final setup instructions
echo "🎉 Setup completed successfully!"
echo "=================================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Configure your environment:"
echo "   - Edit .env file with your settings"
echo "   - Update database credentials"
echo "   - Configure email and SMS settings"
echo ""
echo "2. Start the application:"
echo "   - Development: ./start-dev.sh"
echo "   - Production: ./start-prod.sh"
echo ""
echo "3. Access the application:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:5000"
echo "   - Database Admin: http://localhost:8080"
echo "   - Redis Admin: http://localhost:8081"
echo ""
echo "4. Useful commands:"
echo "   - Health check: ./health-check.sh"
echo "   - Backup: ./backup.sh"
echo "   - Stop services: docker-compose down"
echo ""
echo "5. Default admin credentials:"
echo "   - Email: admin@mmda-revenue.com"
echo "   - Password: admin123"
echo ""
echo "📚 Documentation:"
echo "   - README.md - Main documentation"
echo "   - docs/ - Detailed documentation"
echo ""
echo "🆘 Support:"
echo "   - Check logs in logs/ directory"
echo "   - Run health check: ./health-check.sh"
echo "   - Review troubleshooting guide in docs/"
echo ""

print_success "Cloud-Based Revenue Mobilization System is ready!"
