<template>
  <div class="page-header">
    <div class="header-background" :style="backgroundStyle"></div>
    <div class="header-content">
      <!-- 左侧返回按钮 -->
      <div v-if="showBackButton" class="header-action back-button" @click="handleBack">
        <el-icon><arrow-left /></el-icon> 
        {{ backText }}
      </div>
      <div v-else class="header-spacer"></div>
      
      <!-- 中间标题 -->
      <h1 class="header-title">{{ title }}</h1>
      
      <!-- 右侧操作按钮 -->
      <div v-if="rightActions.length > 0" class="header-actions">
        <div 
          v-for="action in rightActions" 
          :key="action.key"
          class="header-action"
          @click="handleAction(action)"
        >
          <el-icon v-if="action.icon"><component :is="action.icon" /></el-icon>
          {{ action.text }}
        </div>
      </div>
      <div v-else class="header-spacer"></div>
    </div>
  </div>
</template>

<script>
import { ArrowLeft } from '@element-plus/icons-vue';

export default {
  name: 'PageHeader',
  components: {
    ArrowLeft
  },
  props: {
    // 页面标题
    title: {
      type: String,
      required: true
    },
    // 是否显示返回按钮
    showBackButton: {
      type: Boolean,
      default: false
    },
    // 返回按钮文本
    backText: {
      type: String,
      default: '返回'
    },
    // 右侧操作按钮配置
    rightActions: {
      type: Array,
      default: () => []
    },
    // 背景样式类型
    backgroundType: {
      type: String,
      default: 'gradient', // gradient, solid, image
      validator: (value) => ['gradient', 'solid', 'image'].includes(value)
    },
    // 自定义背景样式
    customBackground: {
      type: Object,
      default: () => ({})
    },
    // 主题色
    theme: {
      type: String,
      default: 'blue', // blue, green, purple, orange
      validator: (value) => ['blue', 'green', 'purple', 'orange'].includes(value)
    }
  },
  emits: ['back', 'action'],
  setup(props, { emit }) {
    // 预定义主题样式
    const themeStyles = {
      blue: {
        gradient: 'linear-gradient(135deg, #42a5f5, #1976d2)',
        solid: '#1976d2'
      },
      green: {
        gradient: 'linear-gradient(135deg, #66bb6a, #388e3c)',
        solid: '#388e3c'
      },
      purple: {
        gradient: 'linear-gradient(135deg, #ab47bc, #7b1fa2)',
        solid: '#7b1fa2'
      },
      orange: {
        gradient: 'linear-gradient(135deg, #ffa726, #f57c00)',
        solid: '#f57c00'
      }
    };

    // 计算背景样式
    const backgroundStyle = computed(() => {
      if (Object.keys(props.customBackground).length > 0) {
        return props.customBackground;
      }

      const themeStyle = themeStyles[props.theme];
      
      if (props.backgroundType === 'gradient') {
        return {
          background: themeStyle.gradient
        };
      } else if (props.backgroundType === 'solid') {
        return {
          backgroundColor: themeStyle.solid
        };
      }
      
      return {
        background: themeStyle.gradient
      };
    });

    /**
     * 处理返回按钮点击
     */
    const handleBack = () => {
      emit('back');
    };

    /**
     * 处理右侧操作按钮点击
     */
    const handleAction = (action) => {
      emit('action', action);
    };

    return {
      backgroundStyle,
      handleBack,
      handleAction
    };
  }
};
</script>

<script setup>
import { computed } from 'vue';
</script>

<style scoped>
.page-header {
  position: relative;
  color: white;
  padding: 20px;
  border-radius: 0 0 20px 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  overflow: hidden;
}

.header-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.header-background::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%);
  z-index: 1;
}

.header-content {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  letter-spacing: 1px;
  text-align: center;
  flex: 1;
}

.header-action {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  white-space: nowrap;
  background-color: rgba(255, 255, 255, 0.25);
  padding: 8px 14px;
  border-radius: 8px;
  transition: all 0.3s ease;
  border: 1.5px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  letter-spacing: 0.3px;
}

.header-action:hover {
  background-color: rgba(255, 255, 255, 0.35);
  transform: translateY(-2px);
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.25);
  border-color: rgba(255, 255, 255, 0.8);
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.header-spacer {
  flex: 0 0 auto;
  width: 80px; /* 为了保持布局平衡 */
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    padding: 15px;
    margin-bottom: 15px;
  }
  
  .header-title {
    font-size: 20px;
  }
  
  .header-action {
    padding: 6px 10px;
    font-size: 12px;
  }
  
  .header-spacer {
    width: 60px;
  }
  
  .header-actions {
    gap: 5px;
  }
}

@media (max-width: 480px) {
  .header-content {
    flex-direction: column;
    gap: 10px;
  }
  
  .header-title {
    order: 1;
  }
  
  .back-button {
    order: 0;
    align-self: flex-start;
  }
  
  .header-actions {
    order: 2;
    align-self: flex-end;
  }
  
  .header-spacer {
    display: none;
  }
}
</style> 