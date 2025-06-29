require('dotenv').config();

// JWT配置
const jwtConfig = {
  secret: process.env.JWT_SECRET || 'please_set_jwt_secret_in_env_file',
  expiresIn: {
    default: '24h',
    remember: '30d'
  }
};

// 验证JWT配置
if (jwtConfig.secret === 'please_set_jwt_secret_in_env_file') {
  console.warn('⚠ 警告: 请在.env文件中设置JWT_SECRET');
}

module.exports = jwtConfig; 