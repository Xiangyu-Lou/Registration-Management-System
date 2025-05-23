# Registration-Management-System Changelog

## 2025-05-16

### 🐛 Bug修复与调整 (Bug Fixes & Adjustments)

*   **导出含有图片记录时限制单个文件最多导出数量**:
    *   

## 2025-04-28

### ✨ 新功能 (Features)

*   **新增监督人员角色**:
    *   新增监督人员角色。
    *   监督人员只能查看自己添加的记录，并且可以编辑和删除。
    *   数据库中新增 `is_supervised` 字段，用来表示该记录是否由监督人员添加。

*   **超级管理员新增监督数据筛选功能**:
    *   超级管理员可以查看所有监督人员的记录，并且可以编辑和删除。
 
*   **新增查看限制**:
    *   单位管理人员无法查看本单位中由监督人员录入的数据。


### 🐛 Bug修复与调整 (Bug Fixes & Adjustments)

*   **动态加载数据问题**:
    *   修复了加载数据时，数据不显示的问题，同时弃用动态加载功能，改为静态加载。


## 2024-04-12

### ✨ 新功能 (Features)

*   **产生工序字段**:
    *   在废物填报 (`WasteForm.vue`) 和编辑 (`EditRecord.vue`) 页面添加了"产生工序"字段，包含预设选项 ('作业现场', '清罐清理', '报废清理', '管线刺漏', '历史遗留', '日常维护', '封井退出') 和"其他"自定义输入。
    *   数据库 `waste_records` 表已添加 `process VARCHAR(100)` 字段 (`db/mysql/init_db.js`)。
    *   前后端API (`server.js`, `WasteForm.vue`, `EditRecord.vue`) 均已更新以支持此字段的存储、读取和验证。
*   **导出全部照片**:
    *   新增"包含全部照片"的导出选项 (`RecordsList.vue`, `AdminRecords.vue`)，可导出记录中最多10张（清理前5张，清理后5张）照片到Excel。
    *   Excel表头相应更新，为每张照片创建单独列（例如，`清理前照片1`, `清理后照片2`...）。
    *   更新了导出对话框/按钮以包含此新选项。

### 🐛 Bug修复与调整 (Bug Fixes & Adjustments)

*   **收集数量可选**:
    *   "收集数量(吨)"字段在填报 (`WasteForm.vue`) 和编辑 (`EditRecord.vue`) 时不再是必填项。
    *   数据库 `waste_records` 表 `quantity` 字段允许为空 (NULL) (`db/mysql/init_db.js`)。
    *   修复了记录列表 (`RecordsList.vue`, `AdminRecords.vue`) 中数量为空时显示 `NaN` 的问题，现在显示为空白。
    *   调整了列表 (`RecordsList.vue`, `AdminRecords.vue`) 中的筛选逻辑以正确处理空数量值。
    *   新增记录时 (`EditRecord.vue`)，数量字段默认为空 (`undefined`)，不再是 `0`。
    *   后端API (`server.js` POST/PUT `/api/waste-records`) 现在能正确处理 `undefined`/空字符串的数量值，并将其存为 `NULL`。
*   **权限调整**:
    *   普通员工 (role_id=1) 查看记录的时间限制从 7 天缩短为 48 小时 (后端 `server.js` API `/api/waste-records/user/:userId`, 前端 `RecordsList.vue` 提示信息和日期选择器限制)。
    *   明确并确认单位管理员 (role_id=2) 可以查看和编辑其单位内的所有记录，不受创建者限制 (后端 `server.js` 逻辑确认, 前端 `RecordsList.vue` `canEdit` 函数调整)。
*   **导出功能**:
    *   统一了所有导出文件（带/不带图片，员工/管理员视图）的字段内容和列顺序，使其与记录列表视图 (`RecordsList.vue`, `AdminRecords.vue`) 一致，包括添加了"产生工序"和"记录时间"。
    *   修复了导出字段单位不一致的问题（kg -> 吨）。

### 🎨 UI/UX 优化 (UI/UX Improvements)

*   **实时筛选**: 记录列表 (`RecordsList.vue`, `AdminRecords.vue`) 的筛选条件（包括废物类型、地点、工序、数量范围、收集时间）现在支持实时更新结果（带300ms防抖），无需手动点击按钮。
*   **筛选按钮**:
    *   筛选按钮文本从"筛选"更新为"刷新筛选"。
    *   为数量范围筛选框 (`RecordsList.vue`, `AdminRecords.vue`) 添加了清除按钮（小叉号），方便单独清除最小值/最大值。调整了图标位置使其更美观。
*   **导出按钮**:
    *   将原"导出记录"按钮 (`RecordsList.vue`, `AdminRecords.vue`) 替换为三个独立的导出选项按钮："无照片"、"包含首张照片"、"包含全部照片"。
    *   统一了导出按钮的尺寸 (`RecordsList.vue`, `AdminRecords.vue`)，使其与其他操作按钮（如"新增填报"）一致。

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

