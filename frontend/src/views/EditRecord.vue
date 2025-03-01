<template>
  <div class="edit-record-container">
    <div class="header">
      <div class="back-button" @click="goBack">
        <el-icon><arrow-left /></el-icon> 返回
      </div>
      <h1>{{ isNew ? '新增废物记录' : '编辑废物记录' }}</h1>
      <div></div>
    </div>

    <div class="content">
      <div class="form-header">
        <h2>{{ unitName }}</h2>
      </div>

      <el-form 
        ref="recordForm" 
        :model="form" 
        :rules="rules" 
        label-width="120px"
        class="record-form"
        v-loading="loading"
      >
        <!-- 如果是超级管理员且是新增记录，显示单位选择 -->
        <el-form-item label="单位" prop="unitId" v-if="isSuperAdmin && isNew">
          <el-select v-model="form.unitId" placeholder="请选择单位" style="width: 100%">
            <el-option 
              v-for="unit in units" 
              :key="unit.id" 
              :label="unit.name" 
              :value="unit.id" 
            />
          </el-select>
        </el-form-item>

        <el-form-item label="废物类型" prop="wasteTypeId">
          <el-select v-model="form.wasteTypeId" placeholder="请选择废物类型" style="width: 100%">
            <el-option 
              v-for="type in wasteTypes" 
              :key="type.id" 
              :label="type.name" 
              :value="type.id" 
            />
          </el-select>
        </el-form-item>

        <el-form-item label="产生地点" prop="location">
          <el-input v-model="form.location" placeholder="请输入废物产生地点" />
        </el-form-item>

        <el-form-item label="收集开始时间" prop="collectionStartTime">
          <el-date-picker
            v-model="form.collectionStartTime"
            type="datetime"
            placeholder="选择收集开始时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="收集数量(kg)" prop="quantity">
          <el-input-number 
            v-model="form.quantity" 
            :min="0.01" 
            :precision="2" 
            :step="0.1" 
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="现场照片" prop="photo">
          <el-upload
            class="waste-photo-uploader"
            action="#"
            :auto-upload="false"
            :on-change="handlePhotoChange"
            :limit="1"
            list-type="picture-card"
            :file-list="photoList"
          >
            <el-icon><plus /></el-icon>
          </el-upload>
          <div class="photo-tip">请上传废物现场照片</div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="submitting">保存</el-button>
          <el-button @click="goBack">取消</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="footer">
      <p>&copy; 2025 危险废物管理系统</p>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import axios from 'axios';
import { ArrowLeft, Plus } from '@element-plus/icons-vue';
import auth from '../store/auth';

