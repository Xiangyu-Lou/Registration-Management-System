# Backend API Documentation

> **Source**: All documentation is derived directly from the actual source code in [`backend/`](backend/).
> **Base URL**: `http://localhost:3000`

---

## Table of Contents

1. [Authentication & Middleware](#authentication--middleware)
2. [Rate Limiting](#rate-limiting)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
   - [Health Check](#health-check)
   - [Authentication](#authentication)
   - [User Management](#user-management)
   - [Unit Management](#unit-management)
   - [Waste Type Management](#waste-type-management)
   - [Waste Record Management](#waste-record-management)
   - [Company Management](#company-management)
   - [Feedback](#feedback)
   - [Operation Logs](#operation-logs)
5. [Role System](#role-system)
6. [File Upload](#file-upload)
7. [Error Handling](#error-handling)

---

## Authentication & Middleware

### JWT Authentication

The server uses **JSON Web Tokens (JWT)** for authentication. Tokens are passed via the `Authorization` header:

```
Authorization: Bearer <token>
```

- **Secret**: Configured via `JWT_SECRET` environment variable.
- **Expiration**: `24h` by default, `30d` if `rememberMe` is `true` during login.

### Middleware Reference

| Middleware | Description |
|---|---|
| `authenticateToken` | Decodes and validates the JWT. Attaches decoded user to `req.user`. Returns `401` if missing or invalid. |
| `blockSupervisor` | Validates JWT **and** blocks users with `role_id === 4` (Supervisor). Returns `403` for supervisors, `401` for missing/invalid tokens. Used on all user management endpoints. |
| `requireSuperAdmin` | Requires `role_id` to be 3, 4, or 5. Returns `403` otherwise. Used on waste type and unit write operations. |
| `requireSystemAdmin` | Requires `role_id === 5` (System Super Admin). Returns `403` otherwise. |
| `requireLogViewPermission` | Requires a valid JWT + `can_view_logs` flag set on the user in the database. Blocks supervisors. Used for updating other users' log permissions. |
| `validateSupervisorUnitAccess` | For supervisors (`role_id === 4`), verifies the target unit belongs to their company. No-op for other roles. |

---

## Rate Limiting

Applied globally to all `/api/*` routes:

| Scope | Limit | Window |
|---|---|---|
| All `/api/*` routes | 100 requests per IP | 15 minutes |
| `/api/login` (login-specific) | 5 attempts per IP (successful requests excluded) | 15 minutes |

Static file paths (`/uploads/*`, `/static/*`) are excluded from the global limit.

---

## Database Schema

### `companies`

| Column | Type | Constraints |
|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT |
| `name` | VARCHAR | NOT NULL, UNIQUE |
| `code` | VARCHAR | Nullable, UNIQUE |
| `status` | TINYINT | DEFAULT 1 (0 = deleted, 1 = active) |

---

### `user_roles`

| Column | Type | Constraints |
|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT |
| `name` | VARCHAR(50) | NOT NULL, UNIQUE |

**Seeded values:**

| id | name |
|---|---|
| 1 | 基层员工 (Basic Employee) |
| 2 | 单位管理员 (Unit Admin) |
| 3 | 超级管理员 (Company Super Admin) |
| 4 | 监督人员 (Supervisor) |
| 5 | 系统超级管理员 (System Super Admin) |

---

### `units`

| Column | Type | Constraints |
|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT |
| `name` | VARCHAR(100) | NOT NULL |
| `company_id` | INT | NOT NULL, FK → `companies.id` |

Unit names are unique **per company**.

---

### `users`

| Column | Type | Constraints |
|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT |
| `username` | VARCHAR(100) | NOT NULL |
| `phone` | VARCHAR(20) | NOT NULL, UNIQUE |
| `password` | VARCHAR(100) | Nullable (bcrypt hashed) |
| `role_id` | INT | NOT NULL, FK → `user_roles.id` |
| `unit_id` | INT | Nullable, FK → `units.id` |
| `company_id` | INT | NOT NULL, FK → `companies.id` |
| `status` | TINYINT | DEFAULT 1 (0 = disabled, 1 = active) |
| `can_view_logs` | TINYINT | Nullable (1 = can view operation logs) |

---

### `waste_types`

| Column | Type | Constraints |
|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT |
| `name` | VARCHAR(100) | NOT NULL, UNIQUE |

**Seeded values:** 油泥砂, 含油包装物, 一般固废, 其他

---

### `waste_records`

| Column | Type | Constraints |
|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT |
| `unit_id` | INT | NOT NULL, FK → `units.id` |
| `waste_type_id` | INT | NOT NULL, FK → `waste_types.id` |
| `location` | VARCHAR(200) | NOT NULL |
| `collection_start_time` | DATETIME | NOT NULL |
| `photo_path_before` | VARCHAR(500) | Nullable, JSON array of paths |
| `photo_path_after` | VARCHAR(500) | Nullable, JSON array of paths |
| `quantity` | DECIMAL(10,3) | Nullable |
| `created_at` | DATETIME | NOT NULL |
| `creator_id` | INT | Nullable, FK → `users.id` |
| `remarks` | TEXT | Nullable |
| `process` | VARCHAR(100) | Nullable |
| `is_supervised` | TINYINT(1) | DEFAULT NULL (1 = supervisor-created entry) |
| `company_id` | INT | NOT NULL, FK → `companies.id` |
| `longitude` | DECIMAL(10,7) | Nullable |
| `latitude` | DECIMAL(10,7) | Nullable |
| `address` | VARCHAR(500) | Nullable |
| `district` | VARCHAR(100) | Nullable |
| `city` | VARCHAR(100) | Nullable |
| `province` | VARCHAR(100) | Nullable |

---

### `operation_logs`

| Column | Type | Constraints |
|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT |
| `user_id` | INT | Nullable, FK → `users.id` |
| `operation_type` | VARCHAR | e.g. `'login'`, `'create'`, `'update'`, `'delete'` |
| `target_type` | VARCHAR | e.g. `'waste_record'`, `'user'`, `'unit'`, `'company'` |
| `target_id` | INT | Nullable, ID of the affected resource |
| `description` | TEXT | Human-readable log description |
| `ip_address` | VARCHAR | Nullable |
| `user_agent` | VARCHAR | Nullable |
| `additional_data` | TEXT | Nullable, JSON string with structured details |
| `company_id` | INT | Nullable, FK → `companies.id` |
| `created_at` | DATETIME | AUTO |

---

### `feedback`

| Column | Type | Constraints |
|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT |
| `user_id` | INT | FK → `users.id` |
| `company_id` | INT | FK → `companies.id` |
| `title` | VARCHAR | NOT NULL |
| `description` | TEXT | NOT NULL |
| `type` | ENUM | `'bug'`, `'feature'`, `'improvement'`, `'other'`; DEFAULT `'bug'` |
| `priority` | ENUM | `'low'`, `'medium'`, `'high'`; DEFAULT `'medium'` |
| `status` | ENUM | `'pending'`, `'processing'`, `'resolved'`, `'closed'`; DEFAULT `'pending'` |
| `admin_id` | INT | Nullable, FK → `users.id` |
| `admin_reply` | TEXT | Nullable |
| `images` | TEXT | Nullable |
| `created_at` | DATETIME | AUTO |
| `updated_at` | DATETIME | AUTO |

---

## API Endpoints

---

## Health Check

### GET /health

```
GET /health
```

**Auth**: None

**Response** `200`:
```json
{
  "success": true,
  "message": "服务正常运行",
  "timestamp": "2024-01-15T06:30:00.000Z"
}
```

---

### GET /api/test

```
GET /api/test
```

**Auth**: None

**Response** `200`:
```json
{ "message": "服务器运行正常" }
```

---

## Authentication

### POST /api/login

```
POST /api/login
```

**Auth**: None
**Rate limit**: 5 attempts per 15 min per IP (successful requests not counted)

**Request Body** (`application/json`):

| Field | Type | Required | Description |
|---|---|---|---|
| `phone` | string | ✅ | User phone number |
| `password` | string | ✅ | User password (returns `400` if omitted; returns `401` if the account has no password set in the DB) |
| `rememberMe` | boolean | ❌ | If `true`, token expires in 30 days; otherwise 24 hours |

**Response** `200`:
```json
{
  "id": 1,
  "username": "张三",
  "phone": "13800000001",
  "role": "基层员工",
  "role_id": 1,
  "unit_id": 1,
  "unit_name": "牛庄",
  "company_id": 1,
  "company_name": "示例公司",
  "can_view_logs": null,
  "token": "<JWT token>"
}
```

**Error Responses**:

| Status | Condition |
|---|---|
| `400` | Missing phone or password |
| `401` | User not found, wrong password, or account has no password set |
| `403` | Account is disabled (`status === 0`) |
| `500` | Server error |

---

## User Management

> All user management endpoints use the `blockSupervisor` middleware — they require a valid JWT and **block** users with `role_id === 4` (Supervisor).
> System Super Admin (`role_id === 5`) can manage users across all companies. All other roles can only manage users within their own company.

---

### GET /api/users

```
GET /api/users
```

**Auth**: `blockSupervisor` (JWT required, supervisors blocked)

**Response** `200`: Array of user objects:
```json
[
  {
    "id": 1,
    "username": "张三",
    "phone": "13800000001",
    "role_id": 1,
    "role_name": "基层员工",
    "unit_id": 1,
    "unit_name": "牛庄",
    "company_id": 1,
    "company_name": "示例公司",
    "status": 1,
    "can_view_logs": null
  }
]
```

**Filtering**: System Super Admin (`role_id === 5`) sees all users; all other roles see only their company's users.

**Sort order**: Company name ASC → Unit name ASC → Role ID DESC → Username ASC

---

### GET /api/users/unit/:unitId

```
GET /api/users/unit/:unitId
```

**Auth**: `blockSupervisor`

**URL Params**:

| Param | Type | Description |
|---|---|---|
| `unitId` | integer | ID of the unit |

**Response** `200`: Array of user objects filtered by `unit_id`. Schema is the same as Get All Users except `can_view_logs` is **not** included.
System Super Admin sees all matching users; others see only their company's users.

**Sort order**: Role ID DESC → Username ASC

---

### GET /api/users/:id

```
GET /api/users/:id
```

**Auth**: `blockSupervisor`

**URL Params**:

| Param | Type | Description |
|---|---|---|
| `id` | integer | User ID |

**Response** `200`:
```json
{
  "id": 1,
  "username": "张三",
  "phone": "13800000001",
  "role": "基层员工",
  "role_id": 1,
  "unit_id": 1,
  "unit_name": "牛庄",
  "company_id": 1,
  "company_name": "示例公司",
  "status": 1
}
```

**Error Responses**:

| Status | Condition |
|---|---|
| `404` | User not found |

---

### POST /api/users

```
POST /api/users
```

**Auth**: `blockSupervisor`

**Request Body** (`application/json`):

| Field | Type | Required | Description |
|---|---|---|---|
| `username` | string | ✅ | Display name |
| `phone` | string | ✅ | Unique phone number |
| `password` | string | ✅ | Password, min 6 characters (bcrypt hashed) |
| `roleId` | integer | ✅ | Role ID (1–5) |
| `unitId` | integer | ❌ | Unit ID |
| `companyId` | integer | Conditional | Required if caller is System Super Admin (`role_id === 5`); otherwise defaults to caller's company |

**Business Rules**:
- Non-system-admins can only create users within their own company. Passing a `companyId` that differs from the caller's company is rejected with `403`.
- System Super Admin must specify `companyId`.

**Response** `201`:
```json
{
  "message": "用户创建成功",
  "id": 5
}
```

**Error Responses**:

| Status | Condition |
|---|---|
| `400` | Missing required fields, password too short, or phone already registered |
| `403` | Attempting to create user in another company (non-system-admin) |

---

### PUT /api/users/:id

```
PUT /api/users/:id
```

**Auth**: `blockSupervisor`

**URL Params**:

| Param | Type | Description |
|---|---|---|
| `id` | integer | User ID |

**Request Body** (`application/json`):

| Field | Type | Required | Description |
|---|---|---|---|
| `username` | string | ✅ | Display name |
| `phone` | string | ✅ | Phone number |
| `password` | string | ❌ | New password (only updated if provided) |
| `roleId` | integer | ✅ | Role ID |
| `unitId` | integer | ❌ | Unit ID |
| `companyId` | integer | ❌ | Only System Super Admin can transfer user to another company |

**Response** `200`:
```json
{
  "message": "用户信息更新成功",
  "id": 1
}
```

**Error Responses**:

| Status | Condition |
|---|---|
| `400` | Missing required fields or phone used by another user |
| `403` | Attempting to manage a user from another company, or transferring user to another company without permission |
| `404` | User not found |

---

### DELETE /api/users/:id

```
DELETE /api/users/:id
```

**Auth**: `blockSupervisor`

**URL Params**:

| Param | Type | Description |
|---|---|---|
| `id` | integer | User ID |

**Response** `200`:
```json
{
  "message": "用户删除成功",
  "id": 1
}
```

**Error Responses**:

| Status | Condition |
|---|---|
| `400` | User has associated waste records (cannot delete) |
| `404` | User not found |

---

### PUT /api/users/:id/status

```
PUT /api/users/:id/status
```

**Auth**: `blockSupervisor`

**Request Body** (`application/json`):

| Field | Type | Required | Description |
|---|---|---|---|
| `status` | integer | ✅ | `0` = disabled, `1` = active |

**Response** `200`:
```json
{
  "message": "用户启用成功",
  "id": 1
}
```

The `message` is dynamically `"用户启用成功"` or `"用户停用成功"` based on the new status.

**Error Responses**:

| Status | Condition |
|---|---|
| `400` | Invalid status value (must be exactly `0` or `1`) |
| `404` | User not found |

---

### PUT /api/users/:id/profile

```
PUT /api/users/:id/profile
```

**Auth**: `authenticateToken` (JWT required; users can only update their own profile)

**URL Params**:

| Param | Type | Description |
|---|---|---|
| `id` | integer | User ID (must match authenticated user) |

**Request Body** (`application/json`):

| Field | Type | Required | Description |
|---|---|---|---|
| `username` | string | ✅ | New display name |
| `password` | string | ❌ | New password (applied directly without requiring old password) |

**Response** `200`:
```json
{
  "message": "个人资料更新成功",
  "id": 1
}
```

**Error Responses**:

| Status | Condition |
|---|---|
| `400` | Missing username |
| `403` | Trying to update another user's profile |
| `404` | User not found |

---

### PUT /api/users/:id/log-permission

```
PUT /api/users/:id/log-permission
```

**Auth**: `requireLogViewPermission` (JWT required + caller must have `can_view_logs = 1`; supervisors blocked)

**URL Params**:

| Param | Type | Description |
|---|---|---|
| `id` | integer | Target user ID |

**Request Body** (`application/json`):

| Field | Type | Required | Description |
|---|---|---|---|
| `can_view_logs` | integer or null | ✅ | `1` = grant log access, `null` = revoke |

**Response** `200`:
```json
{
  "message": "用户日志查看权限设置成功",
  "id": 1,
  "permission": "允许查看日志"
}
```

**Error Responses**:

| Status | Condition |
|---|---|
| `400` | Invalid permission value (must be `1` or `null`) |
| `403` | Caller is supervisor, or caller lacks `can_view_logs` permission |
| `404` | Target user not found |

---

## Unit Management

> All unit routes require `authenticateToken`.
> Write operations (POST, PUT, DELETE) additionally require `requireSuperAdmin` (`role_id` must be 3, 4, or 5).
> System Super Admin (`role_id === 5`) manages units across all companies; others are scoped to their own company.

---

### GET /api/units

```
GET /api/units
```

**Auth**: `authenticateToken` (JWT required)

**Response** `200`: Array of unit objects. System Super Admin sees all units; others see only their company's units.
```json
[
  { "id": 1, "name": "牛庄", "company_id": 1, "company_name": "示例公司" },
  { "id": 2, "name": "信远", "company_id": 1, "company_name": "示例公司" }
]
```

**Sort order**: Company name ASC → Unit name ASC

---

### GET /api/units/:id

```
GET /api/units/:id
```

**Auth**: `authenticateToken`

**URL Params**:

| Param | Type | Description |
|---|---|---|
| `id` | integer | Unit ID |

**Response** `200`: Single unit object:
```json
{ "id": 1, "name": "牛庄", "company_id": 1, "company_name": "示例公司" }
```

**Error Responses**:

| Status | Condition |
|---|---|
| `404` | Unit not found or caller lacks access to it |

---

### POST /api/units

```
POST /api/units
```

**Auth**: `authenticateToken` + `requireSuperAdmin`

**Request Body** (`application/json`):

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✅ | Unit name (unique within company) |
| `companyId` | integer | Conditional | Required for System Super Admin; others default to their own company |

**Response** `201`:
```json
{
  "message": "单位创建成功",
  "id": 12
}
```

**Error Responses**:

| Status | Condition |
|---|---|
| `400` | Missing name, unit name already exists in the company, or System Super Admin did not provide `companyId` |
| `403` | Non-system-admin attempting to create unit in another company |

---

### PUT /api/units/:id

```
PUT /api/units/:id
```

**Auth**: `authenticateToken` + `requireSuperAdmin`

**URL Params**:

| Param | Type | Description |
|---|---|---|
| `id` | integer | Unit ID |

**Request Body** (`application/json`):

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✅ | New unit name |
| `companyId` | integer | ❌ | Only System Super Admin can transfer unit to another company |

**Response** `200`:
```json
{
  "message": "单位信息更新成功",
  "id": 12
}
```

**Error Responses**:

| Status | Condition |
|---|---|
| `400` | Missing name, or name already used by another unit in the company |
| `403` | Attempting to manage or transfer unit outside own company without permission |
| `404` | Unit not found or no access |

---

### DELETE /api/units/:id

```
DELETE /api/units/:id
```

**Auth**: `authenticateToken` + `requireSuperAdmin`

**URL Params**:

| Param | Type | Description |
|---|---|---|
| `id` | integer | Unit ID |

**Response** `200`:
```json
{
  "message": "单位删除成功",
  "id": 12
}
```

**Error Responses**:

| Status | Condition |
|---|---|
| `400` | Unit has associated users or waste records (cannot delete) |
| `404` | Unit not found |

---

## Waste Type Management

> Read operations require no auth.
> Write operations (POST, PUT, DELETE) require `authenticateToken` + `requireSuperAdmin` (`role_id` must be 3, 4, or 5).

---

### GET /api/waste-types

```
GET /api/waste-types
```

**Auth**: None

**Response** `200`: Array of waste type objects, sorted by ID:
```json
[
  { "id": 1, "name": "油泥砂" },
  { "id": 2, "name": "含油包装物" },
  { "id": 3, "name": "一般固废" },
  { "id": 4, "name": "其他" }
]
```

---

### GET /api/waste-types/:id

```
GET /api/waste-types/:id
```

**Auth**: None

**URL Params**:

| Param | Type | Description |
|---|---|---|
| `id` | integer | Waste type ID |

**Response** `200`: Single waste type object.

**Error Responses**:

| Status | Condition |
|---|---|
| `404` | Waste type not found |

---

### POST /api/waste-types

```
POST /api/waste-types
```

**Auth**: `authenticateToken` + `requireSuperAdmin`

**Request Body** (`application/json`):

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✅ | Waste type name (must be unique) |

**Response** `201`:
```json
{
  "message": "废物类型创建成功",
  "id": 5
}
```

**Error Responses**:

| Status | Condition |
|---|---|
| `400` | Missing name or name already exists |

---

### PUT /api/waste-types/:id

```
PUT /api/waste-types/:id
```

**Auth**: `authenticateToken` + `requireSuperAdmin`

**URL Params**:

| Param | Type | Description |
|---|---|---|
| `id` | integer | Waste type ID |

**Request Body** (`application/json`):

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✅ | New waste type name |

**Response** `200`:
```json
{
  "message": "废物类型信息更新成功",
  "id": 5
}
```

**Error Responses**:

| Status | Condition |
|---|---|
| `400` | Missing name or name already used by another type |
| `404` | Waste type not found |

---

### DELETE /api/waste-types/:id

```
DELETE /api/waste-types/:id
```

**Auth**: `authenticateToken` + `requireSuperAdmin`

**URL Params**:

| Param | Type | Description |
|---|---|---|
| `id` | integer | Waste type ID |

**Response** `200`:
```json
{
  "message": "废物类型删除成功",
  "id": 5
}
```

**Error Responses**:

| Status | Condition |
|---|---|
| `400` | Waste type has associated waste records (cannot delete) |
| `404` | Waste type not found |

---

## Waste Record Management

---

### POST /api/waste-records

```
POST /api/waste-records
```

**Auth**: `authenticateToken` + `validateSupervisorUnitAccess`

**Content-Type**: `multipart/form-data`

**Form Fields**:

| Field | Type | Required | Description |
|---|---|---|---|
| `unitId` | integer | ✅ | Unit ID |
| `wasteTypeId` | integer | ✅ | Waste type ID |
| `location` | string | ✅ | Generation location (text description) |
| `process` | string | ✅ | Generation process |
| `collectionDate` | string | ❌ | Date portion, e.g. `"2024-01-15"` |
| `collectionTime` | string | ❌ | Time portion, e.g. `"14:30"` |
| `quantity` | number | ❌ | Collection quantity (DECIMAL 10,3) |
| `remarks` | string | ❌ | Additional notes |
| `creator_id` | integer | ❌ | Override creator (defaults to `req.user.id`) |
| `longitude` | number | ❌ | GPS longitude |
| `latitude` | number | ❌ | GPS latitude |
| `address` | string | ❌ | Full address string |
| `district` | string | ❌ | District |
| `city` | string | ❌ | City |
| `province` | string | ❌ | Province |
| `photo_before` | file(s) | ❌ | Up to 5 before-collection photos |
| `photo_after` | file(s) | ❌ | Up to 5 after-collection photos |

**Business Rules**:
- `unitId` must exist in the `units` table.
- `wasteTypeId` must exist in the `waste_types` table.
- If the creator is a Supervisor (`role_id === 4`), the record is marked `is_supervised = 1`.
- Supervisors can only create records for units belonging to their own company.

**Response** `201`:
```json
{
  "message": "废物记录添加成功",
  "id": 42
}
```

**Error Responses**:

| Status | Condition |
|---|---|
| `400` | Missing required fields, unit not found, or waste type not found |
| `403` | Supervisor attempting to create record for a unit outside their company |

---

### PUT /api/waste-records/:id

```
PUT /api/waste-records/:id
```

**Auth**: `authenticateToken`

**Content-Type**: `multipart/form-data`

**URL Params**:

| Param | Type | Description |
|---|---|---|
| `id` | integer | Record ID |

**Form Fields**:

| Field | Type | Required | Description |
|---|---|---|---|
| `unitId` | integer | ✅ | Unit ID |
| `wasteTypeId` | integer | ✅ | Waste type ID |
| `location` | string | ✅ | Generation location |
| `process` | string | ✅ | Generation process |
| `collectionDate` | string | ✅ | Date portion |
| `collectionTime` | string | ✅ | Time portion |
| `quantity` | number | ❌ | Collection quantity |
| `remarks` | string | ❌ | Notes |
| `photo_path_before` | string | ❌ | Send `"NULL"` to clear all before-photos |
| `photo_path_after` | string | ❌ | Send `"NULL"` to clear all after-photos |
| `photos_to_remove_before` | string | ❌ | JSON array string of specific before-photo paths to delete |
| `photos_to_remove_after` | string | ❌ | JSON array string of specific after-photo paths to delete |
| `photo_before` | file(s) | ❌ | New before-collection photos (up to 5) |
| `photo_after` | file(s) | ❌ | New after-collection photos (up to 5) |
| `longitude` | number | ❌ | GPS longitude |
| `latitude` | number | ❌ | GPS latitude |
| `address` | string | ❌ | Full address string |
| `district` | string | ❌ | District |
| `city` | string | ❌ | City |
| `province` | string | ❌ | Province |
| `companyId` | integer | ❌ | System Super Admin only: transfer record to another company |

**Photo Update Logic**:
1. Photos listed in `photos_to_remove_before`/`photos_to_remove_after` are deleted from disk and removed from the record.
2. New uploads in `photo_before`/`photo_after` are appended to the remaining photos.
3. Sending `"NULL"` in `photo_path_before`/`photo_path_after` clears all photos and deletes files.

**Response** `200`:
```json
{
  "message": "废物记录更新成功",
  "id": 42
}
```

**Error Responses**:

| Status | Condition |
|---|---|
| `404` | Record not found |

---

### DELETE /api/waste-records/:id

```
DELETE /api/waste-records/:id
```

**Auth**: `authenticateToken` (JWT required)

**URL Params**:

| Param | Type | Description |
|---|---|---|
| `id` | integer | Record ID |

**Behavior**:
- Deletes associated photo files from disk (both before and after photos).
- Deletes the database record.

**Response** `200`:
```json
{
  "message": "废物记录删除成功",
  "id": 42
}
```

**Error Responses**:

| Status | Condition |
|---|---|
| `404` | Record not found |

---

### GET /api/waste-records

```
GET /api/waste-records
```

**Auth**: None

> **Note**: This route has no authentication middleware. `req.user` is always `null`, so no company-based filtering is applied — **all records across all companies are returned**. This endpoint is intended for internal/admin use.

**Response** `200`: Array of all waste record objects including joins (unit name, waste type name, creator name, company name).

**Sort order**: `created_at DESC`

---

### GET /api/waste-records/:unitId

```
GET /api/waste-records/:unitId
```

**Auth**: None (uses JWT if present); `validateSupervisorUnitAccess` is applied.

**URL Params**:

| Param | Type | Description |
|---|---|---|
| `unitId` | integer | Unit ID |

**Filtering by role**:
- **System Super Admin** (`role_id === 5`): sees all records for the unit including supervised entries.
- **Company Super Admin** (`role_id === 3`): sees all records for the unit including supervised entries, scoped to own company.
- **All other roles**: supervised records (`is_supervised = 1`) are excluded.
- Non-system-admin users: additionally scoped to own company.

**Response** `200`: Array of waste record objects.

**Sort order**: `created_at DESC`

---

### GET /api/waste-records/detail/:id

```
GET /api/waste-records/detail/:id
```

**Auth**: None

**URL Params**:

| Param | Type | Description |
|---|---|---|
| `id` | integer | Record ID |

**Response** `200`: Single waste record object with all join fields.

**Error Responses**:

| Status | Condition |
|---|---|
| `404` | Record not found |

---

### GET /api/waste-records/user/:userId

```
GET /api/waste-records/user/:userId
```

**Auth**: None (reads user from DB using `userId` param for role-based filtering)

**URL Params**:

| Param | Type | Description |
|---|---|---|
| `userId` | integer | User ID (used to determine role and permissions) |

**Query Params**:

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | integer | `1` | Page number |
| `pageSize` | integer | `20` | Records per page |
| `wasteTypeId` | integer | — | Filter by waste type |
| `minQuantity` | number | — | Minimum quantity filter |
| `maxQuantity` | number | — | Maximum quantity filter |
| `location` | string | — | Location substring search |
| `dateRange` | string | — | JSON array `["2024-01-01","2024-12-31"]` for date range filter on `collection_start_time` |
| `process` | string | — | Process substring search |
| `showSupervised` | string | — | `"false"` hides supervised records (Company Super Admin only) |
| `unitId` | integer | — | Filter by unit (Company Super Admin and Supervisor only) |

**Role-Based Filtering**:

| Role | Behavior |
|---|---|
| **System Super Admin** (`5`) | Sees all records across all companies. |
| **Company Super Admin** (`3`) | Sees all records for own company. If `showSupervised=false`, supervised records are hidden. Can filter by `unitId`. |
| **Supervisor** (`4`) | Sees only their own records (`creator_id = userId`) within own company. Can filter by `unitId`. |
| **Unit Admin** (`2`) | Sees only their unit's records within own company. Supervised records are always hidden. |
| **Basic Employee** (`1`) | Sees only their own records from the past 48 hours within own company. |

**Response** `200`:
```json
{
  "records": [ /* array of waste record objects */ ],
  "hasMore": true,
  "total": 150
}
```

**Error Responses**:

| Status | Condition |
|---|---|
| `404` | User not found |

---

### GET /api/waste-records/export/user/:userId

```
GET /api/waste-records/export/user/:userId
```

**Auth**: None

**URL Params & Query Params**: Same as [GET /api/waste-records/user/:userId](#get-apiwaste-recordsuseruserid), except without `page` and `pageSize` (returns all matching records).

**Additional Query Param**:

| Param | Type | Description |
|---|---|---|
| `exportType` | string | `"no_images"`, `"first_image"`, or `"all_images"` (logged for audit purposes only; does not affect response) |

**Role-Based Filtering**: Same rules as GET /api/waste-records/user/:userId.

**Response** `200`: Array of all matching waste record objects (no pagination).

**Error Responses**:

| Status | Condition |
|---|---|
| `404` | User not found |

---

## Company Management

> All company routes require `authenticateToken`.
> Most write operations require System Super Admin (`role_id === 5`).

---

### GET /api/companies

```
GET /api/companies
```

**Auth**: `authenticateToken`

**Permissions**: System Super Admin only.

**Response** `200`: Array of active company objects sorted by name:
```json
[
  {
    "id": 1,
    "name": "示例公司",
    "code": "EXAMPLE",
    "status": 1
  }
]
```

**Error Responses**:

| Status | Condition |
|---|---|
| `403` | Caller is not System Super Admin |

---

### GET /api/companies/:id

```
GET /api/companies/:id
```

**Auth**: `authenticateToken`

**URL Params**:

| Param | Type | Description |
|---|---|---|
| `id` | integer | Company ID |

**Permissions**: System Super Admin can view any company; others can only view their own company.

**Response** `200`: Single company object.

**Error Responses**:

| Status | Condition |
|---|---|
| `403` | Attempting to view another company without System Super Admin role |
| `404` | Company not found |

---

### GET /api/companies/:id/stats

```
GET /api/companies/:id/stats
```

**Auth**: `authenticateToken`

**URL Params**:

| Param | Type | Description |
|---|---|---|
| `id` | integer | Company ID |

**Permissions**: System Super Admin can view any company's stats; others can only view their own company's stats.

**Response** `200`:
```json
{
  "company": { "id": 1, "name": "示例公司", "code": "EXAMPLE", "status": 1 },
  "stats": {
    "units": 11,
    "users": 45,
    "records": 320
  }
}
```

**Error Responses**:

| Status | Condition |
|---|---|
| `403` | Attempting to view another company's stats without permission |
| `404` | Company not found |

---

### POST /api/companies

```
POST /api/companies
```

**Auth**: `authenticateToken`

**Permissions**: System Super Admin only.

**Request Body** (`application/json`):

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✅ | Company name (must be unique) |
| `code` | string | ❌ | Company code (must be unique if provided) |

**Response** `201`: Newly created company object:
```json
{
  "id": 2,
  "name": "新公司",
  "code": "NEWCO",
  "status": 1
}
```

**Error Responses**:

| Status | Condition |
|---|---|
| `400` | Missing name, name already exists, or code already exists |
| `403` | Caller is not System Super Admin |

---

### PUT /api/companies/:id

```
PUT /api/companies/:id
```

**Auth**: `authenticateToken`

**Permissions**: System Super Admin only.

**URL Params**:

| Param | Type | Description |
|---|---|---|
| `id` | integer | Company ID |

**Request Body** (`application/json`):

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✅ | Company name |
| `code` | string | ❌ | Company code |
| `status` | integer | ❌ | `0` = disabled, `1` = active |

**Response** `200`: Updated company object.

**Error Responses**:

| Status | Condition |
|---|---|
| `400` | Missing name, name already exists, or code already exists |
| `403` | Caller is not System Super Admin |
| `404` | Company not found |

---

### DELETE /api/companies/:id

```
DELETE /api/companies/:id
```

**Auth**: `authenticateToken`

**Permissions**: System Super Admin only.

> **Note**: This is a **soft delete** — sets `status = 0`, does not remove the row.

**URL Params**:

| Param | Type | Description |
|---|---|---|
| `id` | integer | Company ID |

**Response** `200`:
```json
{ "message": "公司删除成功" }
```

**Error Responses**:

| Status | Condition |
|---|---|
| `400` | Company has related users, units, or records (cannot delete) |
| `403` | Caller is not System Super Admin |
| `404` | Company not found |

---

## Feedback

> All feedback routes require `authenticateToken`.

---

### POST /api/feedback

```
POST /api/feedback
```

**Auth**: `authenticateToken`

**Request Body** (`application/json`):

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | ✅ | Feedback title |
| `description` | string | ✅ | Detailed description |
| `type` | string | ❌ | `"bug"`, `"feature"`, `"improvement"`, `"other"` (default: `"bug"`) |
| `priority` | string | ❌ | `"low"`, `"medium"`, `"high"` (default: `"medium"`) |

**Response** `200`:
```json
{
  "success": true,
  "message": "问题反馈提交成功",
  "data": { "id": 10 }
}
```

**Error Responses**:

| Status | Condition |
|---|---|
| `400` | Missing title or description |

---

### GET /api/feedback/user

```
GET /api/feedback/user
```

**Auth**: `authenticateToken`

Returns the authenticated user's own feedback items, sorted by `created_at DESC`.

**Response** `200`:
```json
{
  "success": true,
  "data": [ /* array of feedback objects */ ]
}
```

---

### GET /api/feedback/admin

```
GET /api/feedback/admin
```

**Auth**: `authenticateToken`

**Permissions**: Company Super Admin (`role_id === 3`) or System Super Admin (`role_id === 5`) only.

**Query Params**:

| Param | Type | Description |
|---|---|---|
| `status` | string | Filter by status: `pending`, `processing`, `resolved`, `closed` |
| `type` | string | Filter by type: `bug`, `feature`, `improvement`, `other` |
| `company_id` | integer | Filter by company (System Super Admin only) |

**Response** `200`:
```json
{
  "success": true,
  "data": [ /* array of feedback objects with company and admin info */ ]
}
```

**Error Responses**:

| Status | Condition |
|---|---|
| `403` | Insufficient permissions |

---

### GET /api/feedback/stats

```
GET /api/feedback/stats
```

**Auth**: `authenticateToken`

**Permissions**: Company Super Admin (`role_id === 3`) or System Super Admin (`role_id === 5`) only.

**Query Params**:

| Param | Type | Description |
|---|---|---|
| `company_id` | integer | Filter by company (System Super Admin only) |

**Response** `200`:
```json
{
  "success": true,
  "data": {
    "total": 50,
    "pending": 10,
    "processing": 5,
    "resolved": 30,
    "closed": 5,
    "bugs": 25,
    "features": 15,
    "improvements": 8,
    "others": 2
  }
}
```

**Error Responses**:

| Status | Condition |
|---|---|
| `403` | Insufficient permissions |

---

### GET /api/feedback/:id

```
GET /api/feedback/:id
```

**Auth**: `authenticateToken`

**URL Params**:

| Param | Type | Description |
|---|---|---|
| `id` | integer | Feedback ID |

**Permissions**:
- Basic Employee / Unit Admin: can only view their own feedback.
- Company Super Admin: can view feedback from their company.
- System Super Admin: can view all feedback.

**Response** `200`:
```json
{
  "success": true,
  "data": { /* feedback object */ }
}
```

**Error Responses**:

| Status | Condition |
|---|---|
| `403` | Attempting to view another user's feedback without permission |
| `404` | Feedback not found |

---

### PUT /api/feedback/:id/status

```
PUT /api/feedback/:id/status
```

**Auth**: `authenticateToken`

**Permissions**: Company Super Admin (`role_id === 3`) or System Super Admin (`role_id === 5`) only.

**URL Params**:

| Param | Type | Description |
|---|---|---|
| `id` | integer | Feedback ID |

**Request Body** (`application/json`):

| Field | Type | Required | Description |
|---|---|---|---|
| `status` | string | ✅ | `"pending"`, `"processing"`, `"resolved"`, or `"closed"` |
| `admin_reply` | string | ❌ | Admin reply message |

**Response** `200`:
```json
{
  "success": true,
  "message": "状态更新成功"
}
```

**Error Responses**:

| Status | Condition |
|---|---|
| `400` | Invalid status value or update failed |
| `403` | Insufficient permissions, or Company Super Admin attempting to update another company's feedback |
| `404` | Feedback not found |

---

### DELETE /api/feedback/:id

```
DELETE /api/feedback/:id
```

**Auth**: `authenticateToken`

**Permissions**:
- Basic Employee / Unit Admin: can only delete their own feedback.
- Company Super Admin: can delete feedback from their company.
- System Super Admin: can delete any feedback.

**URL Params**:

| Param | Type | Description |
|---|---|---|
| `id` | integer | Feedback ID |

**Response** `200`:
```json
{
  "success": true,
  "message": "删除成功"
}
```

**Error Responses**:

| Status | Condition |
|---|---|
| `400` | Delete failed |
| `403` | Attempting to delete another user's feedback without permission |
| `404` | Feedback not found |

---

## Operation Logs

> All operation log routes require `authenticateToken`.
> Additionally, the authenticated user must have `can_view_logs = 1` in the database. This flag is set via [PUT /api/users/:id/log-permission](#put-apiusersidlog-permission).

---

### GET /api/operation-logs

```
GET /api/operation-logs
```

**Auth**: `authenticateToken` + `can_view_logs` permission

**Query Params**:

| Param | Type | Description |
|---|---|---|
| `page` | integer | Page number (default: `1`) |
| `pageSize` | integer | Records per page (default: `20`) |
| `operationType` | string | Filter by operation type (e.g. `"create"`, `"update"`, `"delete"`) |
| `targetType` | string | Filter by target type (e.g. `"waste_record"`, `"user"`) |
| `userId` | integer | Filter by operator user ID |
| `userKeyword` | string | Search by username or phone |
| `startDate` | string | Start date filter (`YYYY-MM-DD`) |
| `endDate` | string | End date filter (`YYYY-MM-DD`) |
| `description` | string | Keyword search in log description |

**Response** `200`:
```json
{
  "logs": [ /* array of log objects */ ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 500,
    "totalPages": 25,
    "hasMore": true
  }
}
```

**Error Responses**:

| Status | Condition |
|---|---|
| `403` | User lacks `can_view_logs` permission |

---

### GET /api/operation-logs/stats

```
GET /api/operation-logs/stats
```

**Auth**: `authenticateToken` + `can_view_logs` permission

**Query Params**:

| Param | Type | Description |
|---|---|---|
| `startDate` | string | Start date filter (`YYYY-MM-DD`) |
| `endDate` | string | End date filter (`YYYY-MM-DD`) |

**Response** `200`:
```json
{
  "totalStats": [ /* operation type counts */ ],
  "dailyStats": [ /* daily breakdown */ ]
}
```

**Error Responses**:

| Status | Condition |
|---|---|
| `403` | User lacks `can_view_logs` permission |

---

### GET /api/operation-logs/user-stats

```
GET /api/operation-logs/user-stats
```

**Auth**: `authenticateToken` + `can_view_logs` permission

**Query Params**:

| Param | Type | Default | Description |
|---|---|---|---|
| `startDate` | string | — | Start date filter (`YYYY-MM-DD`) |
| `endDate` | string | — | End date filter (`YYYY-MM-DD`) |
| `limit` | integer | `10` | Max number of users to return |

**Response** `200`: Array of per-user operation count statistics.

**Error Responses**:

| Status | Condition |
|---|---|
| `403` | User lacks `can_view_logs` permission |

---

### GET /api/operation-logs/export

```
GET /api/operation-logs/export
```

**Auth**: `authenticateToken` + `can_view_logs` permission

**Query Params**: Same as [GET /api/operation-logs](#get-apioperation-logs), excluding `page` and `pageSize` (returns all matching records).

**Response** `200`: Array of all matching log objects.

**Error Responses**:

| Status | Condition |
|---|---|
| `403` | User lacks `can_view_logs` permission |

---

## Role System

| Role ID | Name | Key Permissions |
|---|---|---|
| `1` | 基层员工 (Basic Employee) | Submit waste records for their unit. View only their own records from the past 48 hours. |
| `2` | 单位管理员 (Unit Admin) | View and manage waste records for their unit. Supervised records are hidden. Access user management. |
| `3` | 超级管理员 (Company Super Admin) | Full access to all data within their company. Can see supervised records. Can toggle supervised data visibility. Access user management. Can manage feedback and view admin feedback stats. |
| `4` | 监督人员 (Supervisor) | Submit waste records (marked as `is_supervised = 1`). View only their own submitted records. **Blocked from user management endpoints.** Can create/update waste types and units. |
| `5` | 系统超级管理员 (System Super Admin) | Cross-company access to all data. Can manage companies, transfer users/units/records between companies. Full access to all endpoints. |

---

## File Upload

- **Engine**: `multer` with disk storage
- **Directory**: `../uploads/` relative to the backend directory
- **Static serving**: `GET /uploads/<filename>`
- **Max file size**: 10 MB per file
- **Max files per field**: 5 (for both `photo_before` and `photo_after`)
- **Accepted MIME types**: `image/jpeg`, `image/jpg`, `image/png`, `image/gif`, `image/bmp`, `image/webp`
- **Filename format**: `<fieldname>-<timestamp>-<random>.<ext>`
- Photos are stored as JSON arrays of path strings in the database (e.g., `["/uploads/photo_before-123456.jpg"]`)

---

## Error Handling

### Standard Error Response Format

Most endpoints return:
```json
{ "error": "Error message in Chinese" }
```

Feedback endpoints use a different format:
```json
{ "success": false, "message": "Error message in Chinese" }
```

### Multer Error Handling

| Status | Condition |
|---|---|
| `413` | File size exceeds 10 MB limit |
| `400` | Other multer upload errors |
| `500` | Non-multer errors |

### Common HTTP Status Codes

| Status | Meaning |
|---|---|
| `400` | Bad Request — validation failure, missing required fields |
| `401` | Unauthorized — missing or invalid JWT token |
| `403` | Forbidden — insufficient permissions |
| `404` | Not Found — resource does not exist |
| `500` | Internal Server Error |

---

## Static File Serving

| Path | Serves |
|---|---|
| `/uploads/*` | Uploaded photo files (cached 1 day) |
| `/*` (non-API, non-uploads) | `frontend/dist/index.html` (SPA fallback) |
