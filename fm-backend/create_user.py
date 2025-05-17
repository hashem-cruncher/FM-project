from app import create_app
from app.models.user import User
from app.db import db
from werkzeug.security import generate_password_hash

# Create the Flask application with the application factory
app = create_app()

# Use the application context to interact with the database
with app.app_context():
    # Check if user with ID 2 already exists
    user = User.query.get(2)
    if user:
        print(f"User already exists - ID: {user.id}, Username: {user.username}")
    else:
        # Create a new user
        new_user = User(
            id=2,  # Force ID to be 2
            username="testuser",
            email="test@example.com",
            nickname="Test User",
        )
        new_user.set_password("password123")

        # Add to database
        db.session.add(new_user)
        db.session.commit()

        print(f"User created - ID: {new_user.id}, Username: {new_user.username}")

    # List all users
    users = User.query.all()
    print("\nAll users in database:")
    for user in users:
        print(f"ID: {user.id}, Username: {user.username}, Email: {user.email}")
