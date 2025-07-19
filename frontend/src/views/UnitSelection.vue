<template>
  <div class="unit-selection-container">
    <div class="header">
      <h1>固体废物管理系统</h1>
    </div>
    <div class="content">
      <h2>请选择您的单位</h2>
      <div class="units-grid">
        <el-card
          v-for="unit in units"
          :key="unit.id"
          class="unit-card"
          shadow="hover"
          @click="selectUnit(unit)"
        >
          <div class="unit-name">{{ unit.name }}</div>
        </el-card>
      </div>
    </div>
    <div class="footer">
      <p>&copy; 2025 固体废物管理系统</p>
    </div>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus';
import httpService from '../config/httpService';
import api from '../config/api';

export default {
  name: 'UnitSelection',
  data() {
    return {
      units: [],
      loading: false
    };
  },
  created() {
    this.fetchUnits();
  },
  methods: {
    async fetchUnits() {
      this.loading = true;
      try {
        console.log('正在获取单位列表...');
        const response = await httpService.get(api.endpoints.units);
        console.log('获取单位列表成功:', response.data);
        this.units = response.data;
      } catch (error) {
        console.error('获取单位列表失败:', error);
        ElMessage.error('获取单位列表失败');
      } finally {
        this.loading = false;
      }
    },
    selectUnit(unit) {
      this.$router.push({ name: 'WasteForm', params: { id: unit.id } });
    }
  }
};
</script>

<style scoped>
.unit-selection-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  background-color: #409EFF;
  color: white;
  padding: 20px;
  text-align: center;
}

.content {
  flex: 1;
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.units-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.unit-card {
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: transform 0.3s;
}

.unit-card:hover {
  transform: translateY(-5px);
}

.unit-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  text-align: center;
}

.footer {
  background-color: #f5f5f5;
  padding: 15px;
  text-align: center;
  color: #666;
}
</style>
