# Registration Management System

A modern solid waste management system built with Vue 3 + Node.js + MySQL, featuring a clean MVC architecture design.

[简体中文](README_cn.md) | [Architecture](ARCHITECTURE.md) | [Instruction](instruction.md) | [Changelog](Changelog.md) | [API Docs](API_Documentation.md)

## Project Features

### Core Functions
- **Company Hierarchy Management**
  - Support for multi-company architecture with independent unit and user management
  - Complete permission isolation system ensuring data security for each company
  - Flexible organizational structure: Company → Unit → User

- **Problem Feedback System**
  - All users can submit problem feedback with detailed descriptions
  - Administrators can view, handle, and reply to feedback
  - Complete status management and statistical functions

### User Permission System
- **Five-level Permission Management**
  - **System Super Administrator** - Full system data viewing permissions, all company and unit management
  - **Company Administrator** - Company data viewing permissions, company unit and user management
  - **Unit Administrator** - Unit data viewing permissions, unit record and user management
  - **Basic Employee** - Unit waste reporting permissions, basic data viewing (48-hour limit)
  - **Supervisor** - Independent supervision data entry and management permissions

### Waste Management
- **Waste Classification System**
  - Oil sludge, oil-containing packaging materials, and other waste types
  - Support for custom waste type management
- **Waste Information Reporting**
  - Basic Information: Generation location, process, collection time, collection quantity
  - On-site Photo Management: Before collection photos (≤5) + After collection photos (≤5)
  - GPS Location: Automatic coordinate capture with Amap reverse geocoding
  - Automated Features: Automatic recording time, automatic unit association
- **Advanced Features**
  - Multiple export formats (Excel with embedded images / CSV)
  - Real-time filtering and search
  - Data statistics and analysis

### Operation Log System
- **Comprehensive Audit Tracking**
  - Records all user operations: login, waste record management, user management, etc.
  - Detailed operation descriptions with before/after data comparisons
- **Security Monitoring**
  - Records operation time, IP address, user agent and other security information
  - Supports distinction between supervision data and regular data
- **Management Features**
  - Authorized personnel can access complete operation log interface
  - Multi-dimensional real-time filtering: operation type, personnel search, time range, keywords
  - Provides statistical analysis and convenient troubleshooting tools

## Technology Stack

- **Frontend**: Vue 3 + Composition API + Element Plus + Axios + ExcelJS
- **Backend**: Node.js + Express + MVC Architecture
- **Database**: MySQL 8.0+
- **Authentication**: JWT + bcrypt
- **Security**: Helmet + rate-limit + XSS/SQL injection protection
- **File Upload**: Multer (image compression via CompressorJS on client)
- **Testing**: Jest + Supertest
- **Deployment**: Nginx + PM2

For detailed architecture documentation, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Deployment Guide

| Environment | Guide Link |
|-------------|------------|
| Linux (Recommended) | [Linux Deployment Guide](development_linux.md) |
| Windows | [Windows Deployment Guide](development_windows.md) |

## Project Structure

