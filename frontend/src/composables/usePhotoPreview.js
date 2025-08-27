import { ref } from 'vue';

/**
 * 照片预览 composable
 * @param {String} baseUrl - API 基础 URL
 * @returns {Object} 照片预览相关的响应式状态和方法
 */
export function usePhotoPreview(baseUrl) {
  const showViewer = ref(false);
  const previewImages = ref([]);
  const previewIndex = ref(0);

  const previewPhoto = (paths, index) => {
    const photoArray = Array.isArray(paths) ? paths : [paths];
    previewImages.value = photoArray.map(path => `${baseUrl}${path}`);
    previewIndex.value = index || 0;
    showViewer.value = true;
  };

  const closeViewer = () => {
    showViewer.value = false;
  };

  return {
    showViewer,
    previewImages,
    previewIndex,
    previewPhoto,
    closeViewer
  };
}
