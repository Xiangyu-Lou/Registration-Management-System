<template>
  <div class="image-preview-container">
    <!-- 缩略图网格 -->
    <div v-if="images.length > 0" class="image-grid" :class="{ 'single-image': images.length === 1 }">
      <div
        v-for="(image, index) in images"
        :key="index"
        class="image-item"
        @click="openViewer(index)"
      >
        <el-image
          :src="getImageUrl(image)"
          :alt="`图片 ${index + 1}`"
          class="thumbnail"
          fit="cover"
          :loading="loading"
          lazy
        >
          <template #placeholder>
            <div class="image-loading">
              <el-icon class="is-loading"><loading /></el-icon>
              <span>加载中...</span>
            </div>
          </template>
          <template #error>
            <div class="image-error">
              <el-icon><picture-filled /></el-icon>
              <span>加载失败</span>
            </div>
          </template>
        </el-image>
        
        <!-- 图片遮罩层 -->
        <div class="image-overlay">
          <div class="overlay-actions">
            <el-icon class="action-icon"><zoom-in /></el-icon>
            <span v-if="showIndex" class="image-index">{{ index + 1 }}/{{ images.length }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <el-icon><picture-icon /></el-icon>
      <span>{{ emptyText }}</span>
    </div>

    <!-- 图片查看器 -->
    <el-image-viewer
      v-if="showViewer"
      :url-list="imageUrls"
      :initial-index="currentIndex"
      :hide-on-click-modal="hideOnClickModal"
      :close-on-press-escape="closeOnPressEscape"
      @close="closeViewer"
    />
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { ZoomIn, Picture as PictureIcon, PictureFilled, Loading } from '@element-plus/icons-vue';

export default {
  name: 'ImagePreview',
  components: {
    ZoomIn,
    PictureIcon,
    PictureFilled,
    Loading
  },
  props: {
    // 图片数据
    images: {
      type: Array,
      default: () => []
    },
    baseUrl: {
      type: String,
      default: ''
    },
    
    // 显示配置
    maxCount: {
      type: Number,
      default: 0 // 0表示不限制
    },
    showIndex: {
      type: Boolean,
      default: true
    },
    emptyText: {
      type: String,
      default: '暂无图片'
    },
    loading: {
      type: String,
      default: 'lazy' // lazy, eager
    },
    
    // 查看器配置
    hideOnClickModal: {
      type: Boolean,
      default: true
    },
    closeOnPressEscape: {
      type: Boolean,
      default: true
    },
    
    // 布局配置
    gridCols: {
      type: Number,
      default: 3
    },
    imageSize: {
      type: String,
      default: '120px'
    }
  },
  emits: ['preview', 'error'],
  setup(props, { emit }) {
    const showViewer = ref(false);
    const currentIndex = ref(0);

    // 处理图片数据
    const processedImages = computed(() => {
      if (props.maxCount > 0) {
        return props.images.slice(0, props.maxCount);
      }
      return props.images;
    });

    // 获取图片URL
    const getImageUrl = (image) => {
      if (typeof image === 'string') {
        // 如果是字符串，直接使用
        return image.startsWith('http') ? image : `${props.baseUrl}${image}`;
      } else if (typeof image === 'object' && image.url) {
        // 如果是对象且有url属性
        return image.url.startsWith('http') ? image.url : `${props.baseUrl}${image.url}`;
      } else if (typeof image === 'object' && image.src) {
        // 兼容src属性
        return image.src.startsWith('http') ? image.src : `${props.baseUrl}${image.src}`;
      }
      return image;
    };

    // 获取所有图片URL用于查看器
    const imageUrls = computed(() => {
      return processedImages.value.map(image => getImageUrl(image));
    });

    // 打开图片查看器
    const openViewer = (index) => {
      currentIndex.value = index;
      showViewer.value = true;
      emit('preview', { index, image: processedImages.value[index] });
    };

    // 关闭图片查看器
    const closeViewer = () => {
      showViewer.value = false;
    };

    return {
      showViewer,
      currentIndex,
      processedImages,
      imageUrls,
      getImageUrl,
      openViewer,
      closeViewer
    };
  }
};
</script>

<style scoped>
.image-preview-container {
  width: 100%;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(v-bind(gridCols), 1fr);
  gap: 8px;
  width: 100%;
}

.image-grid.single-image {
  grid-template-columns: 1fr;
  max-width: v-bind(imageSize);
}

.image-item {
  position: relative;
  width: v-bind(imageSize);
  height: v-bind(imageSize);
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e4e7ed;
}

.image-item:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.thumbnail {
  width: 100%;
  height: 100%;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-item:hover .image-overlay {
  opacity: 1;
}

.overlay-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: white;
}

.action-icon {
  font-size: 24px;
}

.image-index {
  font-size: 12px;
  background: rgba(0, 0, 0, 0.6);
  padding: 2px 6px;
  border-radius: 10px;
}

.image-loading,
.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;
  color: #909399;
  font-size: 12px;
}

.image-loading .el-icon,
.image-error .el-icon {
  font-size: 32px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 20px;
  color: #c0c4cc;
  font-size: 14px;
}

.empty-state .el-icon {
  font-size: 48px;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .image-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }
  
  .image-item {
    width: 100px;
    height: 100px;
  }
}

@media (max-width: 480px) {
  .image-grid {
    grid-template-columns: repeat(1, 1fr);
  }
  
  .image-item {
    width: 120px;
    height: 120px;
    margin: 0 auto;
  }
}
</style> 