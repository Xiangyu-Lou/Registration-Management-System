# 多公司架构数据库迁移指南

## ⚠️ 重要提醒
- **执行前务必备份数据库！**
- **请在测试环境先验证所有SQL语句！**
- **逐条执行SQL，每条执行后检查结果！**

## 📋 迁移步骤

### 1. 备份数据库
```bash
mysqldump -u username -p waste_management > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. 执行迁移SQL
按顺序执行 `multi_company_migration.sql` 中的SQL语句

### 3. 验证迁移结果
执行文件末尾的验证查询：
```sql
SELECT * FROM companies;
SELECT COUNT(*) as units_count, company_id FROM units GROUP BY company_id;
SELECT COUNT(*) as users_count, company_id FROM users GROUP BY company_id;
SELECT COUNT(*) as records_count, company_id FROM waste_records GROUP BY company_id;
SELECT username, phone, role_id, company_id FROM users WHERE role_id IN (3, 5);
```

## 🎯 迁移后的变化

### 新增内容：
- **companies表**: 存储公司信息
- **系统超级管理员角色**: role_id=5，可查看所有公司
- **新的系统管理员账户**: 手机号 13900000000，密码 1

### 修改内容：
- **所有现有数据**: 划分到"东胜"公司 (company_id=1)
- **原超级管理员角色**: 改名为"公司管理员"
- **所有表**: 新增company_id字段和相关索引

### 测试账户更新：
```
基层员工: 13800000001 / 密码: 1 (东胜公司)
单位管理员: 13800000002 / 密码: 1 (东胜公司)  
公司管理员: 13800000003 / 密码: 1 (东胜公司)
监督人员: 13800000004 / 密码: 1 (东胜公司)
系统超级管理员: 13900000000 / 密码: 1 (可管理所有公司)
```

## 🔍 故障排查

如果迁移过程中遇到问题：

1. **外键约束错误**: 检查相关表是否存在，数据是否完整
2. **唯一约束错误**: 检查是否有重复数据
3. **字段不存在错误**: 确认前面的ALTER语句已成功执行

## 🚀 迁移完成后

1. 重启后端服务
2. 使用新的系统超级管理员账户测试登录
3. 验证数据查询和权限控制是否正常 