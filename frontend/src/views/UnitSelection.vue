<template>
  <div class="unit-selection-container">
    <div class="header">
      <h1>固体废物管理系统</h1>
    </div>
    <div class="content">
      <h2>请选择您的单位</h2>
      <div class="units-grid stagger-in">
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
import auth from '../store/auth';

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
        
        let allUnits = response.data;
        
        // 监督人员只能看到本公司单位
        if (auth.isSupervisor()) {
          const currentCompanyId = auth.getCompanyId();
          this.units = allUnits.filter(unit => 
            unit.company_id === currentCompanyId
          );
          console.log('监督人员过滤后的单位列表:', this.units);
        } else {
          this.units = allUnits;
        }
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
  background-color: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-primary);
  padding: var(--space-4) var(--space-5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.content {
  flex: 1;
  padding: var(--space-8);
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

h2 {
  text-align: center;
  margin-bottom: var(--space-8);
  color: var(--color-text-primary);
}

.units-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-5);
}

.unit-card {
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-xs);
}

.unit-card:hover {
  transform: translateY(-2px);
  border-color: var(--color-accent);
  box-shadow: var(--shadow-sm);
}

.unit-name {
  font-size: 18px;
  font-weight: bold;
  color: var(--color-text-primary);
  text-align: center;
}

.footer {
  background-color: var(--color-bg-secondary);
  padding: var(--space-4);
  text-align: center;
  color: var(--color-text-secondary);
}
</style>
