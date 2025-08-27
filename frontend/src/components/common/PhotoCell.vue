<template>
  <div v-if="photoPath" class="photo-preview">
    <div
      v-for="(path, index) in parsedPaths"
      :key="index"
      class="photo-thumbnail-container"
      @click="$emit('preview', parsedPaths, index)"
    >
      <el-image
        style="width: 50px; height: 50px; margin: 0 auto;"
        :src="`${baseUrl}${path}`"
        fit="cover"
      ></el-image>
    </div>
    <div v-if="parsedPaths.length > 1" class="photo-count">
      {{ parsedPaths.length }}张
    </div>
  </div>
  <span v-else>无</span>
</template>

<script>
import { computed } from 'vue';
import { parsePhotoPath } from '../../utils/commonUtils';

export default {
  name: 'PhotoCell',
  props: {
    photoPath: {
      type: String,
      default: ''
    },
    baseUrl: {
      type: String,
      required: true
    }
  },
  emits: ['preview'],
  setup(props) {
    const parsedPaths = computed(() => parsePhotoPath(props.photoPath));
    return { parsedPaths };
  }
};
</script>

<style scoped>
.photo-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
  align-items: center;
  position: relative;
}

.photo-thumbnail-container {
  cursor: pointer;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #ddd;
}

.photo-count {
  position: absolute;
  bottom: 2px;
  right: 2px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 1px 4px;
  border-radius: 2px;
  font-size: 10px;
}
</style>
