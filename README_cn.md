# Registration Management System

一个基于 Vue 3 + Node.js + MySQL 的固体废物管理系统，采用现代化的MVC架构设计。

[English](README.md) | [架构文档](ARCHITECTURE.md) | [介绍手册](instruction.md) | [更新日志](Changelog.md) | [API文档](API_Documentation.md)

## 项目特色

### 核心功能
- **公司层级管理**
  - 支持多公司架构，每个公司管理独立的单位和用户
  - 完整的权限隔离体系，确保各公司数据安全
  - 灵活的组织结构：公司 → 单位 → 用户

- **问题反馈系统**
  - 所有用户可提交问题反馈，支持详细描述
  - 管理员可查看、处理和回复反馈
  - 完整的状态管理和统计功能

### 用户权限系统
- **五级权限管理**
  - **系统超级管理员** - 全系统数据查看权限，所有公司和单位管理权限
  - **公司管理员** - 本公司数据查看权限，本公司单位和用户管理权限
  - **单位管理员** - 本单位数据查看权限，本单位记录和用户管理权限
  - **基层员工** - 本单位废物填报权限，基础数据查看权限（48小时限制）
  - **监督人员** - 独立的监督数据录入和管理权限

### 废物管理
- **废物分类系统**
  - 油泥砂、含油包装物等多种废物类型
  - 支持自定义废物类型管理
- **废物信息填报**
  - 基础信息：产生地点、产生工序、收集时间、收集数量
  - 现场照片管理：收集前照片（≤5张）+ 收集后照片（≤5张）
  - GPS定位：自动获取坐标，高德地图逆地理编码
  - 自动功能：自动记录填报时间、自动关联填报单位
- **高级功能**
  - 多种导出格式（含嵌入图片的Excel / CSV）
  - 实时筛选和搜索
  - 数据统计和分析

### 操作日志系统
- **全面审计追踪**
  - 记录所有用户操作：登录、废物记录管理、用户管理等
  - 详细操作描述，包含数据变更前后对比
- **安全监控**
  - 记录操作时间、IP地址、用户代理等安全信息
  - 支持监督数据和普通数据的区分标识
- **管理功能**
  - 授权人员可查看完整的操作日志界面
  - 支持多维度实时筛选：操作类型、人员搜索、时间范围、关键词
  - 提供统计分析和便捷的问题排查工具

## 技术栈

- **前端**: Vue 3 + Composition API + Element Plus + Axios + ExcelJS
- **后端**: Node.js + Express + MVC架构
- **数据库**: MySQL 8.0+
- **认证**: JWT + bcrypt
- **安全**: Helmet + 速率限制 + XSS/SQL注入防护
- **文件上传**: Multer（客户端通过CompressorJS压缩图片）
- **测试**: Jest + Supertest
- **部署**: Nginx + PM2

详细架构文档请参阅 [ARCHITECTURE.md](ARCHITECTURE.md)。

## 部署指南

| 环境 | 指南链接 |
|------|----------|
| Linux（推荐） | [Linux部署指南](development_linux_CN.md) |
| Windows | [Windows部署指南](development_windows_CN.md) |

## 项目结构

