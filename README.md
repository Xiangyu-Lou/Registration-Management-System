# Registration Management System

一个基于 Vue 3 + Node.js + MySQL 的固体废物管理系统，采用现代化的MVC架构设计。

[English](README_EN.md) | [部署指南](DEPLOYMENT.md) | [更新日志](CHANGELOG.md)

## 🎯 项目特色

### 💡 核心功能
- **基础单位管理**
  - 支持多个基础单位的选择和管理
  - 每个单位可独立管理废物记录

### 👥 用户权限系统
- **四级权限管理**
  - **超级管理员** - 全系统数据查看权限，所有单位记录管理权限
  - **单位管理员** - 本单位数据查看权限，本单位记录管理权限
  - **基层员工** - 本单位废物填报权限，基础数据查看权限（48小时限制）
  - **监督人员** - 独立的监督数据录入和管理权限

### 🗂️ 废物管理
- **废物分类系统**
  - 油泥砂、含油包装物等多种废物类型
  - 支持自定义废物类型管理
- **废物信息填报**
  - 基础信息：产生地点、产生工序、收集时间、收集数量
  - 现场照片管理：收集前照片（≤5张）+ 收集后照片（≤5张）
  - 自动功能：自动记录填报时间、自动关联填报单位
- **高级功能**
  - 多种导出格式（含图片/不含图片）
  - 实时筛选和搜索
  - 数据统计和分析

## 🏗️ 项目架构

### 整体架构
采用现代化的**MVC (Model-View-Controller)** 分层架构，确保代码的可维护性和可扩展性。

### 技术栈
- **前端**: Vue 3 + Composition API + Element Plus
- **后端**: Node.js + Express + MVC架构
- **数据库**: MySQL 8.0+
- **认证**: JWT
- **文件上传**: Multer

## 📁 项目结构

```
Registration-Management-System/
│
├── backend/                    # Node.js MVC后端服务
│   ├── config/                 # 配置文件层
│   │   ├── database.js         # 数据库连接配置
│   │   ├── jwt.js             # JWT认证配置
│   │   └── upload.js          # 文件上传配置
│   ├── controllers/           # 控制器层 (业务逻辑)
│   │   ├── authController.js        # 认证控制器
│   │   ├── userController.js        # 用户管理控制器
│   │   ├── unitController.js        # 单位管理控制器
│   │   ├── wasteTypeController.js   # 废物类型控制器
│   │   └── wasteRecordController.js # 废物记录控制器
│   ├── models/               # 数据模型层 (数据访问)
│   │   ├── User.js           # 用户数据模型
│   │   ├── Unit.js           # 单位数据模型
│   │   ├── WasteType.js      # 废物类型数据模型
│   │   └── WasteRecord.js    # 废物记录数据模型
│   ├── routes/               # 路由层 (API路由)
│   │   ├── auth.js           # 认证路由
│   │   ├── users.js          # 用户路由
│   │   ├── units.js          # 单位路由
│   │   ├── wasteTypes.js     # 废物类型路由
│   │   └── wasteRecords.js   # 废物记录路由
│   ├── middleware/           # 中间件
│   │   ├── auth.js           # 认证中间件
│   │   └── errorHandler.js   # 错误处理中间件
│   ├── utils/               # 工具类
│   │   ├── auth.js          # 认证工具
│   │   ├── dateUtils.js     # 日期工具
│   │   └── fileUtils.js     # 文件工具
│   ├── package.json         # 后端依赖配置
│   ├── server.js            # 精简的主服务器文件 (76行)
│   ├── REFACTOR_SUMMARY.md  # 重构详细说明
│   └── ISSUE_FIXES.md       # 问题修复记录
│
├── frontend/                # Vue 3前端应用
│   ├── public/              # 静态资源
│   ├── src/                 # 源代码
│   │   ├── views/           # 页面组件
│   │   │   ├── Login.vue          # 登录页面
│   │   │   ├── WasteForm.vue      # 废物填报页面
│   │   │   ├── EditRecord.vue     # 记录编辑页面
│   │   │   ├── RecordsList.vue    # 记录列表页面
│   │   │   ├── AdminRecords.vue   # 管理员记录页面
│   │   │   └── UserManagement.vue # 用户管理页面
│   │   ├── router/          # 路由配置
│   │   ├── store/           # 状态管理
│   │   ├── config/          # 配置文件
│   │   │   ├── api.js       # API配置
│   │   │   └── httpService.js # HTTP服务封装
│   │   ├── utils/           # 工具函数
│   │   ├── App.vue          # 主应用组件
│   │   └── main.js          # 应用入口文件
│   ├── package.json         # 前端依赖配置
│   └── vue.config.js        # Vue配置文件
│
├── db/                      # 数据库文件
│   └── mysql/               # MySQL数据库脚本
│       ├── init_db.js             # 完整MySQL初始化脚本
│       ├── init_db_simple.js     # 简化MySQL初始化脚本
│       └── README.md              # MySQL配置说明
│
├── uploads/                 # 上传照片存储目录 (运行后生成)
├── DEPLOYMENT.md           # 部署指南
├── CHANGELOG.md            # 更新日志
└── README.md               # 项目说明 (本文件)
```

## 🚀 架构优势

### MVC分层架构
- **Model (模型层)**: 封装数据访问逻辑，提供统一的数据接口
- **View (视图层)**: Vue 3前端，负责用户界面和交互
- **Controller (控制器层)**: 处理业务逻辑，连接模型和视图

### 代码质量
- 主服务器文件从1735行精简至76行
- 模块化设计，职责分工明确
- 统一的错误处理和日志记录
- 完全向后兼容，API接口不变

### 性能优化
- 数据库连接池管理
- 优化的SQL查询
- 内存使用优化
- 文件上传性能改进

## 📋 快速开始

### 环境要求
- Node.js 16.0+
- MySQL 8.0+
- npm 或 yarn

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd Registration-Management-System
   ```

2. **后端配置**
   ```bash
   cd backend
   npm install
   
   # 创建环境变量文件
   cp .env.example .env
   # 编辑 .env 文件，配置数据库连接和JWT密钥
   ```

3. **前端配置**
   ```bash
   cd frontend
   npm install
   ```

4. **数据库初始化**
   ```bash
   cd db/mysql
   node init_db.js
   ```

5. **启动服务**
   ```bash
   # 后端服务 (端口3000)
   cd backend
   npm start
   
   # 前端服务 (端口8080)
   cd frontend
   npm run serve
   ```

## 👤 测试账户

数据库初始化后，系统包含以下测试账户：

| 角色 | 手机号 | 密码 | 权限说明 |
|------|--------|------|----------|
| 超级管理员 | 13800000003 | 1 | 全系统管理权限 |
| 单位管理员 | 13800000002 | 1 | 单位内管理权限 |
| 基层员工 | 13800000001 | 1 | 基础填报权限 |
| 监督人员 | 13800000004 | 1 | 监督数据权限 |

## 📖 部署指南

| 环境 | 指南链接 | 说明 |
|------|----------|------|
| Windows开发环境 | [Windows部署指南](development_windows.md) | 本地开发环境搭建 |
| Linux生产环境 | [Linux部署指南](development_linux.md) | 云服务器部署 |
| 详细部署文档 | [DEPLOYMENT.md](DEPLOYMENT.md) | 完整部署说明 |

## 🔄 更新日志

详细的更新记录请查看 [CHANGELOG.md](CHANGELOG.md)

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 支持

如果您在使用过程中遇到问题，请通过以下方式获取帮助：
- 创建 [Issue](../../issues)
- 查看 [FAQ](FAQ.md)
- 阅读 [文档](docs/)