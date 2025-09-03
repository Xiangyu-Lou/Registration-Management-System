const { ossClient, getOssUrl } = require('../config/oss');
const { getExtByMime } = require('../config/upload');

// 上传单个文件到 OSS，返回完整 URL
const uploadToOss = async (file) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const ext = getExtByMime(file.mimetype);
  const objectKey = `uploads/${file.fieldname}-${uniqueSuffix}${ext}`;

  await ossClient.put(objectKey, file.buffer);
  return getOssUrl(objectKey);
};

// 处理上传的文件，返回 JSON 字符串的 URL 数组
const processUploadedFiles = async (files) => {
  if (!files || files.length === 0) {
    return null;
  }

  const urls = [];
  for (const file of files) {
    const url = await uploadToOss(file);
    urls.push(url);
  }
  return JSON.stringify(urls);
};

// 删除照片文件 — OSS 权限不允许删除，仅做空操作
const deletePhotoFiles = () => {
  // no-op: OSS RAM 只有读写权限，不删除文件
};

// 合并旧照片和新照片
const mergePhotoFiles = async (existingPhotoPath, newFiles) => {
  let existingPaths = [];

  if (existingPhotoPath) {
    try {
      existingPaths = JSON.parse(existingPhotoPath);
    } catch (e) {
      existingPaths = [existingPhotoPath];
    }
  }

  let newUrls = [];
  if (newFiles && newFiles.length > 0) {
    for (const file of newFiles) {
      const url = await uploadToOss(file);
      newUrls.push(url);
    }
  }

  const allPaths = [...existingPaths, ...newUrls];
  return allPaths.length > 0 ? JSON.stringify(allPaths) : null;
};

// 从路径数组中移除指定照片（只操作数组，不删除 OSS 文件）
const removeSpecificPhotoFiles = (existingPhotoPath, photosToRemove) => {
  if (!existingPhotoPath || !photosToRemove || photosToRemove.length === 0) {
    return existingPhotoPath;
  }

  let existingPaths = [];
  try {
    existingPaths = JSON.parse(existingPhotoPath);
  } catch (e) {
    existingPaths = [existingPhotoPath];
  }

  const remainingPaths = existingPaths.filter(p => !photosToRemove.includes(p));
  return remainingPaths.length > 0 ? JSON.stringify(remainingPaths) : null;
};

module.exports = {
  processUploadedFiles,
  deletePhotoFiles,
  mergePhotoFiles,
  removeSpecificPhotoFiles
};
