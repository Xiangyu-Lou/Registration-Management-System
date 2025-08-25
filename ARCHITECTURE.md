# Architecture & Technology Stack

This document provides a comprehensive overview of the Registration Management System's architecture, technology choices, and design patterns.

## Technology Stack

### Frontend

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Framework | Vue.js | 3.3.4 | SPA framework (Composition API) |
| UI Library | Element Plus | 2.3.12 | Enterprise UI components |
| Routing | Vue Router | 4.2.4 | Client-side routing with guards |
| HTTP Client | Axios | 1.8.2 | API communication |
| Excel Export | ExcelJS | 4.4.0 | Excel generation with embedded images |
| Image Compression | CompressorJS | 1.2.1 | Client-side image compression before upload |
| Build Tool | Vue CLI | 5.0 | Webpack-based build toolchain |
| Linting | ESLint | - | Code quality (vue3-essential + recommended) |

### Backend

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Runtime | Node.js | 16+ | Server runtime |
| Framework | Express | 4.18.2 | HTTP server and middleware |
| Database Driver | mysql2 | 3.6.1 | MySQL connection with promise support |
| Authentication | jsonwebtoken | 9.0.2 | JWT token generation and verification |
| Password Hashing | bcrypt | 5.1.1 | Secure password storage (10 salt rounds) |
| File Upload | Multer | 2.0.2 | Multipart form handling |
| Security Headers | Helmet | 8.1.0 | CSP, HSTS, X-Frame-Options, etc. |
| Rate Limiting | express-rate-limit | 8.0.1 | Request throttling |
| XSS Protection | xss + DOMPurify | 1.0.15 / 3.3.3 | Input sanitization (double-layer) |
| Input Validation | validator | 13.15.15 | String validation and sanitization |
| Dev Server | nodemon | 3.0.1 | Auto-restart on file changes |

### Database

| Technology | Version | Purpose |
|-----------|---------|---------|
| MySQL | 8.0+ | Relational database |

### Testing

| Technology | Version | Purpose |
|-----------|---------|---------|
| Jest | 29.7.0 | Test runner and assertions |
| Supertest | 7.0.0 | HTTP integration testing |

### Deployment

| Technology | Purpose |
|-----------|---------|
| Nginx | Reverse proxy, static file serving, SSL termination |
| PM2 | Node.js process management (production) |

### External Services

| Service | Purpose |
|---------|---------|
| Amap (Gaode Maps) | GPS coordinate conversion, reverse geocoding, address lookup |

---

## Architecture Overview

The system follows a **Model-View-Controller (MVC)** layered architecture with clear separation of concerns.

### Request Pipeline

```
Client Request
    │
    ▼
┌─────────────────────────────────────────────────────┐
│  Nginx (Reverse Proxy)                              │
│  - Static files (/uploads, /frontend/dist)          │
│  - API proxy → localhost:3000                       │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  Express Middleware Pipeline                        │
│                                                     │
│  1. Trust Proxy (X-Forwarded-For)                   │
│  2. Helmet (Security Headers / CSP)                 │
│  3. Rate Limiting (100 req/15min global)            │
│  4. CORS                                            │
│  5. Body Parsers (JSON 10MB, URL-encoded)           │
│  6. Security Middleware                             │
│     - Input length/depth limits                     │
│     - SQL injection detection                       │
│     - XSS sanitization (DOMPurify + xss)            │
│  7. Static File Serving                             │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  Routes → Controllers → Models → MySQL              │
│                                                     │
│  Routes:      Define endpoints, attach middleware   │
│  Controllers: Business logic, request handling      │
│  Models:      SQL queries, data access              │
│  Utils:       Auth, dates, files, logging           │
└─────────────────────────────────────────────────────┘
```

### Layer Responsibilities

- **Routes** (`backend/routes/`): Define API endpoints, attach authentication and role-based middleware
- **Controllers** (`backend/controllers/`): Handle request/response, implement business logic, call models
- **Models** (`backend/models/`): Execute parameterized SQL queries, return structured data
- **Middleware** (`backend/middleware/`): Authentication, security checks, error handling
- **Utils** (`backend/utils/`): Shared helpers for auth, dates, files, and audit logging

---

## Database Schema

### Tables (8 total)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  companies   │     │  user_roles  │     │  waste_types  │
│──────────────│     │──────────────│     │──────────────│
│ id (PK)      │     │ id (PK)      │     │ id (PK)      │
│ name (UQ)    │     │ name (UQ)    │     │ name (UQ)    │
│ code (UQ)    │     └──────────────┘     └──────┬───────┘
│ status       │              │                   │
│ created_at   │              │                   │
└──────┬───────┘              │                   │
       │                      │                   │
       │    ┌─────────────────┘                   │
       │    │                                     │
       ▼    ▼                                     │
