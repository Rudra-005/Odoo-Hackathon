# 🚀 TransitOps ERP

![TransitOps](https://img.shields.io/badge/Status-Production--Ready-success?style=for-the-badge) ![Version](https://img.shields.io/badge/Version-2.0.0--Enterprise-blue?style=for-the-badge) ![Architecture](https://img.shields.io/badge/Architecture-Service--Layer-purple?style=for-the-badge)

A powerful, highly scalable, and modular **Enterprise-Grade Transport Management ERP (TMS)** system. Built for modern logistics and fleet management companies, TransitOps handles everything from real-time vehicle tracking to AI-driven maintenance predictions, intelligent dispatching, and comprehensive financial reporting.

Built using **Django REST Framework (Backend)** and **React + Vite + TailwindCSS (Frontend)**, it follows strict architectural principles suited for large-scale SaaS applications.

---

## 🌟 Unrivaled Features

### 🔐 Enterprise Security & Authentication
- **JWT-Based Authentication:** Stateless, highly secure token-based access with automated token rotation and blacklisting.
- **Granular RBAC:** Role-Based Access Control down to the object level. Define custom roles (Super Admin, Dispatcher, Driver, Mechanic) with precise permissions.
- **Brute Force Protection:** Advanced lockout mechanisms tracking failed login attempts and analyzing IP reputation.
- **Comprehensive Audit Logging:** Immutable audit trails for every database transaction to ensure compliance and traceability.

### 🚛 Advanced Fleet Management
- **Real-time Vehicle Tracking:** Monitor the location, status, and health of the entire fleet.
- **Document Expiry Alerts:** Automated notifications for vehicle registrations, insurance renewals, and driver license expirations.
- **Predictive Maintenance:** Machine Learning-driven maintenance scheduling based on usage data, OBD-II sensor telematics, and historical wear-and-tear.
- **Fuel Consumption Analytics:** Detect anomalies in fuel usage to prevent theft and optimize route fuel efficiency.

### 🛣️ Intelligent Trip & Dispatch System
- **Smart Routing:** Algorithm-based route optimization considering traffic, weather, and vehicle capacity to minimize delivery times and costs.
- **Live Dispatch Board:** Drag-and-drop interactive dispatch UI for real-time load assignment.
- **Driver Performance Monitoring:** Track harsh braking, idling times, and over-speeding to rate and rank drivers.
- **Automated Invoicing & Proof of Delivery (PoD):** Digital signatures, geo-fenced delivery confirmations, and auto-generated billing.

### 💰 Comprehensive Financials
- **Expense Tracking & Categorization:** Deep insights into fixed vs. variable costs (fuel, repairs, tolls, driver salaries).
- **Automated Profitability Analysis:** Per-trip and per-vehicle profit margin calculations.
- **Dynamic Dashboards:** Beautiful, interactive charts rendering complex financial data into actionable insights at a glance.

### 🤖 AI-Powered Chatbot Assistant
- **Context-Aware Insights:** Ask the AI questions like "Which vehicle is costing the most to repair?" or "Show me the profit margin for the last quarter."
- **Automated Reporting:** The assistant can instantly generate summary reports and send them to stakeholders.

---

## 🏗️ Architecture & Design

This project avoids bloated views and "fat models" by adhering to a strict **Service Layer Pattern**. The backend separates concerns cleanly:

- **Views:** Only handle HTTP requests/responses and routing.
- **Serializers:** Strictly for data validation and representation.
- **Services (`services.py`):** Core business logic, computations, and external API integrations.
- **Selectors (`selectors.py`):** Complex ORM queries, annotations, and DB filters.
- **Validators (`validators.py`):** Reusable constraint logic.

---

## 💻 Tech Stack

- **Backend:** Python 3.13, Django 5.x, Django REST Framework, SimpleJWT
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React, TanStack Query (React Query)
- **Database:** PostgreSQL (Primary), Redis (Caching & Task Queue)
- **Deployment:** Docker, Nginx, Gunicorn, Celery (for background tasks)

---

## 🚀 Installation & Quick Start

### 1. Database Setup
Ensure PostgreSQL is running locally and the database `Odoo-Hackathon` exists.
```bash
# Set up database schema
python manage.py makemigrations
python manage.py migrate
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use: .\venv\Scripts\activate
pip install -r requirements.txt
```
Copy `.env.example` to `.env` in the project root and add your DB credentials. Start the server:
```bash
python manage.py runserver
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 📁 Project Structure

```text
Odoo-hackathon/
├── backend/
│   ├── config/                  # Django project configuration & split settings
│   ├── apps/                    # Core Business Modules
│   │   ├── common/              # Base utilities, abstract models, exceptions, middleware
│   │   ├── users/               # Authentication, Roles, Permissions, JWT logic
│   │   ├── vehicles/            # Fleet tracking, documents
│   │   ├── drivers/             # Driver profiles, licenses
│   │   ├── trips/               # Dispatch, trip tracking
│   │   ├── maintenance/         # Repair logs, service history
│   │   ├── expenses/            # Categorized expenses, fuel logs
│   │   ├── dashboard/           # KPI caches and analytical aggregates
│   │   ├── reports/             # Exportable PDF/Excel financials
│   │   ├── analytics/           # Machine learning integration modules
│   │   └── notifications/       # Email/SMS/Push notifications dispatcher
│   ├── media/                   # Uploaded attachments, PoDs, images
│   └── logs/                    # Application, Request, and Error logs
└── frontend/
    ├── src/
    │   ├── components/          # Reusable UI components (Tailwind)
    │   ├── pages/               # Full-page route components
    │   ├── hooks/               # Custom React hooks (theme, API logic)
    │   ├── contexts/            # React Context (Auth, Preferences)
    │   └── config/              # Axios interceptors, React Query setup
```

---

## 🛡️ License
Proprietary Enterprise Software. All rights reserved.
