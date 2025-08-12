const fs = require('fs');
const path = require('path');

// 安全的路径校验函数
const validatePhotoPath = (photoPath, uploadsRoot) => {
  if (!photoPath || typeof photoPath !== 'string') {
    return false;
  }
  
  // 拒绝绝对路径
  if (path.isAbsolute(photoPath)) {
    console.warn('拒绝绝对路径:', photoPath);
    return false;
  }
  
  // 拒绝包含路径遍历的路径
  if (photoPath.includes('..') || photoPath.includes('\\..') || photoPath.includes('../')) {
    console.warn('拒绝包含路径遍历的路径:', photoPath);
    return false;
  }
  
  // 解析完整路径并检查是否在上传目录内
  const fullPath = path.resolve(uploadsRoot, photoPath.replace(/^\/+/, ''));
  const normalizedUploadsRoot = path.resolve(uploadsRoot);
  
  if (!fullPath.startsWith(normalizedUploadsRoot + path.sep) && fullPath !== normalizedUploadsRoot) {
    console.warn('路径不在上传目录内:', photoPath, 'resolved to:', fullPath);
    return false;
  }
  
  return true;
};

// 安全的获取完整路径函数
const getSafePhotoPath = (photoPath, uploadsRoot) => {
  if (!validatePhotoPath(photoPath, uploadsRoot)) {
    return null;
  }
  
  // 移除前导斜杠并拼接
  const cleanPath = photoPath.replace(/^\/+/, '');
  return path.join(uploadsRoot, cleanPath);
};

// 删除单个文件
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`文件删除成功: ${filePath}`);
      return true;
    } else {
      console.log(`文件不存在: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`删除文件失败: ${filePath}`, error);
    return false;
  }
};

// 删除多个照片文件
const deletePhotoFiles = (photoPath, baseDir = path.join(__dirname, '../..')) => {
  if (!photoPath) return;
  
  try {
    let photoPaths = [];
    
    // 尝试解析JSON格式的路径
    try {
      photoPaths = JSON.parse(photoPath);
    } catch (e) {
      // 如果不是JSON格式，则视为单个路径
      photoPaths = [photoPath];
    }
    
    // 安全删除每张照片
    photoPaths.forEach(photoPath => {
      const safePath = getSafePhotoPath(photoPath, baseDir);
      if (safePath) {
        deleteFile(safePath);
      } else {
        console.warn('跳过不安全的照片路径:', photoPath);
      }
    });
  } catch (error) {
    console.error('删除照片文件时出错:', error);
  }
};

// 处理上传的文件路径
const processUploadedFiles = (files) => {
  if (!files || files.length === 0) {
    return null;
  }
  
  // 存储相对路径，不包含前导斜杠
  const filePaths = files.map(file => `uploads/${file.filename}`);
  return JSON.stringify(filePaths);
};

// 合并旧照片和新照片
const mergePhotoFiles = (existingPhotoPath, newFiles) => {
  let existingPaths = [];
  
  // 解析现有照片路径
  if (existingPhotoPath) {
    try {
      existingPaths = JSON.parse(existingPhotoPath);
    } catch (e) {
      // 如果不是JSON格式，则视为单个路径
      existingPaths = [existingPhotoPath];
    }
  }
  
  // 处理新上传的文件
  let newPaths = [];
  if (newFiles && newFiles.length > 0) {
    // 存储相对路径，不包含前导斜杠
    newPaths = newFiles.map(file => `uploads/${file.filename}`);
  }
  
  // 合并路径
  const allPaths = [...existingPaths, ...newPaths];
  
  return allPaths.length > 0 ? JSON.stringify(allPaths) : null;
};

// 删除指定的照片文件并返回更新后的照片路径
const removeSpecificPhotoFiles = (existingPhotoPath, photosToRemove, baseDir = path.join(__dirname, '../..')) => {
  if (!existingPhotoPath || !photosToRemove || photosToRemove.length === 0) {
    return existingPhotoPath;
  }
  
  let existingPaths = [];
  
  // 解析现有照片路径
  try {
    existingPaths = JSON.parse(existingPhotoPath);
  } catch (e) {
    // 如果不是JSON格式，则视为单个路径
    existingPaths = [existingPhotoPath];
  }
  
  // 安全检查：只允许删除当前记录中已存在的照片
  const safePaths = existingPaths.filter(path => validatePhotoPath(path, baseDir));
  const safeRemovePaths = photosToRemove.filter(path => {
    // 检查要删除的路径是否在现有路径列表中
    const isInExisting = safePaths.includes(path);
    if (!isInExisting) {
      console.warn('尝试删除不在记录中的照片路径:', path);
      return false;
    }
    return validatePhotoPath(path, baseDir);
  });
  
  // 删除指定的照片文件
  safeRemovePaths.forEach(photoPath => {
    const safePath = getSafePhotoPath(photoPath, baseDir);
    if (safePath) {
      deleteFile(safePath);
    }
  });
  
  // 从数组中移除指定的照片路径
  const remainingPaths = existingPaths.filter(path => !safeRemovePaths.includes(path));
  
  return remainingPaths.length > 0 ? JSON.stringify(remainingPaths) : null;
};

module.exports = {
  deleteFile,
  deletePhotoFiles,
  processUploadedFiles,
  mergePhotoFiles,
  removeSpecificPhotoFiles,
  validatePhotoPath,
  getSafePhotoPath
}; 