┌──────────────┐     ┌──────────────┐             │
│    units     │     │    users     │             │
│──────────────│     │──────────────│             │
│ id (PK)      │◄────│ unit_id (FK) │             │
│ name         │     │ id (PK)      │             │
│ company_id   │──┐  │ username     │             │
└──────┬───────┘  │  │ phone (UQ)   │             │
       │          │  │ password     │             │
       │          │  │ role_id (FK) │             │
       │          │  │ company_id   │─────┐       │
       │          │  │ status       │     │       │
       │          │  │ can_view_logs│     │       │
       │          │  └──────┬───────┘     │       │
       │          │         │             │       │
       ▼          ▼         ▼             ▼       ▼
┌─────────────────────────────────────────────────────┐
│                   waste_records                      │
│─────────────────────────────────────────────────────│
│ id (PK), unit_id (FK), waste_type_id (FK)           │
│ creator_id (FK), company_id (FK)                    │
│ location, collection_start_time, quantity            │
│ photo_path_before (JSON), photo_path_after (JSON)   │
│ process, remarks, is_supervised                      │
│ longitude, latitude, address, district, city,province│
│ created_at                                           │
└─────────────────────────────────────────────────────┘

┌──────────────────┐     ┌──────────────────┐
│ operation_logs   │     │    feedback       │
│──────────────────│     │──────────────────│
│ id (PK)          │     │ id (PK)          │
│ user_id (FK)     │     │ user_id (FK)     │
│ operation_type   │     │ company_id (FK)  │
│ target_type      │     │ title            │
│ target_id        │     │ description      │
│ description      │     │ type             │
│ ip_address       │     │ priority         │
│ user_agent       │     │ status           │
│ additional_data  │     │ admin_id (FK)    │
│ company_id (FK)  │     │ admin_reply      │
│ created_at       │     │ images           │
└──────────────────┘     │ created_at       │
                         │ updated_at       │
                         └──────────────────┘
```

### Key Constraints

- `companies.name` and `companies.code` are UNIQUE
- `units` has a composite UNIQUE on `(name, company_id)`
- `users.phone` is UNIQUE (used as login identifier)
- Companies use soft-delete via `status` field (0=inactive, 1=active)
- All foreign keys reference parent table `id` columns

---

## Authentication & Authorization

### JWT Authentication Flow

```
Login (phone + password)
    │
    ▼
Validate credentials (bcrypt.compare)
    │
    ▼
Generate JWT token
  - Payload: { id, username, phone, role_id, unit_id, company_id }
  - Expiry: 24h (default) or 30d (rememberMe)
    │
    ▼
Client stores token (localStorage or sessionStorage)
    │
    ▼
Subsequent requests include: Authorization: Bearer <token>
    │
    ▼
