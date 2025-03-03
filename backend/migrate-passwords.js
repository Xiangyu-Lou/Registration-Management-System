/**
 * 密码迁移脚本
 * 将数据库中的明文密码转换为bcrypt加密的密码
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// 数据库连接配置
const dbConfig = {
  host: 'localhost',
  user: 'Xiangyu',
  password: '990924',
  database: 'waste_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// 密码加密函数
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// 主函数
async function migratePasswords() {
  console.log('开始密码迁移...');
  
  // 创建数据库连接池
  const pool = mysql.createPool(dbConfig);
  
  try {
    // 获取所有有密码的用户
    const [users] = await pool.query('SELECT id, username, password FROM users WHERE password IS NOT NULL AND password != ""');
    
    console.log(`找到 ${users.length} 个需要迁移密码的用户`);
    
    // 遍历用户并更新密码
    for (const user of users) {
      try {
        // 跳过已经是bcrypt格式的密码
        if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
          console.log(`用户 ${user.username} (ID: ${user.id}) 的密码已经是加密格式，跳过`);
          continue;
        }
        
        // 加密密码
        const hashedPassword = await hashPassword(user.password);
        
        // 更新用户密码
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
        
        console.log(`用户 ${user.username} (ID: ${user.id}) 的密码已成功迁移`);
      } catch (error) {
        console.error(`迁移用户 ${user.username} (ID: ${user.id}) 的密码时出错:`, error);
      }
    }
    
    console.log('密码迁移完成');
  } catch (error) {
    console.error('密码迁移过程中出错:', error);
  } finally {
    // 关闭连接池
    await pool.end();
  }
}

// 执行迁移
migratePasswords().catch(console.error); 