```
Registration-Management-System/
│
├── backend/                          # Node.js MVC后端服务
│   ├── app.js                        # Express应用配置与中间件管道
│   ├── server.js                     # 服务器入口
│   ├── config/
│   │   ├── database.js               # MySQL连接池配置
│   │   ├── jwt.js                    # JWT认证配置
│   │   └── upload.js                 # Multer文件上传配置
│   ├── controllers/
│   │   ├── authController.js         # 登录与认证
│   │   ├── userController.js         # 用户管理
│   │   ├── unitController.js         # 单位管理
│   │   ├── companyController.js      # 公司管理与统计
│   │   ├── wasteTypeController.js    # 废物类型管理
│   │   ├── wasteRecordController.js  # 废物记录管理与导出
│   │   ├── operationLogController.js # 操作日志查看与统计
│   │   ├── feedbackController.js     # 问题反馈管理
│   │   └── recordController.js       # 附加记录操作
│   ├── models/
│   │   ├── User.js                   # 用户数据模型
│   │   ├── Unit.js                   # 单位数据模型
│   │   ├── Company.js                # 公司数据模型
│   │   ├── WasteType.js              # 废物类型数据模型
│   │   ├── WasteRecord.js            # 废物记录数据模型
│   │   ├── OperationLog.js           # 操作日志数据模型
│   │   └── Feedback.js               # 问题反馈数据模型
│   ├── routes/
│   │   ├── auth.js                   # 认证路由
│   │   ├── users.js                  # 用户路由
│   │   ├── units.js                  # 单位路由
│   │   ├── companies.js              # 公司路由
│   │   ├── wasteTypes.js             # 废物类型路由
│   │   ├── wasteRecords.js           # 废物记录路由
│   │   ├── operationLogs.js          # 操作日志路由
│   │   └── feedback.js               # 问题反馈路由
│   ├── middleware/
│   │   ├── auth.js                   # JWT认证与角色权限
│   │   ├── security.js               # XSS、SQL注入、输入限制
│   │   └── errorHandler.js           # 全局错误处理
│   └── utils/
│       ├── auth.js                   # 密码哈希、JWT工具
│       ├── dateUtils.js              # 日期格式化工具
│       ├── fileUtils.js              # 文件上传/删除工具
│       └── logger.js                 # 审计日志工具
│
├── frontend/                         # Vue 3前端应用
│   ├── public/                       # 静态资源
│   ├── src/
│   │   ├── main.js                   # 应用入口
│   │   ├── App.vue                   # 根组件
│   │   ├── router/                   # 路由定义与守卫
│   │   ├── store/                    # 认证状态管理
│   │   ├── config/
│   │   │   ├── api.js                # API端点配置
│   │   │   └── httpService.js        # Axios实例与拦截器
│   │   ├── components/
│   │   │   ├── AppHeader.vue         # 主导航栏
│   │   │   └── common/              # 可复用组件
│   │   │       ├── CommonDataTable.vue
│   │   │       ├── CommonFilter.vue
│   │   │       ├── CommonFormDialog.vue
│   │   │       └── ImagePreview.vue
│   │   ├── views/
│   │   │   ├── Login.vue             # 登录页面
│   │   │   ├── UnitSelection.vue     # 单位选择
│   │   │   ├── WasteForm.vue         # 废物记录填报
│   │   │   ├── RecordsList.vue       # 记录列表与筛选
│   │   │   ├── EditRecord.vue        # 记录编辑
│   │   │   ├── AdminRecords.vue      # 公司管理员面板
│   │   │   ├── SuperAdminRecords.vue # 系统管理员面板
│   │   │   ├── UserManagement.vue    # 用户管理
│   │   │   ├── UserProfile.vue       # 个人资料与密码
│   │   │   ├── CompanyManagement.vue # 公司管理
│   │   │   ├── OperationLogs.vue     # 操作日志查看
│   │   │   ├── FeedbackForm.vue      # 提交反馈
│   │   │   ├── FeedbackList.vue      # 用户反馈列表
│   │   │   └── FeedbackManagement.vue # 反馈管理
│   │   ├── utils/
│   │   │   ├── commonUtils.js        # 通用工具函数
│   │   │   ├── exportUtils.js        # Excel/CSV导出
│   │   │   └── locationUtils.js      # GPS与高德地图集成
│   │   └── styles/                   # 全局与响应式CSS
│   ├── package.json
│   └── vue.config.js                 # 构建与开发服务器配置
│
├── db/mysql/                         # 数据库初始化脚本
├── tests/                            # Jest + Supertest测试套件（9个测试文件）
├── ngnix_config/                     # Nginx配置（linux与windows）
├── uploads/                          # 照片存储目录（运行后生成）
├── backup.sh                         # 数据库与文件备份脚本
├── ARCHITECTURE.md                   # 架构与技术栈文档
├── API_Documentation.md              # 完整API参考文档
├── Changelog.md                      # 更新日志
├── instruction.md                    # 系统使用手册
├── LICENSE                           # MIT许可证
└── README_cn.md                      # 本文件
```

## 测试账户

数据库初始化后，系统包含以下测试账户：

| 角色 | 手机号 | 密码 | 权限说明 |
|------|--------|------|----------|
| 系统超级管理员 | 13800000005 | 1 | 全系统管理权限 |
| 公司管理员 | 13800000003 | 1 | 公司内管理权限 |
| 单位管理员 | 13800000002 | 1 | 单位内管理权限 |
| 基层员工 | 13800000001 | 1 | 基础填报权限 |
| 监督人员 | 13800000004 | 1 | 监督数据权限 |

## 许可证

[MIT](LICENSE)
