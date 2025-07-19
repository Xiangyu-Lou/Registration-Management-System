# Registration Management System

A modern solid waste management system built with Vue 3 + Node.js + MySQL, featuring a clean MVC architecture design.

[简体中文](README.md) | [Instruction](instruction.md) | [Changelog](Changelog.md)

## 🎯 Project Features

### 💡 Core Functions
- **Company Hierarchy Management**
  - Support for multi-company architecture with independent unit and user management
  - Complete permission isolation system ensuring data security for each company
  - Flexible organizational structure: Company → Unit → User

- **Problem Feedback System**
  - All users can submit problem feedback with detailed descriptions
  - Administrators can view, handle, and reply to feedback
  - Complete status management and statistical functions

### 👥 User Permission System
- **Five-level Permission Management**
  - **System Super Administrator** - Full system data viewing permissions, all company and unit management
  - **Company Administrator** - Company data viewing permissions, company unit and user management
  - **Unit Administrator** - Unit data viewing permissions, unit record and user management
  - **Basic Employee** - Unit waste reporting permissions, basic data viewing (48-hour limit)
  - **Supervisor** - Independent supervision data entry and management permissions

### 🗂️ Waste Management
- **Waste Classification System**
  - Oil sludge, oil-containing packaging materials, and other waste types
  - Support for custom waste type management
- **Waste Information Reporting**
  - Basic Information: Generation location, process, collection time, collection quantity
  - On-site Photo Management: Before collection photos (≤5) + After collection photos (≤5)
  - Automated Features: Automatic recording time, automatic unit association
- **Advanced Features**
  - Multiple export formats (with/without images)
  - Real-time filtering and search
  - Data statistics and analysis

### 📊 Operation Log System
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

## 🏗️ Project Architecture

### Overall Architecture
Adopts modern **MVC (Model-View-Controller)** layered architecture, ensuring code maintainability and scalability.

### Technology Stack
- **Frontend**: Vue 3 + Composition API + Element Plus
- **Backend**: Node.js + Express + MVC Architecture
- **Database**: MySQL 8.0+
- **Authentication**: JWT
- **File Upload**: Multer

## 📖 Deployment Guide

| Environment | Guide Link |
|-------------|------------|
| Linux(Recommended) | [Linux Deployment Guide](development_linux.md) |
| Windows | [Windows Deployment Guide](development_windows.md) |

## 📁 Project Structure

```
Registration-Management-System/
│
├── backend/                    # Node.js MVC Backend Service
│   ├── config/                 # Configuration Layer
│   │   ├── database.js         # Database connection config
│   │   ├── jwt.js             # JWT authentication config
│   │   └── upload.js          # File upload config
│   ├── controllers/           # Controller Layer (Business Logic)
│   │   ├── authController.js        # Authentication controller
│   │   ├── userController.js        # User management controller
│   │   ├── unitController.js        # Unit management controller
│   │   ├── wasteTypeController.js   # Waste type controller
│   │   ├── wasteRecordController.js # Waste record controller
│   │   ├── companyController.js     # Company management controller
│   │   └── feedbackController.js    # Problem feedback controller
│   ├── models/               # Model Layer (Data Access)
│   │   ├── User.js           # User data model
│   │   ├── Unit.js           # Unit data model
│   │   ├── WasteType.js      # Waste type data model
│   │   ├── WasteRecord.js    # Waste record data model
│   │   ├── Company.js        # Company data model
│   │   └── Feedback.js       # Problem feedback data model
│   ├── routes/               # Route Layer (API Routes)
│   │   ├── auth.js           # Authentication routes
│   │   ├── users.js          # User routes
│   │   ├── units.js          # Unit routes
│   │   ├── wasteTypes.js     # Waste type routes
│   │   ├── wasteRecords.js   # Waste record routes
│   │   ├── companies.js      # Company routes
│   │   └── feedback.js       # Problem feedback routes
│   ├── middleware/           # Middleware
│   │   ├── auth.js           # Authentication middleware
│   │   └── errorHandler.js   # Error handling middleware
│   ├── utils/               # Utilities
│   │   ├── auth.js          # Authentication utilities
│   │   ├── dateUtils.js     # Date utilities
│   │   └── fileUtils.js     # File utilities
│   ├── package.json         # Backend dependencies
│   ├── server.js            # Streamlined main server file (76 lines)
│   ├── REFACTOR_SUMMARY.md  # Detailed refactoring documentation
│   └── ISSUE_FIXES.md       # Issue fix records
│
├── frontend/                # Vue 3 Frontend Application
│   ├── public/              # Static resources
│   ├── src/                 # Source code
│   │   ├── views/           # Page components
│   │   │   ├── Login.vue          # Login page
│   │   │   ├── WasteForm.vue      # Waste reporting page
│   │   │   ├── EditRecord.vue     # Record editing page
│   │   │   ├── RecordsList.vue    # Records list page
│   │   │   ├── AdminRecords.vue   # Admin records page
│   │   │   ├── UserManagement.vue # User management page
│   │   │   ├── CompanyManagement.vue # Company management page
│   │   │   ├── FeedbackForm.vue   # Problem feedback form
│   │   │   ├── FeedbackList.vue   # Feedback list page
│   │   │   └── FeedbackManagement.vue # Feedback management page
│   │   ├── router/          # Route configuration
│   │   ├── store/           # State management
│   │   ├── config/          # Configuration files
│   │   │   ├── api.js       # API configuration
│   │   │   └── httpService.js # HTTP service wrapper
│   │   ├── utils/           # Utility functions
│   │   ├── App.vue          # Main application component
│   │   └── main.js          # Application entry file
│   ├── package.json         # Frontend dependencies
│   └── vue.config.js        # Vue configuration file
│
├── db/                      # Database files
│   └── mysql/               # MySQL database scripts
│       ├── init_db.js             # Complete MySQL initialization script
│       ├── init_db_simple.js     # Simplified MySQL initialization script
│       └── README.md              # MySQL configuration instructions
│
├── uploads/                 # Uploaded photos storage (generated after running)
├── DEPLOYMENT.md           # Deployment guide
├── CHANGELOG.md            # Change log
└── README.md               # Project documentation (Chinese)
```

## 👤 Test Accounts

After database initialization, the system contains the following test accounts:

| Role | Phone | Password | Permission Description |
|------|-------|----------|----------------------|
| System Super Administrator | 13800000005 | 1 | Full system management |
| Company Administrator | 13800000003 | 1 | Company management |
| Unit Administrator | 13800000002 | 1 | Unit management |
| Basic Employee | 13800000001 | 1 | Basic reporting |
| Supervisor | 13800000004 | 1 | Supervision data |