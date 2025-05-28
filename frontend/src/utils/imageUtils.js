/**
 * 图片处理工具函数
 */
import Compressor from 'compressorjs';
import { validateImageType, validateFileSize } from './commonUtils';

/**
 * 将图片转换为JPG格式并压缩
 * @param {File} file - 原始图片文件
 * @param {Function} onProgress - 进度回调函数（可选）
 * @param {Object} options - 压缩选项
 * @returns {Promise<File>} - 处理后的图片文件
 */
export const compressToJpg = (file, onProgress, options = {}) => {
  const defaultOptions = {
    quality: 0.6,
    maxWidth: 1920,
    maxHeight: 1920,
    mimeType: 'image/jpeg',
    convertSize: 0
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  return new Promise((resolve) => {
    // 报告进度：开始
    if (onProgress) onProgress(0);
    
    console.log('开始处理图片:', file.name, '类型:', file.type, '大小:', (file.size / 1024).toFixed(2), 'KB');
    
    // 检查是否为图片
    if (!validateImageType(file.type)) {
      console.warn('文件不是图片类型:', file.type);
      if (onProgress) onProgress(100);
      resolve(file); // 如果不是图片，直接返回原文件
      return;
    }
    
    // 检查文件大小
    if (!validateFileSize(file.size)) {
      console.warn('文件过大:', file.size);
      if (onProgress) onProgress(100);
      resolve(file); // 如果文件过大，直接返回原文件
      return;
    }
    
    // 报告进度：25%
    if (onProgress) onProgress(25);
    
    // 使用compressorjs处理图片
    new Compressor(file, {
      ...finalOptions,
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
 * @param {Object} options - 压缩选项
 * @returns {Promise<File[]>} - 处理后的图片文件数组
 */
export const batchCompressToJpg = async (files, onProgress, options = {}) => {
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
    const processedFile = await compressToJpg(files[i], null, options);
    processedFiles.push(processedFile);
  }
  
  // 报告进度：完成
  if (onProgress) onProgress(100);
  
  return processedFiles;
}; 