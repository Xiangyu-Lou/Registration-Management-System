const fs = require('fs');
const path = require('path');

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
    
    // 删除每张照片
    photoPaths.forEach(photoPath => {
      const fullPath = path.join(baseDir, photoPath);
      deleteFile(fullPath);
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
  
  const filePaths = files.map(file => `/uploads/${file.filename}`);
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
    newPaths = newFiles.map(file => `/uploads/${file.filename}`);
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
  
  // 删除指定的照片文件
  photosToRemove.forEach(photoPath => {
    const fullPath = path.join(baseDir, photoPath);
    deleteFile(fullPath);
  });
  
  // 从数组中移除指定的照片路径
  const remainingPaths = existingPaths.filter(path => !photosToRemove.includes(path));
  
  return remainingPaths.length > 0 ? JSON.stringify(remainingPaths) : null;
};

module.exports = {
  deleteFile,
  deletePhotoFiles,
  processUploadedFiles,
  mergePhotoFiles,
  removeSpecificPhotoFiles
}; 