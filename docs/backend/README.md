# Backend Documentation

## Architecture
The backend is built using Flask, a lightweight WSGI web application framework in Python, with SQLAlchemy as the ORM for database operations.

## Core Components

### Models

#### User Model
```python
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    nickname = db.Column(db.String(80))
    streak_days = db.Column(db.Integer, default=0)
    total_stars = db.Column(db.Integer, default=0)
    completed_lessons = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
```

#### Progress Model
```python
class Progress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    level_id = db.Column(db.Integer, nullable=False)
    progress = db.Column(db.Integer, default=0)
    completed = db.Column(db.Boolean, default=False)
    completed_at = db.Column(db.DateTime)
    learned_items = db.Column(db.JSON)
```

#### UserPreferences Model
```python
class UserPreferences(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    sound_enabled = db.Column(db.Boolean, default=True)
    notifications_enabled = db.Column(db.Boolean, default=True)
    theme = db.Column(db.String(20), default='light')
    language = db.Column(db.String(10), default='ar')
```

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify JWT token

#### User Management
- `GET /api/users/<id>` - Get user details
- `PUT /api/users/<id>` - Update user details
- `GET /api/users/<id>/preferences` - Get user preferences
- `PUT /api/users/<id>/preferences` - Update user preferences

#### Progress Tracking
- `GET /api/progress/user/<id>` - Get user's learning progress
- `POST /api/progress/update` - Update learning progress
- `GET /api/progress/stats/<id>` - Get user's learning statistics

#### Learning Content
- `GET /api/learning/levels` - Get all learning levels
- `GET /api/learning/levels/<id>` - Get specific level details
- `GET /api/learning/levels/<id>/content` - Get level content

### Middleware

#### Authentication Middleware
- JWT token validation
- Role-based access control
- Request validation

#### Error Handling
- Custom error responses
- Error logging
- Rate limiting

### Database Schema

#### Tables
- users
- progress
- user_preferences
- learning_levels
- achievements

#### Relationships
- One-to-Many: User -> Progress
- One-to-One: User -> UserPreferences
- Many-to-Many: User -> Achievements

### Security Features
- Password hashing with bcrypt
- JWT token authentication
- CORS configuration
- Rate limiting
- Input validation
- SQL injection prevention

### Data Validation
- Request data validation
- Response data formatting
- Error handling
- Data sanitization

### Caching
- Redis caching for:
  - User sessions
  - Learning content
  - Progress data
- Cache invalidation strategies

### Logging
- Activity logging
- Error logging
- Performance monitoring
- Audit trails

### Configuration
```python
class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
```

### Development Setup
1. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   venv\Scripts\activate     # Windows
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Initialize database:
   ```bash
   flask db upgrade
   ```

5. Run development server:
   ```bash
   flask run
   ```

### Testing
- Unit tests with pytest
- Integration tests
- API endpoint tests
- Database tests

### Deployment
- Production configuration
- Database migrations
- Server setup
- Monitoring setup

For detailed API documentation, see the [API Documentation](../api/README.md). 