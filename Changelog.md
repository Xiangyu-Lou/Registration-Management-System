# Registration-Management-System Changelog

## 2025-08-28

### ♻️ 前端重构：超大组件拆分 + 内存泄漏修复 (Component Refactoring & Memory Leak Fixes)

*   **新增 `useTimerCleanup` composable**:
    *   提供 `safeTimeout(fn, delay)` 替代原生 `setTimeout`
    *   组件卸载时自动清理所有未执行的定时器，防止内存泄漏

*   **新增 `useFormData` composable**:
    *   提取 EditRecord 和 WasteForm 中完全相同的 `locationMap`、`processOptions`、`wasteTypes`、`fetchWasteTypes`、`fetchUnitName` 等共享数据和获取逻辑
    *   消除两个文件中约 50 行重复代码

*   **新增 `useGeolocation` composable**:
    *   封装地理位置获取的响应式状态和 `getCurrentLocation` 函数
    *   重新导出 `isLocationSupported`、`isSecureContext`、`formatCoordinates`、`formatAddress`
    *   消除两个文件中约 36 行重复代码

*   **新增 `usePhotoUpload` composable**:
    *   提取图片压缩上传的全部逻辑（Compressor.js 压缩、进度追踪、文件校验、大文件检测）
    *   支持配置参数处理差异（`largeFileThreshold`、`onBeforeRemove`、`onAfterProcess` 回调）
    *   内部使用 `safeTimeout` 替代所有 `setTimeout`
    *   消除两个文件中约 500 行重复代码

*   **重构 WasteForm.vue**:
    *   导入并使用上述四个 composable，减少约 400 行代码
    *   `submitForm` 和 `selectAllText` 中的 `setTimeout` 替换为 `safeTimeout`
    *   `onBeforeUnmount` 中添加照片资源清理

*   **重构 EditRecord.vue**:
    *   导入并使用上述四个 composable，减少约 350 行代码
    *   新增 `onUnmounted` hook（此前完全缺失），释放所有 blob URL 并清理照片状态
    *   `submitForm` 中的 `setTimeout` 替换为 `safeTimeout`

*   **修复其余组件内存泄漏**:
    *   `RecordsList.vue`：`loadMore` 中的 `setTimeout` → `safeTimeout`
    *   `AdminRecords.vue`：`loadMore` 中的 `setTimeout` → `safeTimeout`
    *   `UserProfile.vue`：`setTimeout` → `safeTimeout`

> 本次重构净减少 583 行代码（+581 / -1164），无功能变更。

## 2025-08-27

### ⚡ 前端性能优化 (Frontend Performance Optimization)

*   **路由懒加载**:
    *   将 12 个路由组件从静态 import 改为动态 `() => import()` 按需加载
    *   仅保留 Login 页面为静态导入（首屏必须）
    *   主入口 bundle 从 2.2MB 降至 25.65 KiB，其余组件按需加载

*   **生产环境自动移除 console 日志**:
    *   在 `vue.config.js` 中配置 terser 的 `pure_funcs` 选项
    *   生产构建自动移除 `console.log`、`console.info`、`console.warn`（共 321 处）
    *   保留 `console.error` 用于线上错误排查
    *   开发环境不受影响，保持调试能力

*   **移除无用依赖**:
    *   从前端 `package.json` 中移除 `bcrypt`（后端专用依赖，前端无任何引用）

## 2025-08-26

### ♻️ 前端重构 (Frontend Refactoring)

*   **组件拆分与代码复用**:
    *   提取 `PhotoCell.vue` 通用组件，统一三个列表页的照片缩略图展示逻辑
    *   新增 `usePhotoPreview` composable，封装照片预览的响应式状态和方法
    *   新增 `useExport` composable，统一三个列表页的导出逻辑（含首张图片/全部图片/不含图片）

*   **消除重复工具函数**:
    *   将 `hasLocationInfo`、`formatLocationDisplay` 提取到 `commonUtils.js`
    *   AdminRecords、SuperAdminRecords、RecordsList、EditRecord 四个页面统一从 `commonUtils` 导入 `parsePhotoPath`
    *   删除各页面中重复定义的照片解析、位置信息、照片预览、导出等函数

*   **代码精简效果**:
    *   三个列表页各减少约 300 行导出代码 + 50 行照片预览代码 + 30 行照片模板代码
    *   新增 3 个共享文件：`usePhotoPreview.js`、`useExport.js`、`PhotoCell.vue`

## 2025-07-19

