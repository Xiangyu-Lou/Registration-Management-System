# Registration Management System

This is a Registration Management System based on Vue and MySQL

[简体中文](README_CN.md#dev)
## Project Features

### Basic Functions
- Basic Unit Management
  - Support for multiple basic units selection and management
  - Each unit can independently manage waste records

### User Permission System
- Three-level permission management
  - Super Administrator
    - Full system data viewing permissions
    - Record management permissions for all units
  - Unit Administrator
    - Data viewing permissions for their own unit
    - Record management permissions for their own unit
  - Basic Employee
    - Waste reporting permissions for their own unit
    - Basic data viewing permissions

### Waste Management
- Waste Classification System
  - Oil sludge
  - Oil-containing packaging materials
  - Other categories
- Waste Information Reporting
  - Basic Information
    - Generation location
    - Collection start time
    - Collection quantity
  - On-site Photo Management
    - Photos before collection (≤5 photos)
    - Photos after collection (≤5 photos)
  - Automated Features
    - Automatic recording of reporting time
    - Automatic association with reporting unit

## Project Structure

```
Registration-Management-System/
│
├── backend/          # Node.js backend service
│   ├── package.json  # Backend dependency configuration
│   └── server.js     # Main backend service file
│
├── frontend/         # Vue frontend application
│   ├── public/       # Static resources
│   ├── src/          # Source code
│   │   ├── views/    # Page components
│   │   ├── router/   # Routing configuration
│   │   ├── store/    # State management
│   │   ├── config/   # Configuration files
│   │   ├── App.vue   # Main application component
│   │   └── main.js   # Application entry file
│   ├── package.json  # Frontend dependency configuration
│   └── vue.config.js # Vue configuration file
│
├── db/               # Database files
│   └── mysql/        # MySQL database scripts
│       ├── init_db.js        # Complete MySQL initialization script
│       ├── init_db_simple.js # Simplified MySQL initialization script
│       └── README.md         # MySQL configuration instructions
│
└── uploads/          # Directory for storing uploaded photos (generated after running)
```

## Deployment Guide

| Windows | Linux | Changelog |
|------|------|----------|
|[Windows Deployment Guide](development_windows.md#dev) | [Linux Deployment Guide](development_linux.md#prod) | [Changelog](Changelog.md) |

## Test Accounts

After initializing the database, the system contains the following test accounts:

1. Super Administrator
   - Phone: 13800000003
   - Password: 1

2. Unit Administrator
   - Phone: 13800000002
   - Password: 1

3. Employee
   - Phone: 13800000001
   - Password: 1