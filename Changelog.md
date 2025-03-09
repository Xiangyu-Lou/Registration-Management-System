# Registration-Management-System Changelog

## 2024-03-09 System Optimization Upgrade

### User Interface Improvements

1. **Interface Style Upgrade**
   - Adjusted waste record list header styles to improve readability
   - Added sequence numbers to record lists for easier finding and referencing
   - Updated system logo

2. **Naming and Label Optimization**
   - System name changed to "Solid Waste Management System"
   - "Reporter" renamed to "Submitter" to better match actual operational logic
   - Super administrator user query page renamed to "Solid Waste Management System Historical Records"
   - Removed ID display from user management page to simplify interface

### Feature Enhancements

1. **Waste Management Feature Enhancements**
   - Added "General Solid Waste" category to waste types
   - Added remarks field to support more detailed record information

2. **User Permission Optimization**
   - Removed account type selection from login page to simplify login process
   - Removed delete button for employee role to prevent accidental operations
   - Limited regular employees to viewing only records from the past 7 days
   - When a user is deleted, their created records are retained in the system

### Technical Improvements

1. **Backend API Enhancements**
   - Optimized waste record API, added total statistics functionality
   - Improved data association logic, decoupled users from records
   - Added detailed logging for easier debugging and monitoring

2. **Frontend Interaction Optimization**
   - Simplified user interaction process
   - Improved data display clarity
   - Enhanced data filtering and statistical capabilities
  
### Security Improvements

1. **User Permission Management**
   - Added user status management to support account disabling
   - Optimized login verification process to enhance system security
   - Added detailed logging for monitoring and auditing
   - User permission control transferred to backend

### How to Use New Features

- **Remarks Function**: When creating or editing records, detailed remarks can be added
- **Simplified Login**: Login directly using phone number and password without selecting account type
- **Record Sequence Numbers**: Table automatically displays sequence numbers for easier location and reference of specific records

## 2024-03-01: Cloud Server Deployment Optimization

### Fixed Issues

1. **Fixed API URL Hardcoding Issue**
   - Problem: API addresses in frontend code were hardcoded as `localhost:3000`, causing browsers to attempt accessing the user's local machine rather than the server API after cloud deployment
   - Solution: Created API configuration file and HTTP service encapsulation to automatically switch API addresses based on environment

### Major Changes

1. **Added API Configuration**
   - Created `frontend/src/config/api.js` configuration file
   - Development environment uses `localhost:3000`
   - Production environment uses relative paths, automatically pointing to APIs under the current domain

2. **HTTP Service Encapsulation**
   - Created `frontend/src/config/httpService.js` service
   - Encapsulated common HTTP request methods
   - Unified error handling and request configuration

3. **Updated All Components**
   - Modified `Login.vue`, `WasteForm.vue`, `RecordsList.vue`, `EditRecord.vue`, and `UserManagement.vue`
   - Used new API configuration and HTTP service to replace hardcoded API URLs

4. **Updated Frontend Build Configuration**
   - Modified `vue.config.js`
   - Set `publicPath` to relative path `./`
   - Added code splitting and optimization configuration

5. **Enhanced Backend CORS Support**
   - Updated CORS configuration in `server.js`
   - Supported requests with credentials
   - Allowed more HTTP methods and headers

### New Documentation

1. **Deployment Guide (DEPLOYMENT.md)**
   - Detailed cloud server deployment steps
   - Environment preparation, Nginx configuration, PM2 process management
   - Security recommendations and troubleshooting

### How to Use New Features

Deployment process after project modification:

1. Develop and test in local development environment
2. Run `npm run build` to build the frontend project
3. Upload frontend `dist` directory and backend code to server
4. Configure Nginx and backend service according to `DEPLOYMENT.md`
5. Access the system via server IP or domain name

## 2024-03-03 Changelog

### New Features

1. **Enhanced User Login**
   - Added password verification functionality
   - Employee login now also requires password verification
   - Improved system security

2. **Documentation Restructuring and Improvement**
   - Restructured README.md file to make it clearer and more comprehensive
   - Added detailed system functionality description and architecture introduction
   - Optimized installation and usage instructions

3. **Deployment Guide Extension**
   - Added detailed frontend production environment deployment guide
   - Added deployment steps for Windows and Linux environments
   - Included common issues and solutions

4. **Nginx Configuration**
   - Added complete Nginx configuration files
   - Provided different configurations for development and production environments
   - Included reverse proxy, static resource caching, and security settings

### How to Use New Features

1. **Password Login**
   - All users (including employees) now need to login with username and password
   - Default passwords are set during system initialization and can be modified in the user management interface

2. **Deploying New Version**
   - Follow the updated deployment guide
   - For already deployed systems, update Nginx configuration
   - Restart services to apply new security settings

