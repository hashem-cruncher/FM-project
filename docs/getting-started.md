# Getting Started Guide

## Prerequisites
- Node.js 16.8 or later
- Python 3.8 or later
- PostgreSQL 12 or later
- Git

## Project Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/FMM.git
cd FMM
```

### 2. Frontend Setup

#### Install Dependencies
```bash
cd fm-frontend
npm install
```

#### Environment Configuration
Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

#### Run Development Server
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 3. Backend Setup

#### Create Virtual Environment
```bash
cd fm-backend
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
```

#### Install Dependencies
```bash
pip install -r requirements.txt
```

#### Environment Configuration
Create a `.env` file:
```env
FLASK_APP=app
FLASK_ENV=development
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://username:password@localhost/fmm_db
JWT_SECRET_KEY=your-jwt-secret
```

#### Database Setup
```bash
# Create database
createdb fmm_db

# Run migrations
flask db upgrade
```

#### Run Development Server
```bash
flask run
```

The backend API will be available at `http://localhost:5000`

## Development Workflow

### Frontend Development
- Components are in `src/components`
- Pages are in `src/app`
- Styles are managed with Tailwind CSS
- Use `npm run lint` for code linting
- Use `npm run test` for running tests

### Backend Development
- Models are in `app/models`
- Routes are in `app/routes`
- Use `flask db migrate` for database changes
- Use `pytest` for running tests

## Common Tasks

### Adding a New Learning Module
1. Create new component in `src/components/learning`
2. Add new page in `src/app/learn`
3. Add route in backend
4. Update progress tracking

### Database Changes
1. Modify models in `app/models`
2. Create migration:
   ```bash
   flask db migrate -m "Description of changes"
   ```
3. Apply migration:
   ```bash
   flask db upgrade
   ```

### Adding New API Endpoints
1. Create route in `app/routes`
2. Add validation
3. Update API documentation
4. Add frontend integration

## Testing

### Frontend Testing
```bash
# Run unit tests
npm test

# Run e2e tests
npm run test:e2e
```

### Backend Testing
```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_auth.py
```

## Deployment

### Frontend Deployment
1. Build the application:
   ```bash
   npm run build
   ```
2. Start production server:
   ```bash
   npm start
   ```

### Backend Deployment
1. Set production environment variables
2. Install production dependencies
3. Run with a production server (e.g., Gunicorn):
   ```bash
   gunicorn app:app
   ```

## Troubleshooting

### Common Issues

#### Frontend
- **Issue**: Module not found
  - Solution: Check import paths and dependencies

- **Issue**: Build errors
  - Solution: Clear `.next` directory and rebuild

#### Backend
- **Issue**: Database connection error
  - Solution: Check database credentials and connection

- **Issue**: Migration errors
  - Solution: Reset migrations and recreate

### Getting Help
- Check existing issues in the repository
- Create new issues for bugs
- Consult the documentation
- Contact the development team

## Next Steps
- Review the [Frontend Documentation](./frontend/README.md)
- Review the [Backend Documentation](./backend/README.md)
- Review the [API Documentation](./api/README.md)
- Set up your development environment
- Start contributing! 