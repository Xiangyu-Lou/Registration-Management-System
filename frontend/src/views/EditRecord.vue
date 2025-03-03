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

        <el-form-item label="现场照片（收集前）" prop="photosBefore">
          <el-upload
            class="waste-photo-uploader"
            action="#"
            :auto-upload="false"
            :on-change="handlePhotoBeforeChange"
            :on-remove="handlePhotoBeforeRemove"
            :file-list="photoBeforeList"
            :limit="10"
            multiple
            list-type="picture-card"
            :on-preview="handlePictureCardPreview"
            :before-upload="handleBeforeUpload"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/bmp,image/webp,.jpeg,.jpg,.png,.gif,.bmp,.webp"
          >
            <el-icon><plus /></el-icon>
          </el-upload>
          <div class="photo-tip">请上传废物收集前的现场照片（最多10张）</div>
        </el-form-item>

        <el-form-item label="现场照片（收集后）" prop="photosAfter">
          <el-upload
            class="waste-photo-uploader"
            action="#"
            :auto-upload="false"
            :on-change="handlePhotoAfterChange"
            :on-remove="handlePhotoAfterRemove"
            :file-list="photoAfterList"
            :limit="10"
            multiple
            list-type="picture-card"
            :on-preview="handlePictureCardPreview"
            :before-upload="handleBeforeUpload"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/bmp,image/webp,.jpeg,.jpg,.png,.gif,.bmp,.webp"
          >
            <el-icon><plus /></el-icon>
          </el-upload>
          <div class="photo-tip">请上传废物收集后的现场照片（最多10张）</div>
          
          <!-- 添加独立的图片预览组件 -->
          <el-image-viewer
            v-if="showViewer"
            :url-list="previewImages"
            :initial-index="previewIndex"
            @close="closeViewer"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="loading">保存</el-button>
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
    const photoBeforeList = ref([]);
    const photoAfterList = ref([]);
    const photoBeforeFiles = ref([]);
    const photoAfterFiles = ref([]);
    const existingPhotosPathsBefore = ref([]);
    const existingPhotosPathsAfter = ref([]);
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
          await fetchRecordDetails();
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
    const fetchRecordDetails = async () => {
      try {
        loading.value = true;
        const response = await httpService.get(`${apiConfig.endpoints.wasteRecords}/detail/${route.params.id}`);
        
        const record = response.data;
        console.log('获取到的记录详情:', record);
        
        form.unitId = record.unit_id;
        form.wasteTypeId = record.waste_type_id;
        form.location = record.location;
        form.recordId = record.id;
        
        // 处理收集时间
        if (record.collection_start_time) {
          const dateTime = new Date(record.collection_start_time);
          form.collectionDate = dateTime.toISOString().slice(0, 10);
          form.collectionTime = dateTime.toTimeString().slice(0, 5);
        }
        
        form.quantity = record.quantity;
        
        // 处理照片路径
        try {
          // 处理收集前照片
          let photoPathsBefore = [];
          if (record.photo_path_before) {
            photoPathsBefore = JSON.parse(record.photo_path_before);
            console.log('解析的收集前照片路径:', photoPathsBefore);
          }
          
          // 处理收集后照片
          let photoPathsAfter = [];
          if (record.photo_path_after) {
            photoPathsAfter = JSON.parse(record.photo_path_after);
            console.log('解析的收集后照片路径:', photoPathsAfter);
          }
          
          // 设置已有照片路径
          existingPhotosPathsBefore.value = photoPathsBefore;
          existingPhotosPathsAfter.value = photoPathsAfter;
          
          // 设置上传组件的文件列表，使现有照片能显示在上传组件中
          photoBeforeList.value = photoPathsBefore.map((path, index) => {
            const url = `${apiConfig.baseURL}${path}`;
            console.log(`收集前照片${index + 1}的URL:`, url);
            return {
              name: `收集前照片${index + 1}`,
              url: url,
              uid: `before-${index}`,
              status: 'success' // 添加状态，表示已上传成功
            };
          });
          
          photoAfterList.value = photoPathsAfter.map((path, index) => {
            const url = `${apiConfig.baseURL}${path}`;
            console.log(`收集后照片${index + 1}的URL:`, url);
            return {
              name: `收集后照片${index + 1}`,
              url: url,
              uid: `after-${index}`,
              status: 'success' // 添加状态，表示已上传成功
            };
          });
          
          // 更新预览图片
          updatePreviewImages([...photoBeforeList.value, ...photoAfterList.value]);
        } catch (error) {
          console.error('解析照片路径失败:', error);
          previewImages.value = [];
          existingPhotosPathsBefore.value = [];
          existingPhotosPathsAfter.value = [];
          photoBeforeList.value = [];
          photoAfterList.value = [];
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

    // 处理上传前的文件处理
    const handleBeforeUpload = (file) => {
      // 检查文件类型是否为图片
      const acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
      const isImage = acceptedTypes.includes(file.type);
      
      if (!isImage) {
        ElMessage.error('只能上传图片文件!');
        return false;
      }
      
      // 为文件添加唯一标识符
      if (!file.uid) {
        file.uid = Date.now() + '-' + Math.random().toString(36).substr(2, 10);
      }
      return true; // 允许上传
    };

    // 处理收集前的照片变更
    const handlePhotoBeforeChange = (file, fileList) => {
      console.log('收集前照片变更:', file, fileList);
      
      // 更新photoBeforeList
      photoBeforeList.value = fileList;
      
      // 更新photoBeforeFiles，只包含新上传的文件
      photoBeforeFiles.value = fileList
        .filter(f => f.raw) // 只处理新上传的文件
        .map(f => f.raw);
      
      // 更新existingPhotosPathsBefore，只保留仍在fileList中的现有照片
      if (!isNew.value) {
        const existingFileUids = fileList
          .filter(f => f.uid && typeof f.uid === 'string' && f.uid.startsWith('before-'))
          .map(f => f.uid);
        
        // 保留仍在fileList中的现有照片
        existingPhotosPathsBefore.value = existingPhotosPathsBefore.value.filter((_, index) => {
          return existingFileUids.includes(`before-${index}`);
        });
      }
      
      // 更新预览图片
      updatePreviewImages([...photoBeforeList.value, ...photoAfterList.value]);
      
      return false; // 阻止自动上传
    };

    // 处理收集前的照片移除
    const handlePhotoBeforeRemove = (file, fileList) => {
      console.log('收集前照片移除:', file, fileList);
      
      // 更新photoBeforeList
      photoBeforeList.value = fileList;
      
      // 如果是现有照片，从existingPhotosPathsBefore中移除
      if (file.uid && typeof file.uid === 'string' && file.uid.startsWith('before-')) {
        const index = parseInt(file.uid.replace('before-', ''));
        // 从existingPhotosPathsBefore中移除
        existingPhotosPathsBefore.value = existingPhotosPathsBefore.value.filter((_, i) => i !== index);
      }
      
      // 更新photoBeforeFiles，只包含新上传的文件
      photoBeforeFiles.value = fileList
        .filter(f => f.raw)
        .map(f => f.raw);
      
      // 更新预览图片
      updatePreviewImages([...photoBeforeList.value, ...photoAfterList.value]);
    };

    // 处理收集后的照片变更
    const handlePhotoAfterChange = (file, fileList) => {
      console.log('收集后照片变更:', file, fileList);
      
      // 更新photoAfterList
      photoAfterList.value = fileList;
      
      // 更新photoAfterFiles，只包含新上传的文件
      photoAfterFiles.value = fileList
        .filter(f => f.raw) // 只处理新上传的文件
        .map(f => f.raw);
      
      // 更新existingPhotosPathsAfter，只保留仍在fileList中的现有照片
      if (!isNew.value) {
        const existingFileUids = fileList
          .filter(f => f.uid && typeof f.uid === 'string' && f.uid.startsWith('after-'))
          .map(f => f.uid);
        
        // 保留仍在fileList中的现有照片
        existingPhotosPathsAfter.value = existingPhotosPathsAfter.value.filter((_, index) => {
          return existingFileUids.includes(`after-${index}`);
        });
      }
      
      // 更新预览图片
      updatePreviewImages([...photoBeforeList.value, ...photoAfterList.value]);
      
      return false; // 阻止自动上传
    };

    // 处理收集后的照片移除
    const handlePhotoAfterRemove = (file, fileList) => {
      console.log('收集后照片移除:', file, fileList);
      
      // 更新photoAfterList
      photoAfterList.value = fileList;
      
      // 如果是现有照片，从existingPhotosPathsAfter中移除
      if (file.uid && typeof file.uid === 'string' && file.uid.startsWith('after-')) {
        const index = parseInt(file.uid.replace('after-', ''));
        // 从existingPhotosPathsAfter中移除
        existingPhotosPathsAfter.value = existingPhotosPathsAfter.value.filter((_, i) => i !== index);
      }
      
      // 更新photoAfterFiles，只包含新上传的文件
      photoAfterFiles.value = fileList
        .filter(f => f.raw)
        .map(f => f.raw);
      
      // 更新预览图片
      updatePreviewImages([...photoBeforeList.value, ...photoAfterList.value]);
    };

    // 更新预览图片
    const updatePreviewImages = (fileList) => {
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
    const submitForm = async () => {
      recordForm.value.validate(async (valid) => {
        if (valid) {
          try {
            loading.value = true;
            
            // 创建FormData对象
            const formData = new FormData();
            
            // 添加基本字段
            formData.append('unitId', form.unitId);
            formData.append('wasteTypeId', form.wasteTypeId);
            formData.append('location', form.location);
            formData.append('quantity', form.quantity);
            
            if (form.collectionDate && form.collectionTime) {
              const combinedDateTime = `${form.collectionDate} ${form.collectionTime}:00`;
              formData.append('collectionStartTime', combinedDateTime);
            }
            
            // 添加收集前照片
            if (photoBeforeFiles.value && photoBeforeFiles.value.length > 0) {
              photoBeforeFiles.value.forEach(file => {
                if (file) {
                  formData.append('photosBefore', file);
                }
              });
            }
            
            // 添加收集后照片
            if (photoAfterFiles.value && photoAfterFiles.value.length > 0) {
              photoAfterFiles.value.forEach(file => {
                if (file) {
                  formData.append('photosAfter', file);
                }
              });
            }
            
            // 添加现有收集前照片路径（用于更新时保留未更改的照片）
            if (!isNew.value && existingPhotosPathsBefore.value.length > 0) {
              formData.append('existingPhotosPathsBefore', JSON.stringify(existingPhotosPathsBefore.value));
            }
            
            // 添加现有收集后照片路径（用于更新时保留未更改的照片）
            if (!isNew.value && existingPhotosPathsAfter.value.length > 0) {
              formData.append('existingPhotosPathsAfter', JSON.stringify(existingPhotosPathsAfter.value));
            }
            
            let response;
            
            if (isNew.value) {
              // 新增记录
              response = await httpService.postForm(apiConfig.endpoints.wasteRecords, formData);
              ElMessage.success('废物记录添加成功');
            } else {
              // 更新记录
              response = await httpService.putForm(`${apiConfig.endpoints.wasteRecords}/${form.recordId}`, formData);
              ElMessage.success('废物记录更新成功');
            }
            
            console.log('提交响应:', response.data);
            
            // 返回列表页
            goBack();
          } catch (error) {
            console.error('提交表单失败:', error);
            ElMessage.error('提交表单失败');
          } finally {
            loading.value = false;
          }
        } else {
          console.log('表单验证失败');
          ElMessage.error('请填写必填字段');
          return false;
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
      photoBeforeList,
      photoAfterList,
      previewImages,
      showViewer,
      previewIndex,
      isNew,
      isSuperAdmin,
      handlePhotoBeforeChange,
      handlePhotoBeforeRemove,
      handlePhotoAfterChange,
      handlePhotoAfterRemove,
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
