const { getOssClient, getOssUrl } = require('../config/oss');
const { getExtByMime } = require('../config/upload');

// 上传单个文件到 OSS，返回完整 URL
const uploadToOss = async (file) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const ext = getExtByMime(file.mimetype);
  const objectKey = `uploads/${file.fieldname}-${uniqueSuffix}${ext}`;

  try {
    const result = await getOssClient().put(objectKey, Buffer.from(file.buffer));
    return getOssUrl(objectKey);
  } catch (err) {
    console.error('OSS upload failed:', err.message, 'objectKey:', objectKey);
    throw err;
  }
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

// 提取 URL 中的 object key（去掉域名和查询参数），用于跨签名比较
const extractObjectKey = (url) => {
  if (!url) return url;
  if (url.startsWith('http')) {
    const match = url.match(/https?:\/\/[^/]+\/([^?]+)/);
    return match ? match[1] : url;
  }
  return url.replace(/^\/+/, '');
};

// 从路径数组中移除指定照片（只操作数组，不删除 OSS 文件）
// 比较时忽略签名参数，避免 signed URL vs unsigned URL 不匹配
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

  const removeKeys = photosToRemove.map(extractObjectKey);
  const remainingPaths = existingPaths.filter(p => !removeKeys.includes(extractObjectKey(p)));
  return remainingPaths.length > 0 ? JSON.stringify(remainingPaths) : null;
};

module.exports = {
  processUploadedFiles,
  deletePhotoFiles,
  mergePhotoFiles,
  removeSpecificPhotoFiles
};
