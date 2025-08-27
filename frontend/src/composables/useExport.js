import { ElMessage, ElLoading } from 'element-plus';
import { exportToExcelWithImages, exportToExcel } from '../utils/exportUtils';
import { parsePhotoPath } from '../utils/commonUtils';

/**
 * 导出功能 composable
 * @param {Object} config
 * @param {Function} config.getRecords - () => records[] 获取要导出的数据（用于非API导出）
 * @param {Function} config.fetchExportData - async (exportType) => records[] 从API获取导出数据（可选）
 * @param {Function} config.getFileName - (exportType) => string 基础文件名
 * @param {Function} config.getBaseHeaders - () => header[] 基础列配置（不含照片列）
 * @param {Function} config.mapRecord - (record) => object 行数据映射（不含照片字段）
 * @param {import('vue').Ref<boolean>} config.loading - 共享 loading 状态
 */
export function useExport(config) {
  const {
    getRecords,
    fetchExportData,
    getFileName,
    getBaseHeaders,
    mapRecord,
    loading
  } = config;

  /**
   * 分批导出通用逻辑
   */
  const batchExport = async (data, baseFileName, headers, batchSize, exportFn, loadingInstance) => {
    const totalRecords = data.length;
    const batchCount = Math.ceil(totalRecords / batchSize);

    if (batchCount > 1) {
      loadingInstance.setText(`数据较多(${totalRecords}条)，将拆分为${batchCount}个文件导出...`);
      ElMessage.info(`数据较多(${totalRecords}条)，将拆分为${batchCount}个文件导出`);
    } else {
      loadingInstance.setText(`准备导出 ${totalRecords} 条记录...`);
    }

    let successCount = 0;

    for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
      const startIndex = batchIndex * batchSize;
      const endIndex = Math.min((batchIndex + 1) * batchSize, totalRecords);
      const batchData = data.slice(startIndex, endIndex);

      const fileName = batchCount > 1
        ? `${baseFileName}_第${batchIndex + 1}部分(共${batchCount}部分)`
        : baseFileName;

      loadingInstance.setText(`正在处理第${batchIndex + 1}/${batchCount}批次，${startIndex + 1}-${endIndex}条记录...`);

      const onProgress = (current, total) => {
        const percent = Math.round((current / total) * 100);
        loadingInstance.setText(`正在导出第${batchIndex + 1}/${batchCount}部分：${percent}% (${current}/${total})`);
      };

      const result = await exportFn(batchData, fileName, headers, onProgress);
      if (result) successCount++;
    }

    return { successCount, batchCount };
  };

  const showResult = (successCount, batchCount) => {
    if (successCount === batchCount) {
      if (batchCount > 1) {
        ElMessage.success(`成功导出${batchCount}个文件`);
      } else {
        ElMessage.success('导出成功');
      }
    } else if (successCount > 0) {
      ElMessage.warning(`部分导出成功，完成了${successCount}/${batchCount}个文件`);
    } else {
      ElMessage.error('导出失败，请重试');
    }
  };

  /**
   * 导出含首张图片
   */
  const exportWithImages = async () => {
    const loadingInstance = ElLoading.service({
      lock: true,
      text: '正在导出记录，请稍候...',
      background: 'rgba(0, 0, 0, 0.7)'
    });

    try {
      loading.value = true;

      let data;
      if (fetchExportData) {
        ElMessage({ message: '导出大量包含图片的记录所需时间较长，请耐心等待', type: 'info', duration: 5000 });
        data = await fetchExportData('first_image');
      } else {
        data = getRecords();
      }

      if (!data || data.length === 0) {
        loadingInstance.close();
        ElMessage.warning('没有可导出的数据');
        return;
      }

      const baseHeaders = getBaseHeaders();
      const headers = [
        ...baseHeaders,
        { text: '清理前照片', field: '清理前照片', isImage: true },
        { text: '清理后照片', field: '清理后照片', isImage: true }
      ];

      const exportData = data.map(record => {
        const mapped = mapRecord(record);
        const beforePhotos = parsePhotoPath(record.photo_path_before);
        const afterPhotos = parsePhotoPath(record.photo_path_after);
        mapped['清理前照片'] = beforePhotos.length > 0 ? beforePhotos[0] : '';
        mapped['清理后照片'] = afterPhotos.length > 0 ? afterPhotos[0] : '';
        return mapped;
      });

      const baseUrl = window.location.origin;
      const batchSize = fetchExportData ? 200 : 50;

      const { successCount, batchCount } = await batchExport(
        exportData,
        getFileName('first_image'),
        headers,
        batchSize,
        (batchData, fileName, hdrs, onProgress) =>
          exportToExcelWithImages(batchData, fileName, hdrs, baseUrl, onProgress),
        loadingInstance
      );

      loadingInstance.close();
      showResult(successCount, batchCount);
    } catch (error) {
      console.error('导出记录失败:', error);
      ElMessage.error('导出失败: ' + (error.message || '未知错误'));
    } finally {
      loading.value = false;
      ElLoading.service().close();
    }
  };

  /**
   * 导出含全部图片
   */
  const exportWithAllImages = async () => {
    const loadingInstance = ElLoading.service({
      lock: true,
      text: '正在导出记录，请稍候...',
      background: 'rgba(0, 0, 0, 0.7)'
    });

    try {
      ElMessage({ message: '导出大量包含全部图片的记录所需时间较长，请耐心等待', type: 'info', duration: 5000 });
      loading.value = true;

      let data;
      if (fetchExportData) {
        data = await fetchExportData('all_images');
      } else {
        data = getRecords();
      }

      if (!data || data.length === 0) {
        loadingInstance.close();
        ElMessage.warning('没有可导出的数据');
        return;
      }

      const baseHeaders = getBaseHeaders();
      const headers = [...baseHeaders];
      for (let i = 0; i < 5; i++) {
        headers.push({ text: `清理前照片${i + 1}`, field: `清理前照片${i + 1}`, isImage: true });
      }
      for (let i = 0; i < 5; i++) {
        headers.push({ text: `清理后照片${i + 1}`, field: `清理后照片${i + 1}`, isImage: true });
      }

      const exportData = data.map(record => {
        const mapped = mapRecord(record);
        const beforePhotos = parsePhotoPath(record.photo_path_before);
        const afterPhotos = parsePhotoPath(record.photo_path_after);
        for (let i = 0; i < 5; i++) {
          mapped[`清理前照片${i + 1}`] = i < beforePhotos.length ? beforePhotos[i] : '';
        }
        for (let i = 0; i < 5; i++) {
          mapped[`清理后照片${i + 1}`] = i < afterPhotos.length ? afterPhotos[i] : '';
        }
        return mapped;
      });

      const baseUrl = window.location.origin;

      loadingInstance.setText(`准备导出 ${data.length} 条记录的全部照片...`);

      const { successCount, batchCount } = await batchExport(
        exportData,
        getFileName('all_images'),
        headers,
        50,
        (batchData, fileName, hdrs, onProgress) =>
          exportToExcelWithImages(batchData, fileName, hdrs, baseUrl, onProgress),
        loadingInstance
      );

      loadingInstance.close();
      showResult(successCount, batchCount);
    } catch (error) {
      console.error('导出记录失败:', error);
      ElMessage.error('导出失败: ' + (error.message || '未知错误'));
    } finally {
      loading.value = false;
      ElLoading.service().close();
    }
  };

  /**
   * 导出不含图片
   */
  const exportWithoutImages = async () => {
    const loadingInstance = ElLoading.service({
      lock: true,
      text: '正在导出记录，请稍候...',
      background: 'rgba(0, 0, 0, 0.7)'
    });

    try {
      loading.value = true;

      let data;
      if (fetchExportData) {
        data = await fetchExportData('no_images');
      } else {
        data = getRecords();
      }

      if (!data || data.length === 0) {
        loadingInstance.close();
        ElMessage.warning('没有可导出的数据');
        return;
      }

      const baseHeaders = getBaseHeaders();
      const headers = [
        ...baseHeaders,
        { text: '清理前照片', field: '清理前照片' },
        { text: '清理后照片', field: '清理后照片' }
      ];

      const exportData = data.map(record => {
        const mapped = mapRecord(record);
        mapped['清理前照片'] = record.photo_path_before ? '有' : '无';
        mapped['清理后照片'] = record.photo_path_after ? '有' : '无';
        return mapped;
      });

      const { successCount, batchCount } = await batchExport(
        exportData,
        getFileName('no_images'),
        headers,
        1000,
        (batchData, fileName, hdrs) => exportToExcel(batchData, fileName, hdrs),
        loadingInstance
      );

      loadingInstance.close();
      showResult(successCount, batchCount);
    } catch (error) {
      console.error('导出记录失败:', error);
      ElMessage.error('导出失败: ' + (error.message || '未知错误'));
    } finally {
      loading.value = false;
      ElLoading.service().close();
    }
  };

  return {
    exportWithImages,
    exportWithAllImages,
    exportWithoutImages
  };
}
