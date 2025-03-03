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

        <el-form-item label="收集日期">
          <el-date-picker
            v-model="form.collectionDate"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="收集时间">
          <el-time-picker
            v-model="form.collectionTime"
            format="HH:mm"
            placeholder="选择时间"
            value-format="HH:mm"
            style="width: 100%"
          >
            <template #prefix>
              <el-icon><clock /></el-icon>
            </template>
          </el-time-picker>
          <!-- <div class="time-tip">只需选择小时和分钟</div> -->
        </el-form-item>

        <el-form-item label="收集数量(吨)" prop="quantity">
          <el-input-number 
            v-model="form.quantity" 
            :min="0" 
            :precision="3" 
            :step="0.001" 
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="现场照片" prop="photos">
          <el-upload
            class="waste-photo-uploader"
            action="#"
            :auto-upload="false"
            :on-change="handlePhotoChange"
            :on-remove="handlePhotoRemove"
            :file-list="photoList"
            :limit="10"
            multiple
            list-type="picture-card"
            :on-preview="handlePictureCardPreview"
            :before-upload="handleBeforeUpload"
          >
            <el-icon><plus /></el-icon>
          </el-upload>
          <div class="photo-tip">请上传废物现场照片（最多10张）</div>
          
          <!-- 添加独立的图片预览组件 -->
          <el-image-viewer
            v-if="showViewer"
            :url-list="previewImages"
            :initial-index="previewIndex"
            @close="closeViewer"
          />
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
import { ElMessage, ElImageViewer } from 'element-plus';
import httpService from '../config/httpService';
import apiConfig from '../config/api';
import { ArrowLeft, Plus, Clock } from '@element-plus/icons-vue';
import auth from '../store/auth';

