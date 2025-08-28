import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import httpService from '../config/httpService';
import apiConfig from '../config/api';
import auth from '../store/auth';

export const locationMap = {
  '桓台': ['金家接转站', '金17-1注采站', '金17-2注采站', '金6金9项目组', '金8注采站', '其他'],
  '潍北': ['潍北联合站', '昌79注采站', '昌3注采站', '疃3注采站', '昌15注采站', '其他'],
  '高青': ['高青联合站', '樊107注采站', '樊14注采站', '高21注采站', '高54注采站', '其他'],
  '牛庄': ['牛25集输站', '牛25注采站', '营13注采站', '史112注采站', '其他'],
  '金角': ['长堤注采站', '桩23注采站', '其他'],
  '信远': ['河125注采站', '河122注采站', '永551注采站', '其他'],
  '滨博': ['樊142注采站', '樊142-2-12注采站', '樊162注采站', '樊页1井组', '滨博接转站', '其他'],
  '无棣': ['车41注采站', '车142注采站', '车40注采站', '车408注采站', '车274注采站', '车1接转站', '东风港联合站', '其他'],
  '河口': ['沾14东注采站', '沾14西注采站', '渤南注采站', '大北注采站', '沾5注采站', '太平接转站', '沾5接转站', '其他'],
  '胜兴': ['博兴注采站', '其他'],
  '胜科管理区': ['采油一站', '其他'],
  '其他': ['其他']
};

export const processOptions = ['作业现场', '清罐清理', '报废清理', '管线刺漏', '历史遗留', '日常维护', '封井退出', '其他'];

export function useFormData() {
  const wasteTypes = ref([]);
  const unitName = ref('');
  const locationOptions = ref([]);

  const fetchWasteTypes = async () => {
    try {
      const response = await httpService.get(apiConfig.endpoints.wasteTypes);
      wasteTypes.value = response.data;
    } catch (error) {
      console.error('获取废物类型失败:', error);
      ElMessage.error('获取废物类型失败');
    }
  };

  const updateLocationOptions = (name) => {
    if (locationMap[name]) {
      locationOptions.value = locationMap[name];
    } else {
      locationOptions.value = [];
      console.warn(`未找到管理区 "${name}" 的地点选项`);
    }
  };

  const fetchUnitName = async (unitId) => {
    try {
      const response = await httpService.get(apiConfig.endpoints.units);
      const unit = response.data.find(u => u.id === parseInt(unitId));
      if (unit) {
        unitName.value = unit.name;
        updateLocationOptions(unit.name);
      }
    } catch (error) {
      console.error('获取单位信息失败:', error);
    }
  };

  const fetchUnitNameWithAuth = async (unitId) => {
    try {
      const response = await httpService.get(apiConfig.endpoints.units);
      let allUnits = response.data;

      if (auth.isSupervisor()) {
        const currentCompanyId = auth.getCompanyId();
        allUnits = allUnits.filter(unit => unit.company_id === currentCompanyId);
      }

      const unit = allUnits.find(u => u.id === parseInt(unitId));
      if (unit) {
        unitName.value = unit.name;
        updateLocationOptions(unit.name);
        return unit;
      } else if (auth.isSupervisor()) {
        return null; // caller handles redirect
      }
    } catch (error) {
      console.error('获取单位信息失败:', error);
      ElMessage.error('获取单位信息失败');
    }
    return null;
  };

  return {
    wasteTypes,
    unitName,
    locationOptions,
    fetchWasteTypes,
    fetchUnitName,
    fetchUnitNameWithAuth,
    updateLocationOptions
  };
}
