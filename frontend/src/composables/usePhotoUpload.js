import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import Compressor from 'compressorjs';

/**
 * 照片上传相关的组合式API
 */
export const usePhotoUpload = () => {
  const fileListBefore = ref([]);
  const fileListAfter = ref([]);
  const showUploadProgress = ref(false);
  const uploadPercentage = ref(0);
  const uploadStatus = ref('准备上传...');
  const showLargeFileWarning = ref(false);
  const showViewer = ref(false);
  const previewImages = ref([]);
  const previewIndex = ref(0);

  // 原始照片路径跟踪（用于编辑模式）
  const originalPhotosBefore = ref([]);
  const originalPhotosAfter = ref([]);
  const deletedPhotosBefore = ref([]);
  const deletedPhotosAfter = ref([]);

  /**
   * 解析照片路径
   */
  const parsePhotoPath = (path) => {
    if (!path) return [];
    
    try {
      if (Array.isArray(path)) {
        return path;
      }
      
      if (typeof path === 'string') {
        if (path.startsWith('[') && path.endsWith(']')) {
          const parsed = JSON.parse(path);
          return parsed;
        }
        
        if (path.includes(',')) {
          const paths = path.split(',').map(p => p.trim()).filter(p => p);
          return paths;
        }
        
        return [path];
      }
      
      return [String(path)];
    } catch (error) {
      console.error('解析照片路径失败:', error);
      return typeof path === 'string' ? [path] : [];
    }
  };

  /**
   * 处理上传前的文件验证和压缩
   */
  const handleBeforeUpload = (file) => {
    const acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
    const isImage = acceptedTypes.includes(file.type);
    
    if (!isImage) {
      ElMessage.error('只能上传图片文件!');
      return false;
    }

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      ElMessage.error('图片大小不能超过50MB!');
      return false;
    }
    
    return new Promise((resolve) => {
      showUploadProgress.value = true;
      uploadStatus.value = '正在处理图片...';
      uploadPercentage.value = 0;
      
      new Compressor(file, {
        quality: 0.6,
        maxWidth: 1920,
        maxHeight: 1920,
        mimeType: 'image/jpeg',
        convertSize: 0,
        beforeDraw() {
          uploadPercentage.value = 30;
          uploadStatus.value = '正在处理图片...';
        },
        drew() {
          uploadPercentage.value = 60;
          uploadStatus.value = '正在压缩图片...';
        },
        success(result) {
          const fileName = file.name.replace(/\.[^/.]+$/, "") + '.jpg';
          const processedFile = new File([result], fileName, {
            type: 'image/jpeg',
            lastModified: new Date().getTime()
          });
          
          uploadStatus.value = '图片处理完成';
          uploadPercentage.value = 100;
          
          setTimeout(() => {
            showUploadProgress.value = false;
          }, 500);
          
          resolve(processedFile);
        },
        error(err) {
          console.error('图片压缩失败:', err);
          uploadStatus.value = '处理失败，使用原始图片';
          uploadPercentage.value = 100;
          
          setTimeout(() => {
            showUploadProgress.value = false;
          }, 500);
          
          resolve(file);
        }
      });
    });
  };

  /**
   * 处理照片变更（通用）
   */
  const handlePhotoChange = async (file, fileList, type = 'before') => {
    const targetList = type === 'before' ? fileListBefore : fileListAfter;
    
    targetList.value = [...fileList];
    
    if (file.processed) {
      return;
    }
    
    if (file.raw && file.status === 'ready') {
      try {
        const processedFile = await handleBeforeUpload(file.raw);
        file.processed = true;
        file.raw = processedFile;
      } catch (error) {
        console.error('处理图片时出错:', error);
        ElMessage.warning('图片处理失败，将使用原始图片');
      }
    }
    
    checkForLargeFiles(fileList);
    updatePreviewImages();
    
    return false;
  };

  /**
   * 处理照片移除
   */
  const handlePhotoRemove = (file, fileList, type = 'before') => {
    const targetList = type === 'before' ? fileListBefore : fileListAfter;
    const deletedList = type === 'before' ? deletedPhotosBefore : deletedPhotosAfter;
    
    if (file.originalPath) {
      deletedList.value.push(file.originalPath);
    }
    
    targetList.value = fileList;
    
    if (!checkForLargeFiles([...fileListBefore.value, ...fileListAfter.value])) {
      showLargeFileWarning.value = false;
    }
    
    updatePreviewImages();
  };

  /**
   * 检查是否有大文件
   */
  const checkForLargeFiles = (files) => {
    const largeFileThreshold = 2 * 1024 * 1024;
    const hasLarge = files.some(file => file.size > largeFileThreshold);
    showLargeFileWarning.value = hasLarge;
    return hasLarge;
  };

  /**
   * 更新预览图片列表
   */
  const updatePreviewImages = () => {
    const allFiles = [...fileListBefore.value, ...fileListAfter.value];
    previewImages.value = allFiles.map(file => {
      if (file.url) {
        return file.url;
      } else if (file.raw) {
        if (!file._blobUrl) {
          file._blobUrl = URL.createObjectURL(file.raw);
        }
        return file._blobUrl;
      } else if (file instanceof File) {
        if (!file._blobUrl) {
          file._blobUrl = URL.createObjectURL(file);
        }
        return file._blobUrl;
      }
      return '';
    }).filter(url => url);
  };

  /**
   * 处理图片预览
   */
  const handlePictureCardPreview = (file) => {
    updatePreviewImages();
    
    const index = previewImages.value.findIndex(url => {
      if (file.url) {
        return url === file.url;
      } else if (file.raw) {
        const blobUrl = URL.createObjectURL(file.raw);
        const result = url === blobUrl;
        URL.revokeObjectURL(blobUrl);
        return result;
      }
      return false;
    });
    
    previewIndex.value = index !== -1 ? index : 0;
    showViewer.value = true;
  };

  /**
   * 关闭图片预览
   */
  const closeViewer = () => {
    showViewer.value = false;
  };

  /**
   * 初始化编辑模式的照片数据
   */
  const initEditModePhotos = (photoBefore, photoAfter, baseUrl) => {
    if (photoBefore) {
      const photoPaths = parsePhotoPath(photoBefore);
      originalPhotosBefore.value = [...photoPaths];
      
      fileListBefore.value = photoPaths.map(path => {
        let fullUrl = path;
        if (!path.startsWith('http')) {
          const cleanPath = path.startsWith('/') ? path.substring(1) : path;
          fullUrl = `${baseUrl}/${cleanPath}`;
        }
        
        return {
          name: path.split('/').pop(),
          url: fullUrl,
          originalPath: path
        };
      });
    }
    
    if (photoAfter) {
      const photoPaths = parsePhotoPath(photoAfter);
      originalPhotosAfter.value = [...photoPaths];
      
      fileListAfter.value = photoPaths.map(path => {
        let fullUrl = path;
        if (!path.startsWith('http')) {
          const cleanPath = path.startsWith('/') ? path.substring(1) : path;
          fullUrl = `${baseUrl}/${cleanPath}`;
        }
        
        return {
          name: path.split('/').pop(),
          url: fullUrl,
          originalPath: path
        };
      });
    }
    
    updatePreviewImages();
  };

  /**
   * 准备提交的照片数据
   */
  const preparePhotoFormData = (formData, isEditMode = false) => {
    // 处理收集前照片
    if (fileListBefore.value.length > 0) {
      const newFiles = fileListBefore.value.filter(file => file.raw);
      const existingFiles = fileListBefore.value.filter(file => !file.raw && file.originalPath);
      
      newFiles.forEach(file => {
        if (file.raw) {
          formData.append('photo_before', file.raw);
        }
      });
      
      if (existingFiles.length > 0) {
        const existingPaths = existingFiles.map(file => file.originalPath);
        formData.append('photo_path_before', JSON.stringify(existingPaths));
      }
    } else if (isEditMode && originalPhotosBefore.value.length > 0) {
      formData.append('photo_path_before', 'NULL');
    }
    
    // 处理收集后照片
    if (fileListAfter.value.length > 0) {
      const newFiles = fileListAfter.value.filter(file => file.raw);
      const existingFiles = fileListAfter.value.filter(file => !file.raw && file.originalPath);
      
      newFiles.forEach(file => {
        if (file.raw) {
          formData.append('photo_after', file.raw);
        }
      });
      
      if (existingFiles.length > 0) {
        const existingPaths = existingFiles.map(file => file.originalPath);
        formData.append('photo_path_after', JSON.stringify(existingPaths));
      }
    } else if (isEditMode && originalPhotosAfter.value.length > 0) {
      formData.append('photo_path_after', 'NULL');
    }
    
    // 编辑模式下发送删除的照片列表
    if (isEditMode) {
      if (deletedPhotosBefore.value.length > 0) {
        formData.append('photos_to_remove_before', JSON.stringify(deletedPhotosBefore.value));
      }
      
      if (deletedPhotosAfter.value.length > 0) {
        formData.append('photos_to_remove_after', JSON.stringify(deletedPhotosAfter.value));
      }
    }
  };

  /**
   * 格式化百分比显示
   */
  const percentageFormat = (percentage) => {
    return percentage === 100 ? '完成' : `${percentage}%`;
  };

  /**
   * 重置所有照片数据
   */
  const resetPhotos = () => {
    fileListBefore.value = [];
    fileListAfter.value = [];
    originalPhotosBefore.value = [];
    originalPhotosAfter.value = [];
    deletedPhotosBefore.value = [];
    deletedPhotosAfter.value = [];
    showLargeFileWarning.value = false;
    showUploadProgress.value = false;
    uploadPercentage.value = 0;
    previewImages.value = [];
  };

  return {
    // 状态
    fileListBefore,
    fileListAfter,
    showUploadProgress,
    uploadPercentage,
    uploadStatus,
    showLargeFileWarning,
    showViewer,
    previewImages,
    previewIndex,
    originalPhotosBefore,
    originalPhotosAfter,
    deletedPhotosBefore,
    deletedPhotosAfter,
    
    // 方法
    parsePhotoPath,
    handleBeforeUpload,
    handlePhotoChange,
    handlePhotoRemove,
    checkForLargeFiles,
    updatePreviewImages,
    handlePictureCardPreview,
    closeViewer,
    initEditModePhotos,
    preparePhotoFormData,
    percentageFormat,
    resetPhotos
  };
}; 