export default {
  name: 'EditRecordView',
  components: {
    ArrowLeft,
    Plus,
    Clock,
    ElImageViewer
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
    const photoList = ref([]);
    const photoFiles = ref([]);
    const existingPhotoPaths = ref([]);
    const previewImages = ref([]);
    const showViewer = ref(false);
    const previewIndex = ref(0);
    const createdAt = ref('');
    
    // 是否为新增记录
    const isNew = computed(() => !route.params.id);
    
    // 是否为超级管理员
    const isSuperAdmin = computed(() => {
      return auth.state.isLoggedIn && auth.state.user.role_id === 3;
    });
    
    // 表单数据
    const form = reactive({
      unitId: '',
      wasteTypeId: '',
      location: '',
      collectionDate: '',
      collectionTime: '',
      quantity: 0,
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
      collectionDate: [
        { required: false }
      ],
      collectionTime: [
        { required: false }
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
        const response = await httpService.get(apiConfig.endpoints.units);
        units.value = response.data;
      } catch (error) {
        console.error('获取单位列表失败:', error);
        ElMessage.error('获取单位列表失败');
      }
    };

    // 获取单位名称
    const fetchUnitName = async (unitId) => {
      try {
        const response = await httpService.get(apiConfig.endpoints.units);
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
        const response = await httpService.get(apiConfig.endpoints.wasteTypes);
        wasteTypes.value = response.data;
      } catch (error) {
        console.error('获取废物类型失败:', error);
        ElMessage.error('获取废物类型失败');
      }
    };

    // 获取记录详情
    const fetchRecordDetails = async (recordId) => {
      loading.value = true;
      try {
        const response = await httpService.get(`${apiConfig.endpoints.wasteRecords}/detail/${recordId}`);
        const record = response.data;
        
        // 填充表单数据
        form.unitId = record.unit_id;
        form.wasteTypeId = record.waste_type_id;
        form.location = record.location;
        form.recordId = recordId; // 设置记录ID
        
        // 处理收集时间
        if (record.collection_start_time) {
          const dateTime = new Date(record.collection_start_time);
          form.collectionDate = dateTime.toISOString().slice(0, 10);
          form.collectionTime = dateTime.toTimeString().slice(0, 5);
        }
        
        form.quantity = record.quantity;
        
        // 处理照片
        if (record.photo_path) {
          // 解析JSON格式的照片路径
          try {
            const photoPaths = JSON.parse(record.photo_path);
            console.log('解析到的照片路径:', photoPaths);
            
            // 设置预览图片
            previewImages.value = photoPaths.map(path => `${apiConfig.baseURL}${path}`);
            
            // 设置已有照片路径
            existingPhotoPaths.value = photoPaths;
            
            // 设置上传组件的文件列表，使现有照片能显示在上传组件中
            photoList.value = photoPaths.map((path, index) => {
              const url = `${apiConfig.baseURL}${path}`;
              console.log(`照片${index + 1}的URL:`, url);
              return {
                name: `现有照片${index + 1}`,
                url: url,
                uid: `existing-${index}`,
                status: 'success' // 添加状态，表示已上传成功
              };
            });
            
            console.log('设置的photoList:', photoList.value);
          } catch (error) {
            console.error('解析照片路径失败:', error);
            previewImages.value = [];
            existingPhotoPaths.value = [];
            photoList.value = [];
          }
        }
        
        // 获取单位名称
        unitName.value = record.unit_name;
        
        // 设置创建时间
        createdAt.value = record.created_at;
        
      } catch (error) {
        console.error('获取记录详情失败:', error);
        ElMessage.error('获取记录详情失败');
      } finally {
        loading.value = false;
      }
    };

    // 处理上传前的文件检查
    const handleBeforeUpload = (file) => {
      console.log('上传前处理文件:', file);
      
      // 确保文件对象有唯一的uid
      if (!file.uid) {
        file.uid = Date.now() + '-' + Math.random().toString(36).substr(2, 10);
        console.log('为文件分配新的uid:', file.uid);
      }
      
      return true; // 允许上传
    };

    // 处理照片变更
    const handlePhotoChange = (file, fileList) => {
      console.log('照片变更:', file, fileList);
      
      // 更新photoFiles，只包含新上传的文件
      photoFiles.value = fileList
        .filter(f => f.raw) // 只处理新上传的文件
        .map(f => f.raw);
      
      // 更新existingPhotoPaths，只保留仍在fileList中的现有照片
      if (!isNew.value) {
        const existingFileUids = fileList
          .filter(f => f.uid && typeof f.uid === 'string' && f.uid.startsWith('existing-'))
          .map(f => f.uid);
        
        // 保留仍在fileList中的现有照片
        existingPhotoPaths.value = existingPhotoPaths.value.filter((_, index) => {
          return existingFileUids.includes(`existing-${index}`);
        });
      }
      
      // 更新预览图片列表
      updatePreviewImages(fileList);
      
      return false; // 阻止自动上传
    };

    // 处理照片移除
    const handlePhotoRemove = (file, fileList) => {
      console.log('照片移除:', file, fileList);
      
      // 如果移除的是现有照片
      if (file.uid && typeof file.uid === 'string' && file.uid.startsWith('existing-')) {
        const index = parseInt(file.uid.replace('existing-', ''));
        // 从existingPhotoPaths中移除
        existingPhotoPaths.value = existingPhotoPaths.value.filter((_, i) => i !== index);
      }
      
      // 更新photoFiles，只包含新上传的文件
      photoFiles.value = fileList
        .filter(f => f.raw)
        .map(f => f.raw);
      
      // 更新预览图片列表
      updatePreviewImages(fileList);
    };

    // 更新预览图片列表
    const updatePreviewImages = (fileList) => {
      console.log('更新预览图片列表:', fileList);
      
      previewImages.value = fileList.map(file => {
        if (file.url) {
          return file.url;
        } else if (file.raw) {
          return URL.createObjectURL(file.raw);
        } else if (file instanceof File) {
          return URL.createObjectURL(file);
        }
        return '';
      }).filter(url => url);
      
      console.log('预览图片列表:', previewImages.value);
    };

    // 处理图片预览
    const handlePictureCardPreview = (file) => {
      // 找到当前图片在预览列表中的索引
      const index = previewImages.value.findIndex(url => {
        return url === file.url || (file.raw && url === URL.createObjectURL(file.raw));
      });
      
      if (index !== -1) {
        previewIndex.value = index;
      } else {
        previewIndex.value = 0;
      }
      
      // 显示图片预览器
      showViewer.value = true;
    };
    
    // 关闭图片预览
    const closeViewer = () => {
      showViewer.value = false;
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
            
            // 组合日期和时间，如果有的话
            if (form.collectionDate && form.collectionTime) {
              const combinedDateTime = `${form.collectionDate} ${form.collectionTime}:00`;
              formData.append('collectionStartTime', combinedDateTime);
            }
            formData.append('quantity', form.quantity);
            formData.append('creatorId', form.creatorId);
            
            // 添加多张照片
            if (photoFiles.value && photoFiles.value.length > 0) {
              photoFiles.value.forEach(file => {
                if (file) {
                  formData.append('photos', file);
                }
              });
            }
            
            // 添加现有照片路径（用于更新时保留未更改的照片）
            if (!isNew.value && existingPhotoPaths.value.length > 0) {
              formData.append('existingPhotoPaths', JSON.stringify(existingPhotoPaths.value));
            }
            
            if (isNew.value) {
              // 新增记录
              await httpService.postForm(apiConfig.endpoints.wasteRecords, formData);
              ElMessage.success('废物记录添加成功');
            } else {
              // 更新记录 - 使用PUT方法
              await httpService.putForm(`${apiConfig.endpoints.wasteRecords}/${form.recordId}`, formData);
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
      previewImages,
      showViewer,
      previewIndex,
      isNew,
      isSuperAdmin,
      handlePhotoChange,
      handlePhotoRemove,
      handlePictureCardPreview,
      handleBeforeUpload,
      closeViewer,
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

.photo-tip, .time-tip {
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

<style>
/* 修复Element Plus图片预览组件的z-index问题 */
.el-image-viewer__wrapper {
  z-index: 2147483647 !important; /* 使用最大可能的z-index值 */
  position: fixed !important;
}

/* 确保图片预览的遮罩层也在最上层 */
.el-image-viewer__mask {
  z-index: 2147483646 !important;
  position: fixed !important;
}

/* 确保图片预览的操作按钮在最上层 */
.el-image-viewer__btn {
  z-index: 2147483647 !important;
  position: fixed !important;
}

/* 确保图片预览的关闭按钮在最上层 */
.el-image-viewer__close {
  z-index: 2147483647 !important;
  position: fixed !important;
}

/* 确保图片预览的图片在最上层 */
.el-image-viewer__img {
  z-index: 2147483646 !important;
  position: relative !important;
}

/* 确保图片预览的操作栏在最上层 */
.el-image-viewer__actions {
  z-index: 2147483647 !important;
  position: fixed !important;
}

/* 确保图片预览的缩放按钮在最上层 */
.el-image-viewer__actions__inner {
  z-index: 2147483647 !important;
  position: relative !important;
}
</style>
