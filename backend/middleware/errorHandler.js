const multer = require('multer');

// 统一错误处理中间件
const errorHandler = (err, req, res, next) => {
  console.error('错误详情:', err);

  // Multer错误处理
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: '文件大小超过限制，最大允许10MB' });
    }
    return res.status(400).json({ error: `文件上传错误: ${err.message}` });
  }

  // 自定义错误
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  // 数据库错误
  if (err.code) {
    switch (err.code) {
      case 'ER_DUP_ENTRY':
        return res.status(400).json({ error: '数据已存在' });
      case 'ER_NO_REFERENCED_ROW_2':
        return res.status(400).json({ error: '引用的数据不存在' });
      default:
        return res.status(500).json({ error: '数据库操作失败' });
    }
  }

  // 默认服务器错误
  res.status(500).json({ error: '服务器内部错误' });
};

// 404错误处理
const notFoundHandler = (req, res) => {
  res.status(404).json({ error: '请求的资源不存在' });
};

module.exports = {
  errorHandler,
  notFoundHandler
}; 