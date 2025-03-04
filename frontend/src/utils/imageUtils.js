/**
 * 图片处理工具函数
 */

/**
 * 简单的图片处理函数（不进行转换或压缩）
 * @param {File} file - 原始图片文件
 * @param {Function} onProgress - 进度回调函数
 * @returns {Promise<File>} - 原始图片文件
 */
export const convertAndCompressImage = (file, onProgress) => {
  return new Promise((resolve) => {
    // 报告进度：开始
    if (onProgress) onProgress(0);
    
    // 立即报告100%进度
    setTimeout(() => {
      if (onProgress) onProgress(100);
      // 直接返回原始文件
      resolve(file);
    }, 10);
  });
};

/**
 * 批量处理图片文件（不进行实际处理）
 * @param {File[]} files - 图片文件数组
 * @param {Function} onProgress - 进度回调函数
 * @returns {Promise<File[]>} - 原始图片文件数组
 */
export const batchProcessImages = async (files, onProgress) => {
  if (!files || files.length === 0) {
    return [];
  }
  
  // 立即报告100%进度
  if (onProgress) onProgress(100);
  
  // 直接返回原始文件数组
  return files;
}; 