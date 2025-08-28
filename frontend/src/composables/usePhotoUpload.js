import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import Compressor from 'compressorjs';
import { useTimerCleanup } from './useTimerCleanup';

export function usePhotoUpload(options = {}) {
  const {
    largeFileThreshold = 5 * 1024 * 1024,
    onBeforeRemove = null,
    onAfterRemove = null,
    onAfterProcess = null
  } = options;

  const { safeTimeout } = useTimerCleanup();

  const photoFilesBefore = ref([]);
  const photoFilesAfter = ref([]);
  const fileListBefore = ref([]);
  const fileListAfter = ref([]);
  const showUploadProgress = ref(false);
  const uploadPercentage = ref(0);
  const uploadStatus = ref('准备上传...');
  const showLargeFileWarning = ref(false);

  const checkForLargeFiles = (files) => {
    return files.some(file => file.size > largeFileThreshold);
  };

  const compressImage = (rawFile) => {
    return new Promise((resolve) => {
      new Compressor(rawFile, {
        quality: 0.6,
        maxWidth: 1920,
        maxHeight: 1920,
        mimeType: 'image/jpeg',
        convertSize: 0,
        beforeDraw() {
          uploadPercentage.value = 30;
          uploadStatus.value = '正在处理图片...';
          console.log('图片处理中...');
        },
        drew() {
          uploadPercentage.value = 60;
          uploadStatus.value = '正在压缩图片...';
          console.log('图片绘制完成');
        },
        success(result) {
          const fileName = rawFile.name.replace(/\.[^/.]+$/, "") + '.jpg';
          const processedFile = new File([result], fileName, {
            type: 'image/jpeg',
            lastModified: new Date().getTime()
          });

          console.log('图片处理完成:');
          console.log('- 原始大小:', (rawFile.size / 1024).toFixed(2), 'KB');
          console.log('- 处理后大小:', (processedFile.size / 1024).toFixed(2), 'KB');
          console.log('- 压缩率:', Math.round((1 - processedFile.size / rawFile.size) * 100), '%');
          console.log('- 处理后文件类型:', processedFile.type);
          console.log('- 处理后文件名:', processedFile.name);

          uploadStatus.value = '图片处理完成';
          uploadPercentage.value = 100;

          resolve(processedFile);
        },
        error(err) {
          console.error('图片压缩失败:', err);
          uploadStatus.value = '处理失败，使用原始图片';
          uploadPercentage.value = 100;
          resolve(rawFile);
        }
      });
    });
  };

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

      console.log('开始处理图片:', file.name, '类型:', file.type, '大小:', (file.size / 1024).toFixed(2), 'KB');

      compressImage(file).then((processedFile) => {
        safeTimeout(() => {
          showUploadProgress.value = false;
        }, 500);

        resolve(processedFile);
      });
    });
  };

  const processPhotoChange = async (file, fileList, photoFiles, fileListRef, label) => {
    console.log(`${label}照片变更:`, file);
    console.log('当前文件列表:', fileList);

    fileListRef.value = [...fileList];

    if (file.processed) {
      console.log('文件已处理过，跳过压缩:', file.name);
      return;
    }

    if (file.raw && file.status === 'ready') {
      showUploadProgress.value = true;
      uploadStatus.value = '正在处理图片...';
      uploadPercentage.value = 0;

      console.log(`开始处理${label}照片:`, file.name, '类型:', file.raw.type, '大小:', (file.raw.size / 1024).toFixed(2), 'KB');

      try {
        const processedFile = await compressImage(file.raw);

        console.log('替换原始文件为处理后的文件:', processedFile.name);

        file.processed = true;
        file.raw = processedFile;

        const existingIndex = photoFiles.value.findIndex(f => f.uid === file.uid || f.name === file.name);
        if (existingIndex >= 0) {
          photoFiles.value[existingIndex] = processedFile;
        } else {
          photoFiles.value.push(processedFile);
        }

        const fileIndex = fileListRef.value.findIndex(f => f.uid === file.uid);
        if (fileIndex >= 0) {
          fileListRef.value[fileIndex].processed = true;
        }

        safeTimeout(() => {
          showUploadProgress.value = false;
        }, 500);

      } catch (error) {
        console.error('处理图片时出错:', error);
        ElMessage.warning('图片处理失败，将使用原始图片');

        const existingIndex = photoFiles.value.findIndex(f => f.uid === file.uid || f.name === file.name);
        if (existingIndex >= 0) {
          photoFiles.value[existingIndex] = file.raw;
        } else {
          photoFiles.value.push(file.raw);
        }

        showUploadProgress.value = false;
      }
    } else if (!file.raw && file.url) {
      console.log('已有文件，不需要处理:', file.name);
    }

    const allFiles = [...photoFilesBefore.value, ...photoFilesAfter.value];
    showLargeFileWarning.value = checkForLargeFiles(allFiles);

    if (onAfterProcess) {
      onAfterProcess(fileListRef.value, label);
    }

    console.log(`更新后的photoFiles(${label}):`, photoFiles.value);
    console.log(`更新后的fileList(${label}):`, fileListRef.value);
  };

  const handlePhotoBeforeChange = (file, fileList) => {
    return processPhotoChange(file, fileList, photoFilesBefore, fileListBefore, '收集前');
  };

  const handlePhotoAfterChange = (file, fileList) => {
    return processPhotoChange(file, fileList, photoFilesAfter, fileListAfter, '收集后');
  };

  const processPhotoRemove = (file, fileList, photoFiles, fileListRef, label) => {
    console.log(`${label}照片移除:`, file);

    if (onBeforeRemove) {
      onBeforeRemove(file, label);
    }

    fileListRef.value = fileList;

    if (file.raw) {
      photoFiles.value = photoFiles.value.filter(f => f.name !== file.raw.name);
    } else {
      photoFiles.value = photoFiles.value.filter(f => f.uid !== file.uid && f.name !== file.name);
    }

    if (!checkForLargeFiles([...photoFilesBefore.value, ...photoFilesAfter.value])) {
      showLargeFileWarning.value = false;
    }

    if (onAfterRemove) {
      onAfterRemove(fileListRef.value, label);
    }

    console.log(`更新后的photoFiles(${label}):`, photoFiles.value);
  };

  const handlePhotoBeforeRemove = (file, fileList) => {
    processPhotoRemove(file, fileList, photoFilesBefore, fileListBefore, '收集前');
  };

  const handlePhotoAfterRemove = (file, fileList) => {
    processPhotoRemove(file, fileList, photoFilesAfter, fileListAfter, '收集后');
  };

  const handleUploadProgress = (progressEvent) => {
    if (progressEvent.total) {
      const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      uploadPercentage.value = percentage;

      if (percentage < 33) {
        uploadStatus.value = '正在上传文件...';
      } else if (percentage < 66) {
        uploadStatus.value = '正在处理文件...';
      } else if (percentage < 100) {
        uploadStatus.value = '即将完成...';
      } else {
        uploadStatus.value = '上传完成，正在保存...';
      }
    }
  };

  const percentageFormat = (percentage) => {
    return percentage === 100 ? '完成' : `${percentage}%`;
  };

  const cleanup = () => {
    photoFilesBefore.value = [];
    photoFilesAfter.value = [];
    fileListBefore.value = [];
    fileListAfter.value = [];
    showUploadProgress.value = false;
    showLargeFileWarning.value = false;
  };

  return {
    photoFilesBefore,
    photoFilesAfter,
    fileListBefore,
    fileListAfter,
    showUploadProgress,
    uploadPercentage,
    uploadStatus,
    showLargeFileWarning,
    handleBeforeUpload,
    handlePhotoBeforeChange,
    handlePhotoAfterChange,
    handlePhotoBeforeRemove,
    handlePhotoAfterRemove,
    handleUploadProgress,
    percentageFormat,
    checkForLargeFiles,
    cleanup
  };
}
