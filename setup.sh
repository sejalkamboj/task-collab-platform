#!/bin/bash

echo "╔═══════════════════════════════════════════╗"
echo "║  Task Collaboration Platform - Setup      ║"
echo "╚═══════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}PostgreSQL is not installed!${NC}"
    echo "Please install PostgreSQL first:"
    echo "  Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
    echo "  macOS: brew install postgresql"
    exit 1
fi

echo -e "${BLUE}Setting up database...${NC}"

# Database configuration
DB_NAME="taskcollab"
DB_USER="taskuser"
DB_PASSWORD="taskpass123"

# Create database and user
sudo -u postgres psql << EOF
SELECT 'CREATE DATABASE $DB_NAME' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
    CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
  END IF;
END
\$\$;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
GRANT ALL ON SCHEMA public TO $DB_USER;
EOF

echo -e "${GREEN}✓ Database created${NC}"

# Run migrations
echo -e "${BLUE}Running database migrations...${NC}"
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d $DB_NAME -f backend/src/db/schema.sql
echo -e "${GREEN}✓ Migrations complete${NC}"

# Setup backend
echo -e "${BLUE}Setting up backend...${NC}"
cd backend

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
PORT=3001
NODE_ENV=development
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
EOF

# Install dependencies
npm install
echo -e "${GREEN}✓ Backend setup complete${NC}"

# Setup frontend
echo -e "${BLUE}Setting up frontend...${NC}"
cd ../frontend

# Create .env file
cat > .env << EOF
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
EOF

# Install dependencies
npm install
echo -e "${GREEN}✓ Frontend setup complete${NC}"

cd ..

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Setup Complete! 🎉                    ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo ""
echo "To start the application:"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd backend && npm run dev"
echo ""
echo "Terminal 2 - Frontend:"
echo "  cd frontend && npm run dev"
echo ""
echo "Then open http://localhost:3000 in your browser!"
echo ""
