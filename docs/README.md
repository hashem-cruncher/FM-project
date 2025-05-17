# FMM - Arabic Learning Platform

## Overview
FMM is an interactive Arabic learning platform designed to help users learn Arabic through a structured, engaging approach. The platform offers various learning modules including alphabet learning, diacritics, syllables, words, sentences, and stories.

## Table of Contents
- [Getting Started](./getting-started.md)
- [Frontend Documentation](./frontend/README.md)
- [Backend Documentation](./backend/README.md)
- [API Documentation](./api/README.md)
- [Database Schema](./database/README.md)
- [Deployment Guide](./deployment.md)

## Features
- Interactive learning modules
- Progress tracking
- User profiles and customization
- Audio support for pronunciation
- Writing practice
- Vocabulary building
- Story-based learning
- Achievement system

## Tech Stack
### Frontend
- Next.js 13 (App Router)
- TypeScript
- Tailwind CSS
- Shadcn/UI Components
- Framer Motion
- Lucide Icons
- SWR for data fetching
- Sonner for notifications

### Backend
- Flask
- SQLAlchemy
- PostgreSQL
- JWT Authentication
- RESTful API

## Project Structure
```
fm-frontend/           # Frontend application
├── src/
│   ├── app/          # Next.js app router pages
│   ├── components/   # Reusable components
│   ├── lib/          # Utilities and helpers
│   └── styles/       # Global styles
└── public/           # Static assets

fm-backend/           # Backend application
├── app/
│   ├── models/       # Database models
│   ├── routes/       # API routes
│   └── services/     # Business logic
└── config/           # Configuration files
```

## Getting Started
See our [Getting Started Guide](./getting-started.md) for detailed setup instructions.

## Contributing
Please read our [Contributing Guidelines](./contributing.md) before submitting any changes.

## License
This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details. 