/**
 * 图片处理工具函数
 */
import Compressor from 'compressorjs';

/**
 * 将图片转换为JPG格式并压缩
 * @param {File} file - 原始图片文件
 * @param {Function} onProgress - 进度回调函数（可选）
 * @returns {Promise<File>} - 处理后的图片文件
 */
export const compressToJpg = (file, onProgress) => {
  return new Promise((resolve) => {
    // 报告进度：开始
    if (onProgress) onProgress(0);
    
    console.log('开始处理图片:', file.name, '类型:', file.type, '大小:', (file.size / 1024).toFixed(2), 'KB');
    
    // 检查是否为图片
    if (!file.type.startsWith('image/')) {
      console.warn('文件不是图片类型:', file.type);
      if (onProgress) onProgress(100);
      resolve(file); // 如果不是图片，直接返回原文件
      return;
    }
    
    // 报告进度：25%
    if (onProgress) onProgress(25);
    
    // 使用compressorjs处理图片
    new Compressor(file, {
      quality: 0.6,           // 中等压缩 (0-1)
      maxWidth: 1920,         // 最大宽度
      maxHeight: 1920,        // 最大高度
      mimeType: 'image/jpeg', // 强制转换为JPEG
      convertSize: 0,         // 所有图片都转换格式
      // 报告进度：50%
      beforeDraw() {
        if (onProgress) onProgress(50);
        console.log('图片处理中...');
      },
      // 报告进度：75%
      drew() {
        if (onProgress) onProgress(75);
        console.log('图片绘制完成');
      },
      success(result) {
        // 创建新的文件名（确保扩展名为.jpg）
        const fileName = file.name.replace(/\.[^/.]+$/, "") + '.jpg';
        
        // 创建新的File对象
        const processedFile = new File([result], fileName, {
          type: 'image/jpeg',
          lastModified: new Date().getTime()
        });
        
        // 输出处理结果日志
        console.log('图片处理完成:');
        console.log('- 原始大小:', (file.size / 1024).toFixed(2), 'KB');
        console.log('- 处理后大小:', (processedFile.size / 1024).toFixed(2), 'KB');
        console.log('- 压缩率:', Math.round((1 - processedFile.size / file.size) * 100), '%');
        console.log('- 处理后文件类型:', processedFile.type);
        console.log('- 处理后文件名:', processedFile.name);
        
        // 报告进度：完成
        if (onProgress) onProgress(100);
        resolve(processedFile);
      },
      error(err) {
        console.error('图片压缩失败:', err);
        // 如果处理失败，返回原始文件
        if (onProgress) onProgress(100);
        resolve(file);
      }
    });
  });
};

/**
 * 批量处理图片文件，转换为JPG并压缩
 * @param {File[]} files - 图片文件数组
 * @param {Function} onProgress - 进度回调函数（可选）
 * @returns {Promise<File[]>} - 处理后的图片文件数组
 */
export const batchCompressToJpg = async (files, onProgress) => {
  if (!files || files.length === 0) {
    return [];
  }
  
  const processedFiles = [];
  const totalFiles = files.length;
  
  for (let i = 0; i < totalFiles; i++) {
    // 计算并报告当前进度
    const currentProgress = Math.round((i / totalFiles) * 100);
    if (onProgress) onProgress(currentProgress);
    
    // 处理单个文件
    const processedFile = await compressToJpg(files[i]);
    processedFiles.push(processedFile);
  }
  
  // 报告进度：完成
  if (onProgress) onProgress(100);
  
  return processedFiles;
};

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