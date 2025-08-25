const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 创建上传目录
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 清理和验证文件名，防止目录遍历攻击
const sanitizeFilename = (filename) => {
  // 移除非法字符，只允许字母、数字、下划线、连字符和点
  const cleaned = filename.replace(/[^a-zA-Z0-9_.-]/g, '');
  
  // 防止文件名以.或-开头，或包含../等路径遍历字符
  if (cleaned.startsWith('.') || cleaned.startsWith('-') || cleaned.includes('..')) {
    return 'unsafe_' + cleaned;
  }
  
  return cleaned;
};

// 存储配置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    
    // 根据文件的MIME类型安全地确定文件扩展名
    let ext;
    switch (file.mimetype) {
      case 'image/jpeg':
      case 'image/jpg':
        ext = '.jpg';
        break;
      case 'image/png':
        ext = '.png';
        break;
      case 'image/gif':
        ext = '.gif';
        break;
      case 'image/bmp':
        ext = '.bmp';
        break;
      case 'image/webp':
        ext = '.webp';
        break;
      default:
        // 对于未知的MIME类型，清理原始扩展名
        ext = sanitizeFilename(path.extname(file.originalname));
    }
    
    // 清理字段名并与唯一后缀和安全扩展名结合
    const safeFieldName = sanitizeFilename(file.fieldname);
    cb(null, safeFieldName + '-' + uniqueSuffix + ext);
  }
});

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

// 上传配置
const uploadConfig = {
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
};

const upload = multer(uploadConfig);

module.exports = { upload, uploadsDir };
