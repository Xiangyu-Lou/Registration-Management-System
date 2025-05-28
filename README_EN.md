# Registration Management System

A modern solid waste management system built with Vue 3 + Node.js + MySQL, featuring a clean MVC architecture design.

[简体中文](README.md) | [Deployment Guide](DEPLOYMENT.md) | [Changelog](CHANGELOG.md)

## 🎯 Project Features

### 💡 Core Functions
- **Basic Unit Management**
  - Support for multiple basic units selection and management
  - Each unit can independently manage waste records

### 👥 User Permission System
- **Four-level Permission Management**
  - **Super Administrator** - Full system data viewing permissions, record management for all units
  - **Unit Administrator** - Unit data viewing permissions, unit record management permissions  
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

## 🏗️ Project Architecture

### Overall Architecture
Adopts modern **MVC (Model-View-Controller)** layered architecture, ensuring code maintainability and scalability.

### Technology Stack
- **Frontend**: Vue 3 + Composition API + Element Plus
- **Backend**: Node.js + Express + MVC Architecture
- **Database**: MySQL 8.0+
- **Authentication**: JWT
- **File Upload**: Multer

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
│   │   └── wasteRecordController.js # Waste record controller
│   ├── models/               # Model Layer (Data Access)
│   │   ├── User.js           # User data model
│   │   ├── Unit.js           # Unit data model
│   │   ├── WasteType.js      # Waste type data model
│   │   └── WasteRecord.js    # Waste record data model
│   ├── routes/               # Route Layer (API Routes)
│   │   ├── auth.js           # Authentication routes
│   │   ├── users.js          # User routes
│   │   ├── units.js          # Unit routes
│   │   ├── wasteTypes.js     # Waste type routes
│   │   └── wasteRecords.js   # Waste record routes
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
│   │   │   └── UserManagement.vue # User management page
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

## 🚀 Architecture Advantages

### MVC Layered Architecture
- **Model Layer**: Encapsulates data access logic, provides unified data interfaces
- **View Layer**: Vue 3 frontend, handles user interface and interactions
- **Controller Layer**: Processes business logic, connects models and views

### Code Quality
- Main server file streamlined from 1735 lines to 76 lines
- Modular design with clear responsibility separation
- Unified error handling and logging
- Full backward compatibility, API interfaces unchanged

### Performance Optimization
- Database connection pool management
- Optimized SQL queries
- Memory usage optimization
- File upload performance improvements

## 📋 Quick Start

### Requirements
- Node.js 16.0+
- MySQL 8.0+
- npm or yarn

### Installation Steps

1. **Clone Project**
   ```bash
   git clone <repository-url>
   cd Registration-Management-System
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Create environment variables file
   cp .env.example .env
   # Edit .env file, configure database connection and JWT secret
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

4. **Database Initialization**
   ```bash
   cd db/mysql
   node init_db.js
   ```

5. **Start Services**
   ```bash
   # Backend service (port 3000)
   cd backend
   npm start
   
   # Frontend service (port 8080)
   cd frontend
   npm run serve
   ```

## 👤 Test Accounts

After database initialization, the system contains the following test accounts:

| Role | Phone | Password | Permission Description |
|------|-------|----------|----------------------|
| Super Administrator | 13800000003 | 1 | Full system management |
| Unit Administrator | 13800000002 | 1 | Unit management |
| Basic Employee | 13800000001 | 1 | Basic reporting |
| Supervisor | 13800000004 | 1 | Supervision data |

## 📖 Deployment Guide

| Environment | Guide Link | Description |
|-------------|------------|-------------|
| Windows Development | [Windows Deployment Guide](development_windows.md) | Local development setup |
| Linux Production | [Linux Deployment Guide](development_linux.md) | Cloud server deployment |
| Detailed Documentation | [DEPLOYMENT.md](DEPLOYMENT.md) | Complete deployment guide |

## 🔄 Change Log

For detailed update records, please check [CHANGELOG.md](CHANGELOG.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details

## 📞 Support

If you encounter any issues, please get help through:
- Create [Issue](../../issues)
- Check [FAQ](FAQ.md)
- Read [Documentation](docs/) 