### ✨ 新功能 (Features)

*   **公司层级管理系统**:
    *   新增完整的公司管理体系，支持多公司架构
    *   公司管理员(role_id=3)：只能管理本公司的单位和用户
    *   系统超级管理员(role_id=5)：管理所有公司和全系统数据
    *   权限隔离：各公司数据完全隔离，确保数据安全

*   **问题反馈系统**:
    *   所有用户都可以提交问题反馈，支持标题和详细描述
    *   超级管理员可查看、处理和回复用户反馈
    *   反馈状态管理：待处理、已回复、已解决
    *   支持反馈统计和筛选功能，便于问题跟踪处理

### 🔧 权限优化 (Permission Improvements)

*   **权限控制精细化**:
    *   修复单位下拉列表权限问题：公司管理员只能看到本公司单位
    *   单位管理员现在可以正常访问人员管理功能
    *   监督人员不再显示人员管理按钮，权限控制更精确

## 2025-06-01(儿童节) 🎈

### ✨ 新功能 (Features)

*   **超级管理员权限增强**:
    *   超级管理员现在可以在编辑废物记录时修改记录所属的单位
    *   编辑界面中的单位选择器对超级管理员开放，支持将记录转移到其他单位
    *   增强了数据管理的灵活性，便于跨单位的记录管理和纠错

*   **操作日志查看系统**:
    *   新增用户权限字段 `can_view_logs`，控制操作日志的查看权限
    *   创建完整的操作日志查看界面，支持实时筛选、分页浏览、统计分析
    *   提供多维度筛选功能：操作类型、操作人员（支持用户名/手机号搜索）、时间范围、描述关键词
    *   实现防抖搜索机制，提高查询性能和用户体验
    *   为管理员提供系统行为审计和问题排查工具

## 2025-05-31

### ✨ 新功能 (Features)

*   **用户操作日志系统**:
    *   新增完整的用户操作审计日志功能，记录所有用户行为和系统操作
    *   数据库新增 `operation_logs` 表，包含操作类型、目标对象、详细描述、IP地址、用户代理等字段
    *   添加专门的日志记录工具函数，支持登录、废物记录、用户管理、单位管理、废物类型管理等操作日志
    *   实现详细的操作描述生成，包含完整的数据变更信息和上下文
    *   为管理员提供操作日志查看接口，支持系统行为追踪和审计

*   **增强的操作描述**:
    *   废物记录操作：包含单位名称、废物类型、位置、数量、工序、收集时间、照片数量、备注等完整信息
    *   用户管理操作：包含用户角色、所属单位、状态变更、数据修改前后对比等详细信息
    *   登录日志：记录成功/失败原因、用户角色、所属单位、IP地址等安全相关信息
    *   支持监督数据标识，明确区分普通数据和监督人员录入的数据

### 🐛 Bug修复与调整 (Bug Fixes & Adjustments)

*   **修复收集时间时区问题**:
    *   解决编辑废物记录时收集开始时间会自动变化的问题
    *   在数据库配置中添加 `timezone: '+08:00'` 和 `dateStrings: true` 设置
    *   前端修改时间解析逻辑，避免JavaScript自动时区转换导致的时间偏移
    *   后端新增专用的时间解析工具函数 `parseCollectionTime` 和 `formatTimeForDisplay`
    *   确保从数据库读取和写入的时间格式保持一致性

*   **时间处理优化**:
    *   统一前后端时间格式处理，避免时区转换带来的数据不一致
    *   改进日期时间字符串的解析和格式化逻辑
    *   修复编辑记录时时间字段的数据绑定问题

### 🔧 技术改进 (Technical Improvements)

*   **日志架构设计**:
    *   创建模块化的日志记录系统，支持不同类型操作的专门处理
    *   实现操作日志模型类，提供统一的日志存储和查询接口
    *   添加日志控制器和路由，为后续管理界面提供API支持

*   **时间处理工具**:
    *   新增 `dateUtils.js` 工具模块，提供统一的时间格式化和解析函数
    *   改进数据库时间字段的处理机制，确保时区一致性
    *   优化前端时间控件的数据绑定和显示逻辑

## 2025-05-27

### 🏗️ 重大架构重构 (Major Architecture Refactoring)

#### **后端架构完全重构**

*   **MVC架构迁移**:
    *   将原始的单体文件 `server.js` (1735行) 重构为标准的MVC架构
    *   主服务器文件从1735行压缩至76行，提高代码可读性和可维护性
    *   完全向后兼容，所有API接口保持不变，前端无需任何修改

