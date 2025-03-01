const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// 配置路径
const dbPath = path.join(__dirname, 'waste_management.db');
const sqlPath = path.join(__dirname, 'init.sql');

// 删除现有数据库
if (fs.existsSync(dbPath)) {
  console.log('删除现有数据库文件...');
  fs.unlinkSync(dbPath);
}

console.log('初始化数据库...');

try {
  // 使用子进程调用 sqlite3 命令行工具
  execSync(`sqlite3 "${dbPath}" < "${sqlPath}"`, { 
    stdio: 'inherit',
    windowsVerbatimArguments: true
  });
  
  console.log('数据库初始化成功！');
  console.log(`数据库路径: ${dbPath}`);
  
  // 验证数据库
  const unitCount = execSync(`sqlite3 "${dbPath}" "SELECT COUNT(*) FROM units;"`, { 
    encoding: 'utf8',
    windowsVerbatimArguments: true
  });
  
  console.log(`数据库中有 ${unitCount.trim()} 个单位记录`);
} catch (error) {
  console.error('数据库初始化失败:', error.message);
  process.exit(1);
}
