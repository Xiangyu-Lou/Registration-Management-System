-- 创建用户角色表
CREATE TABLE IF NOT EXISTS user_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

-- 创建单位表
CREATE TABLE IF NOT EXISTS units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT,
  phone TEXT NOT NULL UNIQUE,
  password TEXT,
  role_id INTEGER NOT NULL,
  unit_id INTEGER,
  created_at TEXT NOT NULL,
  FOREIGN KEY (role_id) REFERENCES user_roles (id),
  FOREIGN KEY (unit_id) REFERENCES units (id)
);

-- 创建危险废物类型表
CREATE TABLE IF NOT EXISTS waste_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

-- 创建废物记录表
CREATE TABLE IF NOT EXISTS waste_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  unit_id INTEGER NOT NULL,
  waste_type_id INTEGER NOT NULL,
  location TEXT NOT NULL,
  collection_start_time TEXT NOT NULL,
  photo_path TEXT,
  quantity REAL NOT NULL,
  created_at TEXT NOT NULL,
  creator_id INTEGER,
  FOREIGN KEY (unit_id) REFERENCES units (id),
  FOREIGN KEY (waste_type_id) REFERENCES waste_types (id),
  FOREIGN KEY (creator_id) REFERENCES users (id)
);

-- 插入用户角色
INSERT INTO user_roles (name) VALUES ('员工'); -- id: 1
INSERT INTO user_roles (name) VALUES ('单位管理员'); -- id: 2
INSERT INTO user_roles (name) VALUES ('超级管理员'); -- id: 3

-- 插入单位数据
INSERT INTO units (name) VALUES ('牛庄');
INSERT INTO units (name) VALUES ('信远');
INSERT INTO units (name) VALUES ('潍北');
INSERT INTO units (name) VALUES ('金角');
INSERT INTO units (name) VALUES ('河口');
INSERT INTO units (name) VALUES ('无棣');
INSERT INTO units (name) VALUES ('高青');
INSERT INTO units (name) VALUES ('滨博');
INSERT INTO units (name) VALUES ('桓台');
INSERT INTO units (name) VALUES ('胜兴');

-- 插入危险废物类型
INSERT INTO waste_types (name) VALUES ('油泥沙');
INSERT INTO waste_types (name) VALUES ('含油包装物');
INSERT INTO waste_types (name) VALUES ('其他');

-- 插入测试用户
-- 超级管理员 (账号: admin, 密码: admin123)
INSERT INTO users (username, phone, password, role_id, created_at) VALUES ('admin', '13800000000', 'admin123', 3, datetime('now'));

-- 为每个单位添加一个员工和一个管理员
-- 牛庄员工
INSERT INTO users (username, phone, password, role_id, unit_id, created_at) VALUES ('牛庄员工', '13500000001', NULL, 1, 1, datetime('now'));
-- 牛庄管理员
INSERT INTO users (username, phone, password, role_id, unit_id, created_at) VALUES ('牛庄管理员', '13600000001', 'niuzhuang123', 2, 1, datetime('now'));

-- 信远员工
INSERT INTO users (username, phone, password, role_id, unit_id, created_at) VALUES ('信远员工', '13500000002', NULL, 1, 2, datetime('now'));
-- 信远管理员
INSERT INTO users (username, phone, password, role_id, unit_id, created_at) VALUES ('信远管理员', '13600000002', 'xinyuan123', 2, 2, datetime('now'));

-- 潍北员工
INSERT INTO users (username, phone, password, role_id, unit_id, created_at) VALUES ('潍北员工', '13500000003', NULL, 1, 3, datetime('now'));
-- 潍北管理员
INSERT INTO users (username, phone, password, role_id, unit_id, created_at) VALUES ('潍北管理员', '13600000003', 'weibei123', 2, 3, datetime('now'));

-- 金角员工
INSERT INTO users (username, phone, password, role_id, unit_id, created_at) VALUES ('金角员工', '13500000004', NULL, 1, 4, datetime('now'));
-- 金角管理员
INSERT INTO users (username, phone, password, role_id, unit_id, created_at) VALUES ('金角管理员', '13600000004', 'jinjiao123', 2, 4, datetime('now'));

-- 河口员工
INSERT INTO users (username, phone, password, role_id, unit_id, created_at) VALUES ('河口员工', '13500000005', NULL, 1, 5, datetime('now'));
-- 河口管理员
INSERT INTO users (username, phone, password, role_id, unit_id, created_at) VALUES ('河口管理员', '13600000005', 'hekou123', 2, 5, datetime('now'));

-- 无棣员工
INSERT INTO users (username, phone, password, role_id, unit_id, created_at) VALUES ('无棣员工', '13500000006', NULL, 1, 6, datetime('now'));
-- 无棣管理员
INSERT INTO users (username, phone, password, role_id, unit_id, created_at) VALUES ('无棣管理员', '13600000006', 'wudi123', 2, 6, datetime('now'));

-- 高青员工
INSERT INTO users (username, phone, password, role_id, unit_id, created_at) VALUES ('高青员工', '13500000007', NULL, 1, 7, datetime('now'));
-- 高青管理员
INSERT INTO users (username, phone, password, role_id, unit_id, created_at) VALUES ('高青管理员', '13600000007', 'gaoqing123', 2, 7, datetime('now'));

-- 滨博员工
INSERT INTO users (username, phone, password, role_id, unit_id, created_at) VALUES ('滨博员工', '13500000008', NULL, 1, 8, datetime('now'));
-- 滨博管理员
INSERT INTO users (username, phone, password, role_id, unit_id, created_at) VALUES ('滨博管理员', '13600000008', 'binbo123', 2, 8, datetime('now'));

-- 桓台员工
INSERT INTO users (username, phone, password, role_id, unit_id, created_at) VALUES ('桓台员工', '13500000009', NULL, 1, 9, datetime('now'));
-- 桓台管理员
INSERT INTO users (username, phone, password, role_id, unit_id, created_at) VALUES ('桓台管理员', '13600000009', 'huantai123', 2, 9, datetime('now'));

-- 胜兴员工
INSERT INTO users (username, phone, password, role_id, unit_id, created_at) VALUES ('胜兴员工', '13500000010', NULL, 1, 10, datetime('now'));
-- 胜兴管理员
INSERT INTO users (username, phone, password, role_id, unit_id, created_at) VALUES ('胜兴管理员', '13600000010', 'shengxing123', 2, 10, datetime('now'));
