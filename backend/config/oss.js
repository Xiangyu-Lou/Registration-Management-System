const OSS = require('ali-oss');

let _ossClient = null;

// 延迟初始化 OSS 客户端，避免环境变量缺失时导致启动崩溃
const getOssClient = () => {
  if (!_ossClient) {
    _ossClient = new OSS({
      region: process.env.OSS_REGION,
      accessKeyId: process.env.OSS_ACCESS_KEY_ID,
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
      bucket: process.env.OSS_BUCKET,
      secure: true  // 强制签名 URL 使用 HTTPS，避免 Mixed Content 问题
    });
  }
  return _ossClient;
};

// 根据 object key 生成完整的 OSS URL（用于存储，不含签名）
const getOssUrl = (objectKey) => {
  const bucket = process.env.OSS_BUCKET;
  const region = process.env.OSS_REGION;
  return `https://${bucket}.${region}.aliyuncs.com/${objectKey}`;
};

// 生成签名 URL（私有 Bucket 访问用，默认 1 小时过期）
const getSignedUrl = (objectKey, expires = 3600) => {
  try {
    return getOssClient().signatureUrl(objectKey, { expires });
  } catch (err) {
    console.error('生成签名URL失败:', err.message);
    return null;
  }
};

// 将存储的 OSS URL 转换为签名 URL
// 支持完整 URL 或 object key
const toSignedUrl = (storedUrl, expires = 3600) => {
  if (!storedUrl) return storedUrl;

  // 从完整 URL 中提取 object key
  let objectKey = storedUrl;
  const ossUrlPattern = /https?:\/\/[^/]+\/(.+)/;
  const match = storedUrl.match(ossUrlPattern);
  if (match) {
    objectKey = match[1];
  }

  return getSignedUrl(objectKey, expires);
};

// 批量转换照片路径为签名 URL
// 支持：OSS 完整 URL、旧 ECS 本地路径（已手动迁移到 OSS 同名 key）、逗号分隔历史格式
const signPhotoUrls = (photoPathJson, expires = 3600) => {
  if (!photoPathJson) return photoPathJson;

  const signOne = (p) => {
    if (!p) return p;
    if (p.startsWith('http')) return toSignedUrl(p, expires);
    // 旧 ECS 路径（如 uploads/xxx.jpg），文件已迁移到 OSS 同名 key，直接签名
    return getSignedUrl(p.replace(/^\/+/, ''), expires);
  };

  let paths;
  try {
    paths = JSON.parse(photoPathJson);
    if (!Array.isArray(paths)) paths = [paths];
  } catch (e) {
    // 兼容旧的逗号分隔格式
    paths = photoPathJson.split(',');
  }

  const signedPaths = paths
    .map(p => (typeof p === 'string' ? p.trim() : p))
    .filter(Boolean)
    .map(signOne);

  return JSON.stringify(signedPaths);
};

module.exports = { getOssClient, getOssUrl, getSignedUrl, toSignedUrl, signPhotoUrls };