authenticateToken middleware verifies and decodes
```

### Role-Based Access Control (5 Roles)

| Role ID | Name | Scope | Key Permissions |
|---------|------|-------|-----------------|
| 5 | System Admin | All companies | Full system management, operation logs, company CRUD |
| 3 | Company Admin | Own company | Company records, user/unit management, feedback admin |
| 4 | Supervisor | Own company | Cross-unit supervised record creation, own records only |
| 2 | Unit Admin | Own unit | Unit records, unit user management |
| 1 | Basic Employee | Own unit | Create records, view own records (48-hour window) |

### Authorization Middleware Chain

| Middleware | Purpose |
|-----------|---------|
| `authenticateToken` | Validates JWT, attaches `req.user` |
| `requireSystemAdmin` | Requires role_id = 5 |
| `requireSuperAdmin` | Requires role_id in [3, 4, 5] |
| `blockSupervisor` | Blocks role_id = 4 from user management |
| `requireLogViewPermission` | Requires `can_view_logs = 1` |
| `validateSupervisorUnitAccess` | Restricts supervisors to own company's units |

---

## Security Architecture

### Input Protection (3 Layers)

1. **Input Limits**: Max string length 10,000 chars, max object nesting depth 10
2. **SQL Injection Detection**: Pattern matching for SQL keywords (SELECT, DROP, UNION, etc.) and operators (--, /*, ;)
3. **XSS Sanitization**: Double-layer cleaning with DOMPurify + xss library on all request body, query, and path params

### Rate Limiting

- Global: 100 requests per IP per 15 minutes
- Login: 5 failed attempts per IP per 15 minutes (successful requests excluded)
- Static file paths exempted

### HTTP Security Headers (Helmet)

- Content-Security-Policy (strict in production)
- X-Content-Type-Options: nosniff
- X-Frame-Options: deny
- Strict-Transport-Security
- X-XSS-Protection

### File Upload Security

- MIME type whitelist: JPEG, PNG, GIF, BMP, WEBP
- 10MB per file limit
- Safe filename generation: `fieldname-{timestamp}-{random}.{ext}`
- Path traversal protection in file deletion

---

## API Structure

All endpoints are prefixed with `/api`.

| Route Group | Endpoints | Auth Required | Key Middleware |
|------------|-----------|---------------|----------------|
| `/api/login` | POST | No | Login rate limiter |
| `/api/test` | GET | No | Health check |
| `/api/users` | GET, POST, PUT, DELETE | Yes | blockSupervisor |
| `/api/units` | GET, POST, PUT, DELETE | Yes | requireSuperAdmin (write ops) |
| `/api/companies` | GET, POST, PUT, DELETE | Yes | requireSystemAdmin (write ops) |
| `/api/waste-types` | GET | No | Public read |
| `/api/waste-types` | POST, PUT, DELETE | Yes | requireSuperAdmin |
| `/api/waste-records` | GET, POST, PUT, DELETE | Yes | Multer (file upload), validateSupervisorUnitAccess |
| `/api/operation-logs` | GET, export | Yes | requireLogViewPermission |
| `/api/feedback` | GET, POST, PUT, DELETE | Yes | Role-based filtering |

---

## Frontend Architecture

### State Management

Uses Vue 3 Composition API with `reactive()` (no Vuex/Pinia):
- Auth state in `store/auth.js`: user, token, isLoggedIn, loading, error
- Storage: `localStorage` (remember me) or `sessionStorage` (temporary)
- Role helper methods: `isSystemAdmin()`, `isCompanyAdmin()`, `isAdmin()`, `isUnitAdmin()`, `isSupervisor()`

### Routing & Navigation Guards

- Public routes: `/login`
- Role-based redirects on login:
  - System Admin → `/super-admin-records`
  - Company Admin → `/admin-records`
  - Supervisor → `/record/new`
  - Unit Admin/Staff → `/unit/:id` (WasteForm)
- Guards validate authentication, role permissions, and supervisor unit access

### Reusable Components

| Component | Purpose |
|-----------|---------|
| `AppHeader` | Navigation bar with user info, feedback dialog, logout |
| `CommonDataTable` | Configurable table with sorting, pagination, custom actions |
| `CommonFormDialog` | Dynamic form dialog supporting multiple field types |
| `ImagePreview` | Image grid with lightbox viewer |
| `CommonFilter` | Collapsible filter panel |

### Key Frontend Features

- **GPS Location**: Browser Geolocation API + Amap coordinate conversion and reverse geocoding
- **Photo Management**: Client-side compression (CompressorJS), multi-file upload with progress, before/after photo pairs
- **Excel Export**: ExcelJS generates .xlsx files with embedded images directly in the browser
- **Responsive Design**: Mobile breakpoints at 768px and 480px, flex/grid layouts
- **Version Management**: App version tracking with forced refresh on updates

### UI Localization

- Primary language: Chinese (Simplified)
- Element Plus configured with `zhCn` locale
- Font stack: Helvetica Neue, PingFang SC, Microsoft YaHei

---

## Project Structure

```
Registration-Management-System/
│
├── backend/                          # Node.js MVC Backend
│   ├── app.js                        # Express app setup & middleware pipeline
│   ├── server.js                     # Server entry point (76 lines)
│   ├── package.json                  # Backend dependencies
│   ├── config/
│   │   ├── database.js               # MySQL connection pool
│   │   ├── jwt.js                    # JWT configuration
│   │   └── upload.js                 # Multer file upload config
│   ├── controllers/
│   │   ├── authController.js         # Login & authentication
│   │   ├── userController.js         # User CRUD & profile
│   │   ├── unitController.js         # Unit CRUD
│   │   ├── companyController.js      # Company CRUD & stats
│   │   ├── wasteTypeController.js    # Waste type CRUD
│   │   ├── wasteRecordController.js  # Waste record CRUD, export, filtering
│   │   ├── operationLogController.js # Audit log viewing & stats
│   │   ├── feedbackController.js     # Feedback CRUD
│   │   └── recordController.js       # Additional record operations
│   ├── models/
│   │   ├── User.js                   # User queries
│   │   ├── Unit.js                   # Unit queries
│   │   ├── Company.js                # Company queries
│   │   ├── WasteType.js              # Waste type queries
│   │   ├── WasteRecord.js            # Waste record queries
│   │   ├── OperationLog.js           # Operation log queries
│   │   └── Feedback.js               # Feedback queries
│   ├── routes/
│   │   ├── auth.js                   # POST /api/login, GET /api/test
│   │   ├── users.js                  # /api/users/*
│   │   ├── units.js                  # /api/units/*
│   │   ├── companies.js              # /api/companies/*
│   │   ├── wasteTypes.js             # /api/waste-types/*
│   │   ├── wasteRecords.js           # /api/waste-records/*
│   │   ├── operationLogs.js          # /api/operation-logs/*
│   │   └── feedback.js               # /api/feedback/*
│   ├── middleware/
│   │   ├── auth.js                   # JWT auth & role-based access
│   │   ├── security.js               # XSS, SQL injection, input limits
│   │   └── errorHandler.js           # Global error handling
│   └── utils/
│       ├── auth.js                   # Password hashing, JWT helpers
│       ├── dateUtils.js              # Date formatting for MySQL/frontend
│       ├── fileUtils.js              # File upload/deletion, path validation
│       └── logger.js                 # Audit logging helpers
│
├── frontend/                         # Vue 3 Frontend Application
│   ├── public/                       # Static resources (index.html, favicon)
│   ├── src/
│   │   ├── main.js                   # App entry point
│   │   ├── App.vue                   # Root component (version management)
│   │   ├── router/
│   │   │   └── index.js              # Route definitions & guards
│   │   ├── store/
│   │   │   └── auth.js               # Auth state (reactive)
│   │   ├── config/
│   │   │   ├── api.js                # API endpoint configuration
│   │   │   └── httpService.js        # Axios instance & interceptors
│   │   ├── components/
│   │   │   ├── AppHeader.vue         # Main header with navigation
│   │   │   └── common/
│   │   │       ├── CommonDataTable.vue    # Reusable data table
│   │   │       ├── CommonFilter.vue       # Filter panel
│   │   │       ├── CommonFormDialog.vue   # Dynamic form dialog
│   │   │       ├── ImagePreview.vue       # Image grid & lightbox
│   │   │       └── index.js              # Component exports
│   │   ├── views/
│   │   │   ├── Login.vue                 # Authentication
│   │   │   ├── UnitSelection.vue         # Unit picker
│   │   │   ├── WasteForm.vue             # Waste record creation
│   │   │   ├── RecordsList.vue           # Records list & filtering
│   │   │   ├── EditRecord.vue            # Record editing
│   │   │   ├── AdminRecords.vue          # Company admin dashboard
│   │   │   ├── SuperAdminRecords.vue     # System admin dashboard
│   │   │   ├── UserManagement.vue        # User CRUD
│   │   │   ├── UserProfile.vue           # Profile & password
│   │   │   ├── CompanyManagement.vue     # Company CRUD
│   │   │   ├── OperationLogs.vue         # Audit log viewer
│   │   │   ├── FeedbackForm.vue          # Submit feedback
│   │   │   ├── FeedbackList.vue          # User's feedback list
│   │   │   └── FeedbackManagement.vue    # Admin feedback management
│   │   ├── utils/
│   │   │   ├── commonUtils.js            # Shared utilities
│   │   │   ├── exportUtils.js            # Excel/CSV export
│   │   │   └── locationUtils.js          # GPS & Amap integration
│   │   └── styles/
│   │       ├── global.css                # Global styles
│   │       └── responsive.css            # Mobile responsive styles
│   ├── package.json
│   └── vue.config.js                # Build & dev server config
│
├── db/
│   └── mysql/
│       ├── init_db.js                # Full database initialization
│       └── README.md                 # DB setup instructions
│
├── tests/                            # Jest + Supertest test suite
│   ├── jest.config.js                # Test configuration
│   ├── global.setup.js               # Test data creation
│   ├── global.teardown.js            # Test data cleanup
│   ├── setup.env.js                  # Environment setup
│   ├── helpers/
│   │   ├── auth.helper.js            # Auth token helpers
│   │   └── db.helper.js              # Direct DB access
│   └── api/                          # API integration tests (9 files)
│       ├── health.test.js
│       ├── auth.test.js
│       ├── users.test.js
│       ├── units.test.js
│       ├── wasteTypes.test.js
│       ├── wasteRecords.test.js
│       ├── companies.test.js
│       ├── feedback.test.js
│       └── operationLogs.test.js
│
├── ngnix_config/                     # Nginx configurations
│   ├── linux/                        # Linux (develop & product)
│   └── windows/                      # Windows (develop & product)
│
├── uploads/                          # Photo storage (runtime generated)
├── backup.sh                         # Database & file backup script
├── .env                              # Environment variables
├── API_Documentation.md              # Complete API reference
├── Changelog.md                      # Version history
├── instruction.md                    # System user manual (Chinese)
├── LICENSE                           # MIT License
└── README.md / README_cn.md          # Project documentation
```
