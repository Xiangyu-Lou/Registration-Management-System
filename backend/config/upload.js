const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 创建上传目录
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 存储配置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    
    // 根据文件的实际MIME类型确定扩展名
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
        ext = path.extname(file.originalname);
    }
    
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
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