const path = require('path');
// 加载环境变量 - 统一使用backend/.env
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// JWT配置
const jwtConfig = {
  secret: process.env.JWT_SECRET,
  expiresIn: {
    default: '24h',
    remember: '30d'
  }
};

// 验证JWT配置
if (!jwtConfig.secret) {
  const errorMsg = '❌ 严重错误: 必须在.env文件中设置JWT_SECRET环境变量！';
  console.error(errorMsg);
  console.error('请在backend/.env文件中添加: JWT_SECRET=your_very_secure_random_string');
  console.error('建议使用至少32位的随机字符串作为JWT密钥');
  
  // 在生产环境或未明确设置开发环境时，拒绝启动
  if (process.env.NODE_ENV === 'production' || !process.env.NODE_ENV) {
    console.error('程序将退出以确保安全...');
    process.exit(1);
  } else {
    console.warn('⚠ 警告: 开发环境检测到，使用临时密钥，请尽快设置正确的JWT_SECRET');
    jwtConfig.secret = 'development_temp_key_please_change_in_production';
  }
}

// 额外的安全检查
if (jwtConfig.secret === 'please_set_jwt_secret_in_env_file' || 
    jwtConfig.secret === 'development_temp_key_please_change_in_production') {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ 生产环境禁止使用默认或临时JWT密钥！');
    process.exit(1);
  }
}

if (jwtConfig.secret && jwtConfig.secret.length < 32) {
  console.warn('⚠ 警告: JWT密钥长度过短，建议使用至少32位字符');
}

module.exports = jwtConfig; 