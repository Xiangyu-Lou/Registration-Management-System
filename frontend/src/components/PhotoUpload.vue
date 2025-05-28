<template>
  <div class="photo-upload-container">
    <el-form-item :label="label" :prop="fieldName">
      <div class="photo-tip">{{ tipText }}</div>
      
      <!-- 大文件警告 -->
      <div class="upload-warning" v-if="showLargeFileWarning">
        <el-alert
          title="上传大文件可能会导致处理时间较长，请耐心等待"
          type="warning"
          :closable="false"
          show-icon
        />
      </div>
      
      <!-- 上传组件 -->
      <el-upload
        class="photo-uploader"
        action="#"
        :auto-upload="false"
        :on-change="handleChange"
        :on-remove="handleRemove"
        :file-list="fileList"
        :limit="maxFiles"
        multiple
        list-type="picture-card"
        :on-preview="handlePreview"
        :before-upload="handleBeforeUpload"
        :accept="acceptTypes"
      >
        <el-icon><plus /></el-icon>
      </el-upload>
    </el-form-item>

    <!-- 上传进度对话框 -->
    <el-dialog
      v-model="showUploadProgress"
      title="正在处理文件"
      width="30%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <div class="upload-progress">
        <p>正在处理文件，请勿关闭页面...</p>
        <el-progress 
          :percentage="uploadPercentage" 
          :format="percentageFormat"
          :status="uploadPercentage === 100 ? 'success' : ''"
        ></el-progress>
        <p class="upload-status">{{ uploadStatus }}</p>
      </div>
    </el-dialog>

    <!-- 图片预览 -->
    <el-image-viewer
      v-if="showViewer"
      :url-list="previewImages"
      :initial-index="previewIndex"
      @close="closeViewer"
    />
  </div>
</template>

<script>
import { ref, watch } from 'vue';
import { ElImageViewer } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { usePhotoUpload } from '../composables/usePhotoUpload';

export default {
  name: 'PhotoUpload',
  components: {
    Plus,
    ElImageViewer
  },
  props: {
    // 字段名称，用于表单验证
    fieldName: {
      type: String,
      required: true
    },
    // 标签文本
    label: {
      type: String,
      required: true
    },
    // 提示文本
    tipText: {
      type: String,
      default: '请上传照片（最多5张）'
    },
    // 文件列表
    modelValue: {
      type: Array,
      default: () => []
    },
    // 最大文件数量
    maxFiles: {
      type: Number,
      default: 5
    },
    // 接受的文件类型
    acceptTypes: {
      type: String,
      default: 'image/jpeg,image/jpg,image/png,image/gif,image/bmp,image/webp,.jpeg,.jpg,.png,.gif,.bmp,.webp'
    },
    // 是否启用压缩
    enableCompression: {
      type: Boolean,
      default: true
    },
    // 压缩选项
    compressionOptions: {
      type: Object,
      default: () => ({
        quality: 0.6,
        maxWidth: 1920,
        maxHeight: 1920
      })
    }
  },
  emits: ['update:modelValue', 'change', 'remove', 'preview'],
  setup(props, { emit }) {
    const {
      showUploadProgress,
      uploadPercentage,
      uploadStatus,
      showLargeFileWarning,
      showViewer,
      previewImages,
      previewIndex,
      handleBeforeUpload,
      checkForLargeFiles,
      updatePreviewImages,
      closeViewer,
      percentageFormat
    } = usePhotoUpload();

    const fileList = ref([...props.modelValue]);

    // 监听外部传入的文件列表变化
    watch(
      () => props.modelValue,
      (newValue) => {
        fileList.value = [...newValue];
      },
      { deep: true }
    );

    // 监听内部文件列表变化
    watch(
      fileList,
      (newValue) => {
        emit('update:modelValue', [...newValue]);
      },
      { deep: true }
    );

    /**
     * 处理文件变更
     */
    const handleChange = async (file, fileListParam) => {
      fileList.value = [...fileListParam];
      
      // 如果启用压缩且文件未处理过
      if (props.enableCompression && file.raw && file.status === 'ready' && !file.processed) {
        try {
          const processedFile = await handleBeforeUpload(file.raw);
          file.processed = true;
          file.raw = processedFile;
        } catch (error) {
          console.error('处理图片时出错:', error);
        }
      }
      
      checkForLargeFiles(fileListParam);
      updatePreviewImages();
      
      emit('change', file, fileListParam);
      return false;
    };

    /**
     * 处理文件移除
     */
    const handleRemove = (file, fileListParam) => {
      fileList.value = fileListParam;
      
      if (!checkForLargeFiles(fileListParam)) {
        showLargeFileWarning.value = false;
      }
      
      updatePreviewImages();
      emit('remove', file, fileListParam);
    };

    /**
     * 处理图片预览
     */
    const handlePreview = (file) => {
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
      
      emit('preview', file);
    };

    return {
      fileList,
      showUploadProgress,
      uploadPercentage,
      uploadStatus,
      showLargeFileWarning,
      showViewer,
      previewImages,
      previewIndex,
      handleChange,
      handleRemove,
      handlePreview,
      handleBeforeUpload,
      closeViewer,
      percentageFormat
    };
  }
};
</script>

<style scoped>
.photo-upload-container {
  width: 100%;
}

.photo-uploader {
  width: 100%;
}

.photo-uploader :deep(.el-upload--picture-card) {
  width: 80px;
  height: 80px;
  line-height: 80px;
}

.photo-uploader :deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 80px;
  height: 80px;
}

.photo-tip {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.upload-warning {
  margin-bottom: 10px;
}

.upload-progress {
  text-align: center;
  padding: 10px;
}

.upload-status {
  margin-top: 10px;
  color: #606266;
  font-size: 14px;
}

/* 响应式设计 */
@media (min-width: 768px) {
  .photo-uploader :deep(.el-upload--picture-card) {
    width: 120px;
    height: 120px;
    line-height: 120px;
  }

  .photo-uploader :deep(.el-upload-list--picture-card .el-upload-list__item) {
    width: 120px;
    height: 120px;
  }
}
</style> 