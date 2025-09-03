const multer = require('multer');
const path = require('path');

// 使用内存存储，文件暂存在 buffer 中，后续上传到 OSS
const storage = multer.memoryStorage();

// 文件类型过滤器
const fileFilter = function(req, file, cb) {
  const acceptedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp'
  ];

  if (acceptedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只接受JPEG、JPG、PNG、GIF、BMP和WEBP格式的图片文件'), false);
  }
};

// 根据 MIME 类型获取扩展名
const getExtByMime = (mimetype) => {
  switch (mimetype) {
    case 'image/jpeg':
    case 'image/jpg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/gif':
      return '.gif';
    case 'image/bmp':
      return '.bmp';
    case 'image/webp':
      return '.webp';
    default:
      return '.jpg';
  }
};

// 上传配置
const uploadConfig = {
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
};

const upload = multer(uploadConfig);

module.exports = { upload, getExtByMime };
