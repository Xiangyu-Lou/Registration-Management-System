// 在所有测试文件加载 backend 模块前设置环境变量
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

// 标记为测试环境，以便跳过速率限制
process.env.NODE_ENV = 'test';
