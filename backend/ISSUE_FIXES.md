# 问题修复记录

## 2025-01-XX 修复记录

### 1. 照片上传逻辑修复

**问题描述：** 
记录编辑功能中，上传新照片时会删除旧照片，但用户期望的是增加照片而不是替换。

**解决方案：**
1. 在 `backend/utils/fileUtils.js` 中添加了 `mergePhotoFiles` 函数用于合并旧照片和新照片
2. 在 `backend/utils/fileUtils.js` 中添加了 `removeSpecificPhotoFiles` 函数用于删除指定照片
3. 修改了 `backend/controllers/wasteRecordController.js` 中的 `updateWasteRecord` 方法：
   - 支持通过 `photos_to_remove_before` 和 `photos_to_remove_after` 参数删除指定照片
   - 新上传的照片会与现有照片合并，而不是替换
   - 保留了清空照片的功能（通过 `photo_path_before: 'NULL'`）

**功能特性：**
- ✅ 新增照片：上传新照片时会添加到现有照片列表中
- ✅ 删除指定照片：可以通过参数删除特定的照片文件
- ✅ 清空所有照片：通过传递 'NULL' 值可以清空所有照片
- ✅ 向后兼容：保持与现有接口的兼容性

### 2. 用户密码更新错误修复

**问题描述：**
用户在账户设置中更改密码时后端报错：`Error: data and hash arguments required`

**根因分析：**
- `User.findById()` 方法没有返回密码字段
- `comparePassword()` 函数接收到 `undefined` 的密码哈希值

**解决方案：**
1. 在 `backend/models/User.js` 中添加了 `findByIdWithPassword` 方法，专门用于需要密码验证的场景
2. 在 `backend/models/User.js` 中添加了 `findByPhoneForAuth` 方法，用于登录时获取完整用户信息
3. 修改了 `backend/controllers/userController.js` 中的 `updateUserProfile` 方法：
   - 使用 `User.findByIdWithPassword()` 获取包含密码的用户信息
   - 添加了对空密码的检查和处理
4. 修改了 `backend/controllers/authController.js` 中的 `login` 方法：
   - 使用 `User.findByPhoneForAuth()` 获取包含角色和单位信息的用户数据

### 3. 删除记录权限问题修复

**问题描述：**
超级管理员尝试删除记录时出现 401 未授权错误。

**根因分析：**
- 前端删除请求使用了原生的 `axios.delete()` 而不是 `httpService.delete()`
- 原生 axios 请求没有自动添加认证头

**解决方案：**
1. 在 `frontend/src/views/AdminRecords.vue` 中添加了 `httpService` 导入
2. 修改了所有需要认证的请求：
   - 删除记录：`axios.delete()` → `httpService.delete()`
   - 获取用户记录：`axios.get()` → `httpService.get()`
   - 导出记录：所有导出相关的 `axios.get()` → `httpService.get()`

**验证结果：**
- ✅ 超级管理员可以正常删除记录
- ✅ 所有需要认证的请求都能正确携带 JWT token
- ✅ 保持了获取公共数据（如单位列表、废物类型）的现有逻辑

### 4. 代码质量改进

**改进内容：**
1. 统一了认证请求的处理方式
2. 提高了照片管理的灵活性
3. 增强了错误处理的健壮性
4. 保持了向后兼容性

**最佳实践：**
- 所有需要认证的前端请求都应使用 `httpService` 而不是原生 `axios`
- 敏感数据（如密码）的查询应使用专门的方法
- 文件操作应支持合并和删除等多种模式 