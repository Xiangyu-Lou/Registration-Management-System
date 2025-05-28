/**
 * 通用工具函数
 */

/**
 * 解析照片路径，支持JSON字符串和数组
 * @param {String|Array} path - 照片路径字符串或数组
 * @returns {Array} 解析后的照片路径数组
 */
export const parsePhotoPath = (path) => {
  if (!path) return [];
  
  try {
    // 如果已经是数组，直接返回
    if (Array.isArray(path)) {
      return path;
    }
    
    if (typeof path === 'string') {
      // 检查是否是JSON数组格式
      if (path.startsWith('[') && path.endsWith(']')) {
        const parsed = JSON.parse(path);
        return parsed;
      }
      
      // 检查是否是逗号分隔的字符串
      if (path.includes(',')) {
        const paths = path.split(',').map(p => p.trim()).filter(p => p);
        return paths;
      }
      
      // 单个路径
      return [path];
    }
    
    // 其他情况，尝试转换为字符串后处理
    return [String(path)];
  } catch (error) {
    console.error('解析照片路径失败:', error);
    // 如果解析失败，将其作为单个路径返回
    return typeof path === 'string' ? [path] : [];
  }
};

/**
 * 格式化日期时间
 * @param {String} dateTimeStr - 日期时间字符串
 * @returns {String} 格式化后的日期时间
 */
export const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '';
  
  try {
    const date = new Date(dateTimeStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch (error) {
    console.error('格式化日期时间失败:', error);
    return dateTimeStr;
  }
};

/**
 * 格式化日期
 * @param {String} dateStr - 日期字符串
 * @returns {String} 格式化后的日期
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('格式化日期失败:', error);
    return dateStr;
  }
};

/**
 * 格式化时间
 * @param {String} timeStr - 时间字符串
 * @returns {String} 格式化后的时间
 */
export const formatTime = (timeStr) => {
  if (!timeStr) return '';
  
  try {
    const date = new Date(timeStr);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${hours}:${minutes}`;
  } catch (error) {
    console.error('格式化时间失败:', error);
    return timeStr;
  }
};

/**
 * 格式化数量显示
 * @param {Number} quantity - 数量
 * @param {Number} precision - 精度，默认3位小数
 * @returns {String} 格式化后的数量
 */
export const formatQuantity = (quantity, precision = 3) => {
  if (quantity === null || quantity === undefined || quantity === '') {
    return '';
  }
  
  try {
    return parseFloat(quantity).toFixed(precision);
  } catch (error) {
    console.error('格式化数量失败:', error);
    return String(quantity);
  }
};

/**
 * 检查是否为大文件
 * @param {Array} files - 文件数组
 * @param {Number} threshold - 阈值，默认2MB
 * @returns {Boolean} 是否包含大文件
 */
export const checkForLargeFiles = (files, threshold = 2 * 1024 * 1024) => {
  if (!files || !Array.isArray(files)) return false;
  return files.some(file => file.size > threshold);
};

/**
 * 获取文件扩展名
 * @param {String} fileName - 文件名
 * @returns {String} 文件扩展名
 */
export const getFileExtension = (fileName) => {
  if (!fileName) return '';
  const lastDotIndex = fileName.lastIndexOf('.');
  return lastDotIndex !== -1 ? fileName.substring(lastDotIndex + 1).toLowerCase() : '';
};

/**
 * 验证图片文件类型
 * @param {String} fileType - 文件MIME类型
 * @returns {Boolean} 是否为有效的图片类型
 */
export const validateImageType = (fileType) => {
  const acceptedTypes = [
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/gif', 
    'image/bmp', 
    'image/webp'
  ];
  return acceptedTypes.includes(fileType);
};

/**
 * 验证文件大小
 * @param {Number} fileSize - 文件大小（字节）
 * @param {Number} maxSize - 最大文件大小（字节），默认50MB
 * @returns {Boolean} 文件大小是否符合要求
 */
export const validateFileSize = (fileSize, maxSize = 50 * 1024 * 1024) => {
  return fileSize <= maxSize;
};

/**
 * 构建完整的图片URL
 * @param {String} path - 图片路径
 * @param {String} baseUrl - 基础URL
 * @returns {String} 完整的图片URL
 */
export const buildImageUrl = (path, baseUrl = window.location.origin) => {
  if (!path) return '';
  
  // 如果已经是完整URL，直接返回
  if (path.startsWith('http')) {
    return path;
  }
  
  // 移除开头的斜杠（如果有）
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${baseUrl}/${cleanPath}`;
};

/**
 * 生成带时间戳的文件名
 * @param {String} baseName - 基础文件名
 * @param {String} extension - 文件扩展名（可选）
 * @returns {String} 带时间戳的文件名
 */
export const generateTimestampedFileName = (baseName, extension = '') => {
  const timestamp = new Date().toISOString().replace(/[-:.]/g, '').substring(0, 14);
  const ext = extension ? `.${extension}` : '';
  return `${baseName}_${timestamp}${ext}`;
};

/**
 * 清理文件名，移除特殊字符
 * @param {String} fileName - 原始文件名
 * @returns {String} 清理后的文件名
 */
export const sanitizeFileName = (fileName) => {
  if (!fileName) return '';
  return fileName.replace(/[\\/:*?"<>|]/g, '_');
};

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {Number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {Number} delay - 延迟时间（毫秒）
 * @returns {Function} 节流后的函数
 */
export const throttle = (func, delay) => {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return func.apply(this, args);
    }
  };
};

/**
 * 深拷贝对象
 * @param {Any} obj - 要拷贝的对象
 * @returns {Any} 拷贝后的对象
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

/**
 * 检查值是否为空
 * @param {Any} value - 要检查的值
 * @returns {Boolean} 是否为空
 */
export const isEmpty = (value) => {
  if (value === null || value === undefined) {
    return true;
  }
  
  if (typeof value === 'string') {
    return value.trim() === '';
  }
  
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  
  return false;
}; 