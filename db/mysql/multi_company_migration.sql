-- 多公司架构数据库迁移SQL
-- 执行前请确保已备份数据库！

-- 1. 创建公司表
CREATE TABLE IF NOT EXISTS companies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL UNIQUE,
  code VARCHAR(50) UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TINYINT DEFAULT 1 COMMENT '公司状态：0-停用，1-正常'
);

-- 2. 新增系统超级管理员角色并更新原有角色名称
INSERT INTO user_roles (id, name) VALUES (5, '系统超级管理员') 
ON DUPLICATE KEY UPDATE name = '系统超级管理员';

-- 更新原来的"超级管理员"角色为"公司管理员"
UPDATE user_roles SET name = '公司管理员' WHERE id = 3;

-- 3. 插入两个公司
INSERT INTO companies (name, code) VALUES 
('东胜', 'DONGSHENG'),
('石油开发', 'PETROLEUM_DEV');

-- 4. 为units表添加company_id字段
ALTER TABLE units ADD COLUMN company_id INT;

-- 5. 为users表添加company_id字段  
ALTER TABLE users ADD COLUMN company_id INT;

-- 6. 为waste_records表添加company_id字段
ALTER TABLE waste_records ADD COLUMN company_id INT;

-- 7. 为operation_logs表添加company_id字段
ALTER TABLE operation_logs ADD COLUMN company_id INT;

-- 8. 将现有数据分配给"东胜"公司（假设东胜公司ID为1）
UPDATE units SET company_id = 1;
UPDATE users SET company_id = 1;
UPDATE waste_records SET company_id = 1;
UPDATE operation_logs SET company_id = 1;

-- 9. 将company_id字段设为NOT NULL（除了operation_logs可以为空）
ALTER TABLE units MODIFY company_id INT NOT NULL;
ALTER TABLE users MODIFY company_id INT NOT NULL;
ALTER TABLE waste_records MODIFY company_id INT NOT NULL;

-- 10. 添加外键约束
ALTER TABLE units ADD FOREIGN KEY (company_id) REFERENCES companies(id);
ALTER TABLE users ADD FOREIGN KEY (company_id) REFERENCES companies(id);
ALTER TABLE waste_records ADD FOREIGN KEY (company_id) REFERENCES companies(id);
ALTER TABLE operation_logs ADD FOREIGN KEY (company_id) REFERENCES companies(id);

-- 11. 添加索引以提高查询性能
ALTER TABLE units ADD INDEX idx_company_id (company_id);
ALTER TABLE users ADD INDEX idx_company_id (company_id);
ALTER TABLE waste_records ADD INDEX idx_company_id (company_id);
ALTER TABLE operation_logs ADD INDEX idx_company_id (company_id);

-- 12. 创建一个系统超级管理员用户（可以查看所有公司）
-- 注意：这里的company_id设为1（东胜），但角色是系统超级管理员，可以跨公司查看
-- 密码为 "1" 的bcrypt加密值
INSERT INTO users (username, phone, password, role_id, unit_id, company_id, can_view_logs) 
VALUES ('系统超级管理员', '13900000000', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 5, NULL, 1, 1)
ON DUPLICATE KEY UPDATE 
username = '系统超级管理员', 
role_id = 5, 
can_view_logs = 1;

-- 13. 更新现有超级管理员用户的角色为公司管理员（保持原有role_id=3不变）
-- 只需要确保角色名称已经在步骤2中更新为"公司管理员"
-- 这里不需要更新用户表，因为role_id=3现在对应的就是"公司管理员"角色

-- 验证查询（执行完后可以运行这些查询检查结果）
-- SELECT * FROM companies;
-- SELECT COUNT(*) as units_count, company_id FROM units GROUP BY company_id;
-- SELECT COUNT(*) as users_count, company_id FROM users GROUP BY company_id;
-- SELECT COUNT(*) as records_count, company_id FROM waste_records GROUP BY company_id;
-- SELECT username, phone, role_id, company_id FROM users WHERE role_id IN (3, 5); 

-- 创建问题反馈表
CREATE TABLE IF NOT EXISTS feedback (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  company_id INT NOT NULL,
  title VARCHAR(255) NOT NULL COMMENT '问题标题',
  description TEXT NOT NULL COMMENT '问题描述',
  type ENUM('bug', 'feature', 'improvement', 'other') NOT NULL DEFAULT 'bug' COMMENT '问题类型',
  priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium' COMMENT '优先级',
  status ENUM('pending', 'processing', 'resolved', 'closed') NOT NULL DEFAULT 'pending' COMMENT '处理状态',
  images VARCHAR(1000) COMMENT '附件图片路径，多个用逗号分隔',
  admin_reply TEXT COMMENT '管理员回复',
  admin_id INT COMMENT '处理管理员ID',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_company_id (company_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (admin_id) REFERENCES users(id)
);