*   **模块化目录结构**:
    ```
    backend/
    ├── config/           # 配置文件层
    │   ├── database.js   # 数据库连接配置
    │   ├── jwt.js        # JWT认证配置
    │   └── upload.js     # 文件上传配置
    ├── controllers/      # 控制器层
    │   ├── authController.js        # 认证控制器
    │   ├── userController.js        # 用户管理控制器
    │   ├── unitController.js        # 单位管理控制器
    │   ├── wasteTypeController.js   # 废物类型控制器
    │   └── wasteRecordController.js # 废物记录控制器
    ├── models/          # 数据模型层
    │   ├── User.js      # 用户数据模型
    │   ├── Unit.js      # 单位数据模型
    │   ├── WasteType.js # 废物类型数据模型
    │   └── WasteRecord.js # 废物记录数据模型
    ├── routes/          # 路由层
    │   ├── auth.js      # 认证路由
    │   ├── users.js     # 用户路由
    │   ├── units.js     # 单位路由
    │   ├── wasteTypes.js # 废物类型路由
    │   └── wasteRecords.js # 废物记录路由
    ├── middleware/      # 中间件
    │   ├── auth.js      # 认证中间件
    │   └── errorHandler.js # 错误处理中间件
    ├── utils/          # 工具类
    │   ├── auth.js     # 认证工具
    │   ├── dateUtils.js # 日期工具
    │   └── fileUtils.js # 文件工具
    └── server.js       # 精简的主服务器文件
    ```

*   **数据访问层优化**:
    *   创建独立的数据模型类，封装所有数据库操作
    *   统一的参数验证和数据清理机制
    *   优化SQL查询性能，减少数据库连接开销
    *   支持复杂查询、分页、导出等高级功能

*   **业务逻辑分离**:
    *   将业务逻辑从路由处理中分离到控制器层
    *   统一的错误处理和响应格式
    *   清晰的职责分工和模块边界

*   **中间件系统**:
    *   统一的认证和授权中间件
    *   全局错误处理中间件
    *   支持文件上传的多媒体处理中间件

### 🐛 Bug修复与调整 (Bug Fixes & Adjustments)

*   **照片管理逻辑优化**:
    *   修复编辑记录时上传新照片会替换旧照片的问题
    *   实现照片累加功能：新上传的照片会添加到现有照片列表中
    *   添加精确的照片删除功能：支持删除指定照片文件，不仅仅是数据库记录
    *   前端增加删除照片跟踪，后端实际删除 `uploads` 文件夹中的图片文件

*   **用户密码管理修复**:
    *   修复账户设置中更改密码时的 `bcrypt` 错误
    *   添加专门的密码验证方法 `findByIdWithPassword` 和 `findByPhoneForAuth`
    *   增强空密码检查和错误提示机制

*   **权限认证问题修复**:
    *   修复超级管理员删除记录时的401未授权错误
    *   统一前端认证请求处理：所有需要认证的请求使用 `httpService` 而非原生 `axios`
    *   确保所有认证请求正确携带JWT token

### 🔧 技术改进 (Technical Improvements)

*   **代码质量提升**:
    *   代码分离度和可复用性大幅提升
    *   统一的错误处理和日志记录机制
    *   改善的内存使用和性能优化
    *   标准化的代码风格和注释

*   **配置管理**:
    *   环境变量和配置文件完全分离
    *   支持开发、测试、生产环境的不同配置
    *   JWT密钥、数据库配置等敏感信息统一管理

*   **安全性增强**:
    *   统一的认证机制和权限检查
    *   优化的密码处理和验证逻辑
    *   更安全的文件上传和处理机制

### 📚 文档完善 (Documentation)

*   **重构文档**:
    *   添加 `backend/REFACTOR_SUMMARY.md` 详细重构说明
    *   添加 `backend/ISSUE_FIXES.md` 问题修复记录
    *   更新项目结构文档和API说明

### 🚀 性能优化 (Performance Improvements)

*   **数据库优化**:
    *   连接池管理优化
    *   查询性能改进
    *   减少重复查询和数据传输

*   **内存管理**:
    *   优化文件上传处理
    *   减少内存泄漏风险
    *   改善垃圾回收效率

### ⚡ 向后兼容性 (Backward Compatibility)

*   **完全兼容**:
    *   所有API接口保持不变
    *   前端代码无需任何修改
    *   数据库结构保持一致
    *   环境变量读取方式不变

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