export default {
  name: 'EditRecordView',
  components: {
    ArrowLeft,
    Plus
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const recordForm = ref(null);
    const loading = ref(false);
    const submitting = ref(false);
    const unitName = ref('');
    const wasteTypes = ref([]);
    const units = ref([]);
    const photoFile = ref(null);
    const photoList = ref([]);

    // 确定是新增还是编辑
    const isNew = computed(() => !route.params.id || route.params.id === 'new');
    
    // 是否为超级管理员
    const isSuperAdmin = computed(() => {
      return auth.state.isLoggedIn && auth.state.user.role_id === 3;
    });

    const form = reactive({
      unitId: '',
      wasteTypeId: '',
      location: '',
      collectionStartTime: '',
      quantity: 1,
      recordId: null,
      creatorId: auth.state.user?.id || null
    });

    const rules = {
      unitId: [
        { required: true, message: '请选择单位', trigger: 'change' }
      ],
      wasteTypeId: [
        { required: true, message: '请选择废物类型', trigger: 'change' }
      ],
      location: [
        { required: true, message: '请输入废物产生地点', trigger: 'blur' }
      ],
      collectionStartTime: [
        { required: true, message: '请选择收集开始时间', trigger: 'change' }
      ],
      quantity: [
        { required: true, message: '请输入收集数量', trigger: 'change' }
      ]
    };

    onMounted(async () => {
      loading.value = true;
      
      try {
        // 获取废物类型
        await fetchWasteTypes();
        
        // 如果是超级管理员，获取所有单位
        if (isSuperAdmin.value) {
          await fetchUnits();
        }
        
        // 如果有记录ID，则获取记录详情
        if (!isNew.value) {
          await fetchRecordDetails(route.params.id);
        } else {
          // 新增记录默认使用当前用户的单位（非超级管理员）
          if (!isSuperAdmin.value && auth.state.user) {
            form.unitId = auth.state.user.unit_id;
            await fetchUnitName(form.unitId);
          }
        }
      } catch (error) {
        console.error('初始化数据失败:', error);
        ElMessage.error('加载数据失败，请刷新重试');
      } finally {
        loading.value = false;
      }
    });

    // 获取单位列表
    const fetchUnits = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/units');
        units.value = response.data;
      } catch (error) {
        console.error('获取单位列表失败:', error);
        ElMessage.error('获取单位列表失败');
      }
    };

    // 获取单位名称
    const fetchUnitName = async (unitId) => {
      try {
        const response = await axios.get(`http://localhost:3000/api/units`);
        const unit = response.data.find(u => u.id === parseInt(unitId));
        if (unit) {
          unitName.value = unit.name;
        }
      } catch (error) {
        console.error('获取单位信息失败:', error);
      }
    };

    // 获取废物类型
    const fetchWasteTypes = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/waste-types');
        wasteTypes.value = response.data;
      } catch (error) {
        console.error('获取废物类型失败:', error);
        ElMessage.error('获取废物类型失败');
      }
    };

    // 获取记录详情
    const fetchRecordDetails = async (recordId) => {
      try {
        const response = await axios.get(`http://localhost:3000/api/waste-records/detail/${recordId}`);
        const record = response.data;
        
        // 更新表单数据
        form.unitId = record.unit_id;
        form.wasteTypeId = record.waste_type_id;
        form.location = record.location;
        form.collectionStartTime = record.collection_start_time;
        form.quantity = record.quantity;
        form.recordId = record.id;
        
        // 设置单位名称
        unitName.value = record.unit_name;
        
        // 设置图片预览
        if (record.photo_path) {
          photoList.value = [
            {
              name: '现场照片',
              url: `http://localhost:3000${record.photo_path}`
            }
          ];
        }
      } catch (error) {
        console.error('获取记录详情失败:', error);
        ElMessage.error('获取记录详情失败');
      }
    };

    // 处理照片变更
    const handlePhotoChange = (file) => {
      photoFile.value = file.raw;
    };

    // 提交表单
    const submitForm = () => {
      recordForm.value.validate(async (valid) => {
        if (valid) {
          submitting.value = true;
          
          try {
            const formData = new FormData();
            formData.append('unitId', form.unitId);
            formData.append('wasteTypeId', form.wasteTypeId);
            formData.append('location', form.location);
            formData.append('collectionStartTime', form.collectionStartTime);
            formData.append('quantity', form.quantity);
            formData.append('creatorId', form.creatorId);
            
            if (photoFile.value) {
              formData.append('photo', photoFile.value);
            }
            
            if (isNew.value) {
              // 新增记录
              await axios.post('http://localhost:3000/api/waste-records', formData, {
                headers: {
                  'Content-Type': 'multipart/form-data'
                }
              });
              ElMessage.success('废物记录添加成功');
            } else {
              // 更新记录
              await axios.put(`http://localhost:3000/api/waste-records/${form.recordId}`, formData, {
                headers: {
                  'Content-Type': 'multipart/form-data'
                }
              });
              ElMessage.success('废物记录更新成功');
            }
            
            // 返回记录列表
            goBack();
          } catch (error) {
            console.error('提交表单失败:', error);
            ElMessage.error('保存失败，请稍后再试');
          } finally {
            submitting.value = false;
          }
        } else {
          ElMessage.warning('请完成必填项');
        }
      });
    };

    // 返回上一页
    const goBack = () => {
      if (isSuperAdmin.value) {
        router.push('/admin-records');
      } else {
        router.push({ 
          name: 'RecordsList', 
          params: { unitId: auth.state.user.unit_id } 
        });
      }
    };

    return {
      form,
      rules,
      recordForm,
      loading,
      submitting,
      unitName,
      wasteTypes,
      units,
      photoList,
      isNew,
      isSuperAdmin,
      handlePhotoChange,
      submitForm,
      goBack
    };
  }
};
</script>

<style scoped>
.edit-record-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  background-color: #409EFF;
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.back-button {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
}

.content {
  flex: 1;
  padding: 30px;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.form-header {
  text-align: center;
  margin-bottom: 20px;
}

.form-header h2 {
  color: #333;
  border-bottom: 2px solid #409EFF;
  display: inline-block;
  padding-bottom: 5px;
}

.record-form {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.waste-photo-uploader {
  width: 100%;
}

.photo-tip {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

.footer {
  background-color: #f5f5f5;
  padding: 15px;
  text-align: center;
  color: #666;
}
</style>