```
Registration-Management-System/
│
├── backend/                          # Node.js MVC Backend
│   ├── app.js                        # Express app setup & middleware pipeline
│   ├── server.js                     # Server entry point
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
│   │   ├── wasteRecordController.js  # Waste record CRUD & export
│   │   ├── operationLogController.js # Audit log viewing & stats
│   │   ├── feedbackController.js     # Feedback CRUD
│   │   └── recordController.js       # Additional record operations
│   ├── models/
│   │   ├── User.js                   # User data model
│   │   ├── Unit.js                   # Unit data model
│   │   ├── Company.js                # Company data model
│   │   ├── WasteType.js              # Waste type data model
│   │   ├── WasteRecord.js            # Waste record data model
│   │   ├── OperationLog.js           # Operation log data model
│   │   └── Feedback.js               # Feedback data model
│   ├── routes/
│   │   ├── auth.js                   # Authentication routes
│   │   ├── users.js                  # User routes
│   │   ├── units.js                  # Unit routes
│   │   ├── companies.js              # Company routes
│   │   ├── wasteTypes.js             # Waste type routes
│   │   ├── wasteRecords.js           # Waste record routes
│   │   ├── operationLogs.js          # Operation log routes
│   │   └── feedback.js               # Feedback routes
│   ├── middleware/
│   │   ├── auth.js                   # JWT auth & role-based access
│   │   ├── security.js               # XSS, SQL injection, input limits
│   │   └── errorHandler.js           # Global error handling
│   └── utils/
│       ├── auth.js                   # Password hashing, JWT helpers
│       ├── dateUtils.js              # Date formatting utilities
│       ├── fileUtils.js              # File upload/deletion utilities
│       └── logger.js                 # Audit logging helpers
│
├── frontend/                         # Vue 3 Frontend Application
│   ├── public/                       # Static resources
│   ├── src/
│   │   ├── main.js                   # App entry point
│   │   ├── App.vue                   # Root component
│   │   ├── router/                   # Route definitions & guards
│   │   ├── store/                    # Auth state management
│   │   ├── config/
│   │   │   ├── api.js                # API endpoint configuration
│   │   │   └── httpService.js        # Axios instance & interceptors
│   │   ├── components/
│   │   │   ├── AppHeader.vue         # Main header with navigation
│   │   │   └── common/              # Reusable components
│   │   │       ├── CommonDataTable.vue
│   │   │       ├── CommonFilter.vue
│   │   │       ├── CommonFormDialog.vue
│   │   │       └── ImagePreview.vue
│   │   ├── views/
│   │   │   ├── Login.vue             # Authentication
│   │   │   ├── UnitSelection.vue     # Unit picker
│   │   │   ├── WasteForm.vue         # Waste record creation
│   │   │   ├── RecordsList.vue       # Records list & filtering
│   │   │   ├── EditRecord.vue        # Record editing
│   │   │   ├── AdminRecords.vue      # Company admin dashboard
│   │   │   ├── SuperAdminRecords.vue # System admin dashboard
│   │   │   ├── UserManagement.vue    # User CRUD
│   │   │   ├── UserProfile.vue       # Profile & password
│   │   │   ├── CompanyManagement.vue # Company CRUD
│   │   │   ├── OperationLogs.vue     # Audit log viewer
│   │   │   ├── FeedbackForm.vue      # Submit feedback
│   │   │   ├── FeedbackList.vue      # User's feedback list
│   │   │   └── FeedbackManagement.vue # Admin feedback management
│   │   ├── utils/
│   │   │   ├── commonUtils.js        # Shared utilities
│   │   │   ├── exportUtils.js        # Excel/CSV export
│   │   │   └── locationUtils.js      # GPS & Amap integration
│   │   └── styles/                   # Global & responsive CSS
│   ├── package.json
│   └── vue.config.js                 # Build & dev server config
│
├── db/mysql/                         # Database initialization scripts
├── tests/                            # Jest + Supertest test suite (9 test files)
├── ngnix_config/                     # Nginx configs (linux & windows)
├── uploads/                          # Photo storage (runtime generated)
├── backup.sh                         # Database & file backup script
├── ARCHITECTURE.md                   # Architecture & tech stack documentation
├── API_Documentation.md              # Complete API reference
├── Changelog.md                      # Version history
├── instruction.md                    # System user manual (Chinese)
├── LICENSE                           # MIT License
└── README.md                         # This file
```

## Test Accounts

After database initialization, the system contains the following test accounts:

| Role | Phone | Password | Permission Description |
|------|-------|----------|----------------------|
| System Super Administrator | 13800000005 | 1 | Full system management |
| Company Administrator | 13800000003 | 1 | Company management |
| Unit Administrator | 13800000002 | 1 | Unit management |
| Basic Employee | 13800000001 | 1 | Basic reporting |
| Supervisor | 13800000004 | 1 | Supervision data |

## License

[MIT](LICENSE)
