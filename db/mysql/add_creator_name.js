const mysql = require('mysql2/promise');

// MySQL连接配置
const dbConfig = {
  host: 'localhost',
  user: 'Xiangyu',
  password: '990924',
  database: 'waste_management',
  waitForConnections: true,
  multipleStatements: true
};

async function addCreatorNameField() {
  let connection;
  
  try {
    console.log('尝试连接到MySQL数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('成功连接到MySQL数据库');
    
    // 检查字段是否已存在
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'waste_management' 
      AND TABLE_NAME = 'waste_records' 
      AND COLUMN_NAME = 'creator_name'
    `);
    
    if (columns.length === 0) {
      // 字段不存在，添加字段
      console.log('正在添加creator_name字段...');
      await connection.execute(`
        ALTER TABLE waste_records
        ADD COLUMN creator_name VARCHAR(100) AFTER creator_id
      `);
      console.log('creator_name字段添加成功！');
    } else {
      console.log('creator_name字段已存在，无需添加');
    }
    
  } catch (error) {
    console.error('添加字段时出错:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 执行迁移
addCreatorNameField()
  .then(() => console.log('迁移完成'))
  .catch(err => console.error('迁移失败:', err)); 