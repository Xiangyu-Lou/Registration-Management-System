// 通用组件导出文件
import CommonDataTable from './CommonDataTable.vue';
import CommonFilter from './CommonFilter.vue';
import CommonFormDialog from './CommonFormDialog.vue';
import ImagePreview from './ImagePreview.vue';
import PhotoCell from './PhotoCell.vue';

// 导出所有通用组件
export {
  CommonDataTable,
  CommonFilter,
  CommonFormDialog,
  ImagePreview,
  PhotoCell
};

// 默认导出（如果需要批量注册组件）
export default {
  CommonDataTable,
  CommonFilter,
  CommonFormDialog,
  ImagePreview,
  PhotoCell
};

// 组件安装函数（可选，用于全局注册）
export const install = (app) => {
  app.component('CommonDataTable', CommonDataTable);
  app.component('CommonFilter', CommonFilter);
  app.component('CommonFormDialog', CommonFormDialog);
  app.component('ImagePreview', ImagePreview);
  app.component('PhotoCell', PhotoCell);
}; 