# Field Service Manager

A field service management application that enables customers to schedule service appointments and automatically assigns them to qualified technicians based on skills, location, and availability.

## Features

- **Customer Portal**: Service request submission and tracking
- **Technician Dashboard**: Job management and completion  
- **Automatic Assignment**: Smart algorithm matches appointments to qualified technicians
- **Real-time Updates**: Track appointment status in real-time
- **Multi-service Support**: Plumbing, electrical, HVAC, roofing, carpentry, painting, landscaping
- **Geographic Coverage**: Work area-based service assignments
- **Feedback System**: Customer ratings and reviews

## Tech Stack

### Backend
- **Node.js 18+** with Express.js 4.18+
- **PostgreSQL 16+** with PostGIS extension
- **Prisma 7.2+** as ORM
- **Redis 7.0+** with Bull Queue for job processing
- **JWT Authentication** with HTTP-only cookies
- **Winston Logging**

### Frontend  
- **Next.js 14+** (App Router) with TypeScript
- **Tailwind CSS 3.3+** for styling
- **React Context** for state management

### Infrastructure
- **Docker** with docker-compose for development
- **PM2** ready for production deployment

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 16+ (with PostGIS extension)
- Redis 7.0+
- Docker & Docker Compose (recommended)

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd <repository-name>
   ```

2. **Create environment file** (REQUIRED)
   ```bash
   cp .env.example .env
   ```

   **⚠️ IMPORTANT**: The `.env` file is required for the application to run. It contains essential configuration like JWT secrets and database connections.

3. **Verify environment variables**
   The `.env` file should contain:
   ```bash
   # Database (PostgreSQL via Docker)
   # Use 'localhost' when running migrations from host, 'postgres' when running in Docker
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/field_service_manager?schema=public"

   # Redis (Docker service name)
   REDIS_URL=redis://redis:6379

   # Authentication (REQUIRED - Change in production!)
   JWT_SECRET=your-super-secret-jwt-key-for-development-change-in-production
   JWT_EXPIRES_IN=7d

   # Application
   NODE_ENV=development
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   TECHNICIAN_FRONTEND_URL=http://localhost:3002
   ```

   **Note**: For Docker deployment, PostgreSQL and Redis URLs use Docker service names (`postgres` and `redis`) instead of `localhost`.

### Development Setup

#### Option 1: Docker (Recommended)

**Complete Setup Steps:**
```bash
# 1. MUST create environment file first
cp .env.example .env

# 2. Start all services including databases and both frontends
docker-compose up -d

# 3. Wait for services to start, then run database setup
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npm run db:seed

# 4. Verify everything is working
curl http://localhost:3001/api/v1/health
```

**Viewing Logs:**
```bash
# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f customer-site
docker-compose logs -f technician-dashboard

# Stop all services
docker-compose down
```

**After setup, access the applications:**
- Customer Portal: http://localhost:3000
- Technician Dashboard: http://localhost:3002
- Backend API: http://localhost:3001/api/v1/health

**⚠️ Common Setup Issues:**
- **"secretOrPrivateKey must have a value"**: Missing `.env` file - run `cp .env.example .env`
- **429 Rate Limit**: Too many login attempts - wait 15 minutes or restart backend
- **Connection errors**: Services still starting - wait 30 seconds and try again
- **Prisma migration errors**: Ensure PostgreSQL is running and DATABASE_URL is correct

#### Option 2: Local Development

1. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend/customer-site
   npm install
   
   cd ../technician-dashboard
   npm install
   ```

3. **Start PostgreSQL and Redis**
   ```bash
   # PostgreSQL (if not using Docker)
   # Ensure PostgreSQL 16+ with PostGIS extension is installed and running
   psql -c "CREATE EXTENSION IF NOT EXISTS postgis;"

   # Redis (if not using Docker)
   redis-server
   ```

4. **Run database migrations and seed data**
   ```bash
   cd backend
   npm run migrate:dev
   npm run db:seed
   ```

5. **Start the applications**
   ```bash
   # Backend API (Terminal 1)
   cd backend
   npm run dev
   
   # Customer Portal (Terminal 2)
   cd frontend/customer-site
   npm run dev
   
   # Technician Dashboard (Terminal 3)
   cd frontend/technician-dashboard  
   npm run dev
   ```

## Application URLs

- **Customer Portal**: http://localhost:3000
- **Technician Dashboard**: http://localhost:3002
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/api/v1/health

## Test Accounts

After running the seed script, you can use these test accounts:

### Customer Portal (http://localhost:3000)
- **Email**: john.doe@email.com
- **Password**: password123
- **Additional customers**: jane.smith@email.com, mike.johnson@email.com, sarah.wilson@email.com, robert.brown@email.com

