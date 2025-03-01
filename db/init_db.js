const path = require('path');
const fs = require('fs');

// 检查命令行参数中是否有 --use-sqlite3 标志
const useSqlite3 = process.argv.includes('--use-sqlite3');

// 根据系统命令行工具 sqlite3 来创建和初始化数据库
// 这避免了对 Node.js sqlite 模块的依赖
const { execSync } = require('child_process');
const dbPath = path.join(__dirname, 'waste_management.db');

// 如果数据库文件已存在，则删除它以确保干净的初始化
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('已删除现有数据库文件');
}

// 创建 SQL 脚本
const sqlScriptPath = path.join(__dirname, 'init_script.sql');

// 写入 SQL 脚本内容
const sqlScript = `
-- 创建单位表
CREATE TABLE IF NOT EXISTS units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
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
  FOREIGN KEY (unit_id) REFERENCES units (id),
  FOREIGN KEY (waste_type_id) REFERENCES waste_types (id)
);

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

-- 插入废物类型
INSERT INTO waste_types (name) VALUES ('油泥沙');
INSERT INTO waste_types (name) VALUES ('含油包装物');
INSERT INTO waste_types (name) VALUES ('其他');
`;

fs.writeFileSync(sqlScriptPath, sqlScript);
console.log('已创建 SQL 初始化脚本');

try {
  // 使用 SQLite 命令行工具执行脚本
  execSync(`sqlite3 "${dbPath}" < "${sqlScriptPath}"`, { stdio: 'inherit' });
  console.log('数据库初始化成功');
  
  // 删除临时脚本文件
  fs.unlinkSync(sqlScriptPath);
  console.log('已清理临时文件');
} catch (error) {
  console.error('数据库初始化失败:', error.message);
  console.log('请确保 SQLite 命令行工具已安装并在系统路径中可用');
  process.exit(1);
}
