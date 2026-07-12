# TransitOps ERP

A modular, scalable, enterprise-grade Transport Management ERP backend built using Django and Django REST Framework, following architecture principles suited for large-scale SaaS applications.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Architecture & Design](#architecture--design)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Project Structure](#project-structure)

## Prerequisites
- **Python:** 3.13
- **Database:** PostgreSQL
- **Package Manager:** pip

## Architecture & Design
This project avoids bloated views and "fat models" by adhering to a strict **Service Layer Pattern**:
- **Views:** Only handle HTTP requests/responses and routing.
- **Serializers:** strictly validation and representation.
- **Services (`services.py`):** Core business logic, computations, external API calls.
- **Selectors (`selectors.py`):** Complex ORM queries, annotations, filters.
- **Validators (`validators.py`):** Reusable constraint logic.

## Installation

1. **Create Virtual Environment & Install Dependencies:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows use: .\venv\Scripts\activate
   pip install -r requirements.txt
   ```

## Environment Variables
Copy `.env.example` to `.env` in the project root. Ensure the database credentials are valid:
```env
# Backend
SECRET_KEY=your-secure-random-key
DATABASE_URL=postgres://[USERNAME]:[PASSWORD]@localhost:5432/Odoo-Hackathon
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
MEDIA_ROOT=media/
STATIC_ROOT=static/
```

## Database Setup
Ensure PostgreSQL is running locally and the database `Odoo-Hackathon` exists.
```bash
python manage.py makemigrations
python manage.py migrate
```

## Run Server
Start the local development server:
```bash
python manage.py runserver
```

## Project Structure
```text
backend/
├── config/                  # Django project configuration
│   ├── settings/            # Split settings (base, development, production)
│   ├── urls.py              # Root API routing (/api/v1/)
│   ├── wsgi.py              
│   └── asgi.py              
├── apps/                    # Core Business Modules
│   ├── common/              # Base utilities, abstract models, exceptions, middleware
│   ├── users/               # Authentication, Roles, Permissions
│   ├── vehicles/            # Fleet tracking, documents
│   ├── drivers/             # Driver profiles, licenses
│   ├── trips/               # Dispatch, trip tracking
│   ├── maintenance/         # Repair logs, service history
│   ├── expenses/            # Categorized expenses, fuel logs
│   ├── dashboard/           # KPI caches
│   ├── reports/             
│   ├── analytics/           
│   └── notifications/       
├── media/                   # Uploaded attachments, documents, images
├── logs/                    # Application, Request, and Error logs
└── manage.py
```