### Technician Dashboard (http://localhost:3002)
- **Email**: tech1@fieldservice.com  
- **Password**: tech123
- **Additional technicians**: tech2@fieldservice.com, tech3@fieldservice.com, tech4@fieldservice.com, tech5@fieldservice.com
- **All tech passwords**: tech123

### How to Test the Complete Workflow

1. **Login as a customer** at http://localhost:3000
   - Register a new account or use the test account above
   - Create a service appointment (e.g., plumbing repair)
   - The system will automatically assign it to a qualified technician

2. **Login as a technician** at http://localhost:3002
   - Use tech1@fieldservice.com / tech123
   - View available jobs that match your skills and work area
   - Accept a job and update its status (Start Job → Complete Job)

3. **Watch the automatic assignment**
   - Check backend logs: `docker-compose logs -f backend`
   - See the assignment algorithm in action
   - Assignments happen within ~5 seconds of appointment creation

## API Documentation

### Authentication Endpoints

#### Customer Registration
```http
POST /api/v1/auth/register/customer
Content-Type: application/json

{
  "email": "customer@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe", 
  "phoneNumber": "(555) 123-4567",
  "address": {
    "street": "123 Main St",
    "city": "Austin",
    "state": "TX", 
    "zipCode": "78701"
  }
}
```

#### Customer Login
```http
POST /api/v1/auth/login/customer
Content-Type: application/json

{
  "email": "customer@example.com",
  "password": "password123"
}
```

#### Technician Login
```http
POST /api/v1/auth/login/technician
Content-Type: application/json

{
  "email": "tech@example.com",
  "password": "password123"
}
```

### Appointment Endpoints

#### Create Appointment (Customer)
```http
POST /api/v1/appointments
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Kitchen Faucet Repair",
  "description": "Faucet is leaking and needs repair",
  "serviceType": "plumbing",
  "address": {
    "street": "123 Main St",
    "city": "Austin", 
    "state": "TX",
    "zipCode": "78701"
  },
  "scheduledDateTime": "2024-12-01T10:00:00Z",
  "estimatedDuration": 120,
  "priority": "medium"
}
```

#### Get Customer Appointments
```http
GET /api/v1/appointments?status=pending&page=1&limit=10
Authorization: Bearer <token>
```

#### Submit Feedback
```http
POST /api/v1/appointments/{id}/feedback
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 5,
  "comment": "Excellent service, very professional!"
}
```

### Technician Endpoints

#### Get Available Jobs
```http
GET /api/v1/technician/jobs/available?priority=high&page=1&limit=10
Authorization: Bearer <token>
```

#### Accept Job
```http
POST /api/v1/technician/jobs/{id}/accept
Authorization: Bearer <token>
```

#### Update Job Status  
```http
PATCH /api/v1/technician/jobs/{id}/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "completed",
  "completionNotes": "Fixed leak and replaced gasket"
}
```

#### Get My Jobs
```http
GET /api/v1/technician/jobs/my?status=accepted&page=1&limit=10
Authorization: Bearer <token>
```

## Database Schema

### Tables (PostgreSQL with Prisma)

#### addresses
- Shared address model for customers and appointments
- Street, city, state, ZIP code
- Latitude/longitude coordinates (PostGIS compatible)

#### customers
- Email, password (bcrypt hashed)
- Personal info (name, phone)
- Address relation (one-to-one)

#### technicians
- Email, password (bcrypt hashed)
- Employee details (employeeId, hourlyRate)
- Skills and work areas (many-to-many via junction tables)
- Active status

#### skills
- Name, category (enum), description
- Used for technician matching
- Many-to-many with technicians and appointments

#### work_areas
- Geographic coverage areas
- ZIP codes array (PostgreSQL native array)
- Center coordinates and radius (PostGIS ready)

#### working_hours
- Technician availability by day of week
- Time ranges (HH:MM format)
- Effective dates for historical tracking

#### service_appointments
- Complete appointment lifecycle
- Customer and technician relations
- Required skills (many-to-many via junction table)
- Status tracking and feedback (JSON column)
- Auto-generated reference numbers (CUID)

#### Junction Tables
- **technician_skills**: Links technicians to skills
- **technician_work_areas**: Links technicians to work areas
- **appointment_skills**: Links appointments to required skills

## Core Business Logic

### Automatic Assignment Algorithm

1. **Skill Matching**: Find technicians with required skills
2. **Location Filtering**: Match technicians to appointment work area  
3. **Availability Check**: Verify schedule conflicts
4. **Priority Scoring**: Rank by distance, workload, and skill match
5. **Assignment**: Select best match and notify both parties

### Queue Processing

- **Assignment Queue**: Process new appointments for technician assignment
- **Notification Queue**: Send SMS/email notifications (mocked)
- **Reminder Queue**: Send appointment reminders (mocked)

## Development Commands

### Backend
```bash
cd backend

# Development
npm run dev          # Start with nodemon
npm start           # Production start

# Database (Prisma)
npm run migrate:dev      # Create and apply migrations (development)
npm run migrate          # Apply migrations (production)
npm run migrate:reset    # Reset database (development only)
npm run db:seed          # Seed test data
npm run db:studio        # Open Prisma Studio (database GUI)
npm run prisma:generate  # Generate Prisma Client

# Testing & Quality
npm test            # Run tests
npm run lint        # ESLint check
npm run lint:fix    # Fix ESLint issues
```

### Frontend
```bash
cd frontend/customer-site
# or 
cd frontend/technician-dashboard

# Development
npm run dev         # Start development server
npm run build       # Build for production
npm start          # Start production build

# Quality  
npm run lint       # Next.js linting
```

## Testing

### Backend Tests
```bash
cd backend
npm test            # Run all tests
npm run test:watch  # Watch mode
```

### Integration Testing
```bash
# Start test database
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
npm test -- --config jest.integration.config.js
```

## Production Deployment

### Build Images
```bash
# Backend
docker build -t fsm-backend ./backend

# Frontend
docker build -t fsm-customer-site ./frontend/customer-site
docker build -t fsm-technician-dashboard ./frontend/technician-dashboard
```

### Environment Variables (Production)
```bash
NODE_ENV=production
DATABASE_URL="postgresql://user:password@your-production-db:5432/field_service_manager?schema=public"
REDIS_URL=redis://your-production-redis:6379
JWT_SECRET=your-super-secure-production-secret
FRONTEND_URL=https://your-customer-site.com
TECHNICIAN_FRONTEND_URL=https://your-technician-dashboard.com
```

### PM2 Deployment
```bash
cd backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Troubleshooting

### Common Issues

#### PostgreSQL Connection Error
```bash
# Check if PostgreSQL is running
docker-compose ps
# or
pg_isready -h localhost -p 5432

# Check PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

#### Prisma Migration Issues
```bash
# Check migration status
cd backend
npx prisma migrate status

# Reset database (development only)
npx prisma migrate reset --force

# View database in Prisma Studio
npm run db:studio
```

#### Redis Connection Error
```bash
# Check Redis status
docker-compose logs redis
# or
redis-cli ping

# Restart Redis
docker-compose restart redis
```

#### Port Already in Use
```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>
```

#### Module Not Found Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Technician Dashboard Not Loading
```bash
# Ensure technician dashboard is built and running
docker-compose logs technician-dashboard

# Restart the technician dashboard service
docker-compose restart technician-dashboard

# Rebuild if needed
docker-compose up --build technician-dashboard
```

#### Database Seeding Issues
```bash
# Clear and re-seed the database
docker-compose exec backend npm run db:seed

# Check database with Prisma Studio
docker-compose exec backend npm run db:studio

# Verify tables were created
docker-compose exec postgres psql -U postgres -d field_service_manager -c "\dt"
```

### API Response Format

#### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "pagination": {  // Optional for paginated responses
    "page": 1,
    "limit": 10, 
    "total": 100,
    "pages": 10
  }
}
```

#### Error Response  
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      // Additional error details
    }
  }
}
```

## Included Sample Data

The seed script creates realistic test data:

### Sample Customers (5 total)
- Various locations across Austin, TX metro area
- Different ZIP codes for testing work area assignments

### Sample Technicians (5 total)  
- **Tom Anderson (TECH001)**: Plumbing specialist - Downtown & East Austin
- **Lisa Garcia (TECH002)**: Electrical specialist - North Austin & Cedar Park
- **Carlos Rodriguez (TECH003)**: Roofing & carpentry - South & Downtown Austin  
- **Amanda Taylor (TECH004)**: HVAC & electrical - North & East Austin
- **David Martinez (TECH005)**: Painting & general repair - Cedar Park & South Austin

### Sample Appointments (6 total)
- 5 pending appointments for immediate assignment
- 1 completed appointment with customer feedback

### Coverage Areas
- **Downtown Austin** (78701-78704)
- **North Austin** (78717, 78750, 78759, 78758)  
- **South Austin** (78745, 78748, 78749, 78652)
- **East Austin** (78721-78724)
- **Cedar Park/Leander** (78613, 78641, 78645)

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Customer      │    │   Technician    │    │    Backend      │
│   Portal        │    │   Dashboard     │    │   API + Prisma  │
│  (Port 3000)    │    │  (Port 3002)    │    │  (Port 3001)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                    ┌─────────────────┐    ┌─────────────────┐
                    │  PostgreSQL     │    │     Redis       │
                    │   + PostGIS     │    │  (Port 6379)    │
                    │  (Port 5432)    │    └─────────────────┘
                    └─────────────────┘
```