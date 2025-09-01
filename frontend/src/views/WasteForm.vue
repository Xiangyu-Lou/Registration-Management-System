<template>
  <div class="waste-form-container">
    <div class="header">
      <div class="back-button" @click="goBack" v-if="isAdmin">
        <el-icon><arrow-left /></el-icon> 返回
      </div>
      <div v-else></div>
      <h1>固体废物填报</h1>
      <div class="view-records" @click="viewRecords">
        查看记录 <el-icon><document /></el-icon>
      </div>
    </div>

    <div class="content">
      <div class="unit-info">
        <h2>{{ unitName }}</h2>
      </div>

      <el-form 
        ref="wasteForm" 
        :model="form" 
        :rules="rules" 
        label-position="top"
        class="waste-form"
      >
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

        <el-form-item label="产生工序" prop="process">
          <el-select v-model="form.process" placeholder="请选择产生工序" style="width: 100%">
            <el-option 
              v-for="option in processOptions" 
              :key="option" 
              :label="option" 
              :value="option" 
            />
          </el-select>
          <!-- 自定义产生工序输入 -->
          <el-input 
            v-if="form.process === '其他'" 
            v-model="customProcess" 
            placeholder="请输入具体产生工序" 
            style="margin-top: 10px; height: 40px;"
          />
        </el-form-item>

        <el-form-item label="产生地点" prop="location">
          <el-select v-model="form.location" placeholder="请选择废物产生地点" style="width: 100%">
            <el-option 
              v-for="option in locationOptions" 
              :key="option" 
              :label="option" 
              :value="option" 
            />
          </el-select>
          <!-- 自定义产生地点输入框 -->
          <el-input 
            v-if="form.location === '其他'" 
            v-model="customLocation" 
            placeholder="请输入具体产生地点" 
            style="margin-top: 10px; height: 40px;"
          />
        </el-form-item>

        <!-- 地理位置信息 -->
        <el-form-item label="地理位置">
          <div class="location-section">
            <div class="location-controls">
              <el-button 
                type="primary" 
                :icon="Location" 
                :loading="locationLoading" 
                @click="getCurrentLocation"
                :disabled="!isLocationSupported"
              >
                {{ locationLoading ? '获取中...' : '获取当前位置' }}
              </el-button>
              <span v-if="!isLocationSupported" class="location-tip">
                当前环境不支持位置获取
              </span>
              <span v-else-if="!isSecureContext" class="location-tip">
                需要HTTPS环境才能获取位置
              </span>
            </div>
            
            <!-- 位置信息显示 -->
            <div v-if="locationInfo.success" class="location-info">
              <div class="location-item">
                <el-tag type="success" size="small">坐标</el-tag>
                <span>{{ formatCoordinates(locationInfo.longitude, locationInfo.latitude) }}</span>
              </div>
              <div v-if="locationInfo.address" class="location-item">
                <el-tag type="info" size="small">地址</el-tag>
                <span>{{ formatAddress(locationInfo) }}</span>
              </div>
            </div>
            
            <div v-if="locationError" class="location-error">
              <el-alert 
                :title="locationError" 
                type="warning" 
                :closable="false" 
                show-icon 
                size="small"
              />
            </div>
          </div>
        </el-form-item>
        
        <el-form-item label="备注" prop="remarks">
          <el-input 
            v-model="form.remarks" 
            type="textarea" 
            :rows="1"
            placeholder="请输入备注信息（选填）" 
          />
        </el-form-item>

        <div class="form-row">
          <el-form-item label="收集日期" class="date-item">
            <el-date-picker
              v-model="form.collectionDate"
              type="date"
              placeholder="选择日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
              :editable="false"
              popper-class="date-picker-popup"
              :teleported="false"
            />
          </el-form-item>

          <el-form-item label="收集时间" class="time-item">
            <el-time-picker
              v-model="form.collectionTime"
              format="HH:mm"
              placeholder="选择时间"
              value-format="HH:mm"
              style="width: 100%"
              :editable="false"
              popper-class="time-picker-popup"
              :teleported="false"
            >
              <template #prefix>
                <el-icon><clock /></el-icon>
              </template>
            </el-time-picker>
          </el-form-item>
        </div>

        <el-form-item label="收集数量(吨)" prop="quantity">
          <el-input-number
            v-model="form.quantity"
            :min="0"
            :precision="3"
            :step="0.001"
            style="width: 100%"
            @focus="selectAllText($event)"
            :input-props="{
              inputmode: 'decimal',
              pattern: '[0-9]*[.,]?[0-9]*'
            }"
          />
        </el-form-item>

        <el-form-item label="现场照片（收集前）" prop="photo_before">
          <div class="photo-tip">请上传废物收集前的现场照片（最多5张）</div>
          <div class="upload-warning" v-if="showLargeFileWarning">
            <el-alert
              title="上传大文件可能会导致处理时间较长，请耐心等待"
              type="warning"
              :closable="false"
              show-icon
            />
          </div>
          <el-upload
            class="waste-photo-uploader"
            action="#"
            :auto-upload="false"
            :on-change="handlePhotoBeforeChange"
            :on-remove="handlePhotoBeforeRemove"
            :file-list="fileListBefore"
            :limit="5"
            multiple
            list-type="picture-card"
            :before-upload="handleBeforeUpload"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/bmp,image/webp,.jpeg,.jpg,.png,.gif,.bmp,.webp"
          >
            <el-icon><plus /></el-icon>
          </el-upload>
        </el-form-item>

        <el-form-item label="现场照片（收集后）" prop="photo_after">
          <div class="photo-tip">请上传废物收集后的现场照片（最多5张）</div>
          <el-upload
            class="waste-photo-uploader"
            action="#"
            :auto-upload="false"
            :on-change="handlePhotoAfterChange"
            :on-remove="handlePhotoAfterRemove"
            :file-list="fileListAfter"
            :limit="5"
            multiple
            list-type="picture-card"
            :before-upload="handleBeforeUpload"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/bmp,image/webp,.jpeg,.jpg,.png,.gif,.bmp,.webp"
          >
            <el-icon><plus /></el-icon>
          </el-upload>
        </el-form-item>

        <div class="form-actions">
          <el-button type="primary" class="submit-btn" @click="submitForm" :loading="loading">提交</el-button>
          <el-button class="reset-btn" @click="resetForm">重置</el-button>
        </div>
      </el-form>
    </div>

    <!-- 上传进度条对话框 -->
    <el-dialog
      v-model="showUploadProgress"
      title="正在上传文件"
      width="30%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <div class="upload-progress">
        <p>正在上传文件，请勿关闭页面...</p>
        <el-progress 
          :percentage="uploadPercentage" 
          :format="percentageFormat"
          :status="uploadPercentage === 100 ? 'success' : ''"
        ></el-progress>
        <p class="upload-status">{{ uploadStatus }}</p>
      </div>
    </el-dialog>

    <div class="footer">
      <p>&copy; 2025 固体废物管理系统</p>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import httpService from '../config/httpService';
import apiConfig from '../config/api';
import { ArrowLeft, Document, Plus, Clock, Location } from '@element-plus/icons-vue';
import auth from '../store/auth';
import { useTimerCleanup } from '../composables/useTimerCleanup';
import { useFormData, processOptions } from '../composables/useFormData';
import { useGeolocation, isLocationSupported, isSecureContext, formatCoordinates, formatAddress } from '../composables/useGeolocation';
import { usePhotoUpload } from '../composables/usePhotoUpload';

export default {
  name: 'WasteForm',
  components: {
    ArrowLeft,
    Document,
    Plus,
    Clock
  },
  props: {
    id: {
      type: [String, Number],
      required: true
    }
  },
  setup(props) {
    const router = useRouter();
    const { safeTimeout } = useTimerCleanup();
    const { wasteTypes, unitName, locationOptions, fetchWasteTypes, fetchUnitNameWithAuth } = useFormData();
    const { locationLoading, locationInfo, locationError, getCurrentLocation } = useGeolocation();
    const {
      photoFilesBefore, photoFilesAfter, fileListBefore, fileListAfter,
      showUploadProgress, uploadPercentage, uploadStatus, showLargeFileWarning,
      handleBeforeUpload, handlePhotoBeforeChange, handlePhotoAfterChange,
      handlePhotoBeforeRemove, handlePhotoAfterRemove,
      handleUploadProgress, percentageFormat, checkForLargeFiles, cleanup: cleanupPhotos
    } = usePhotoUpload({ largeFileThreshold: 5 * 1024 * 1024 });

    const wasteForm = ref(null);
    const loading = ref(false);
    const customLocation = ref('');
    const customProcess = ref('');
    
    // 检查用户是否为超级管理员
    const isAdmin = computed(() => {
      return auth.state.isLoggedIn && (auth.state.user.role_id === 3 || auth.state.user.role_id === 4);
    });

    // 初始化表单，将日期和时间分开
    const form = reactive({
      wasteTypeId: '',
      location: '',
      collectionDate: new Date().toISOString().slice(0, 10), // 默认为当天
      collectionTime: new Date().toTimeString().slice(0, 5), // 默认为当前时间，格式为HH:MM
      quantity: undefined,
      photo_before: [],
      photo_after: [],
      remarks: '',
      process: ''
    });

    const rules = {
      wasteTypeId: [
        { required: true, message: '请选择废物类型', trigger: 'change' }
      ],
      process: [
        { required: true, message: '请选择产生工序', trigger: 'change' },
        {
          validator: (rule, value, callback) => {
            if (value === '其他' && !customProcess.value.trim()) {
              callback(new Error('请输入具体产生工序'));
            } else {
              callback();
            }
          },
          trigger: 'blur'
        }
      ],
      location: [
        { required: true, message: '请选择废物产生地点', trigger: 'change' },
        {
          validator: (rule, value, callback) => {
            if (value === '其他' && !customLocation.value.trim()) {
              callback(new Error('请输入具体产生地点'));
            } else {
              callback();
            }
          },
          trigger: 'blur'
        }
      ],
      collectionDate: [
        { required: false }
      ],
      collectionTime: [
        { required: false }
      ],
      quantity: [
        { required: false, message: '请输入收集数量', trigger: 'change' }
      ]
    };

    onMounted(async () => {
      // 设置viewport meta标签
      const viewportMeta = document.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      viewportMeta.setAttribute('content', 'width=device-width,initial-scale=1.0,user-scalable=no,maximum-scale=1');
      document.head.appendChild(viewportMeta);

      // 保存原始的viewport meta标签（如果存在）
      const originalViewport = document.querySelector('meta[name="viewport"]');
      if (originalViewport && originalViewport !== viewportMeta) {
        originalViewport.remove();
      }

      const unit = await fetchUnitNameWithAuth(props.id);
      if (!unit && auth.isSupervisor()) {
        ElMessage.error('无权访问该单位，请联系管理员');
        router.push({ name: 'UnitSelection' });
        return;
      }
      await fetchWasteTypes();

      // 自动获取位置信息
      if (isLocationSupported() && isSecureContext()) {
        getCurrentLocation();
      }
    });

    onBeforeUnmount(() => {
      cleanupPhotos();

      // 移除我们添加的viewport meta标签
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        viewportMeta.remove();
      }

      // 恢复原始的viewport设置
      const originalViewport = document.createElement('meta');
      originalViewport.setAttribute('name', 'viewport');
      originalViewport.setAttribute('content', 'width=device-width,initial-scale=1.0');
      document.head.appendChild(originalViewport);
    });

    const submitForm = () => {
      wasteForm.value.validate(async (valid) => {
        if (valid) {
          loading.value = true;
          try {
            const formData = new FormData();
            formData.append('unitId', props.id);
            formData.append('wasteTypeId', form.wasteTypeId);
            
            // 处理产生工序 - 如果选择了"其他"并填写了自定义工序，则使用自定义工序
            if (form.process === '其他' && customProcess.value.trim()) {
              formData.append('process', customProcess.value.trim());
            } else {
              formData.append('process', form.process);
            }
            
            // 处理产生地点 - 如果选择了"其他"并填写了自定义地点，则使用自定义地点
            if (form.location === '其他' && customLocation.value.trim()) {
              formData.append('location', customLocation.value.trim());
            } else {
            formData.append('location', form.location);
            }
            
            // 组合日期和时间，如果有的话
            if (form.collectionDate && form.collectionTime) {
              formData.append('collectionDate', form.collectionDate);
              formData.append('collectionTime', form.collectionTime);
            }
            
            // 只有当quantity有值时才添加到formData
            if (form.quantity !== undefined && form.quantity !== null && form.quantity !== '') {
            formData.append('quantity', form.quantity);
            }
            
            // 添加备注字段
            formData.append('remarks', form.remarks || '');
            
            // 添加位置信息
            if (locationInfo.value.success) {
              if (locationInfo.value.longitude) {
                formData.append('longitude', locationInfo.value.longitude);
              }
              if (locationInfo.value.latitude) {
                formData.append('latitude', locationInfo.value.latitude);
              }
              if (locationInfo.value.address) {
                formData.append('address', locationInfo.value.address);
              }
              if (locationInfo.value.district) {
                formData.append('district', locationInfo.value.district);
              }
              if (locationInfo.value.city) {
                formData.append('city', locationInfo.value.city);
              }
              if (locationInfo.value.province) {
                formData.append('province', locationInfo.value.province);
              }
            }
            
            // 添加创建者ID（如果用户已登录）
            if (auth.state.isLoggedIn && auth.state.user) {
              formData.append('creator_id', auth.state.user.id);
              console.log('添加用户信息:', {
                creator_id: auth.state.user.id,
                user: auth.state.user
              });
            } else {
              console.log('用户未登录或用户信息不完整');
            }
            
            console.log('提交表单数据:', {
              unitId: props.id,
              wasteTypeId: form.wasteTypeId,
              process: form.process === '其他' ? customProcess.value : form.process,
              location: form.location === '其他' ? customLocation.value : form.location,
              quantity: form.quantity,
              remarks: form.remarks || '',
              photo_before: photoFilesBefore.value ? photoFilesBefore.value.length : 0,
              photo_after: photoFilesAfter.value ? photoFilesAfter.value.length : 0
            });
            
            // 添加收集前照片
            if (photoFilesBefore.value && photoFilesBefore.value.length > 0) {
              console.log('添加收集前照片数量:', photoFilesBefore.value.length);
              photoFilesBefore.value.forEach((file, index) => {
                if (file) {
                  console.log(`收集前照片 ${index+1}:`, file.name);
                  formData.append('photo_before', file);
                }
              });
            }
            
            // 添加收集后照片
            if (photoFilesAfter.value && photoFilesAfter.value.length > 0) {
              console.log('添加收集后照片数量:', photoFilesAfter.value.length);
              photoFilesAfter.value.forEach((file, index) => {
                if (file) {
                  console.log(`收集后照片 ${index+1}:`, file.name);
                  formData.append('photo_after', file);
                }
              });
            }

            // 检查是否有大文件需要显示警告
            const allFiles = [...(photoFilesBefore.value || []), ...(photoFilesAfter.value || [])];
            showLargeFileWarning.value = checkForLargeFiles(allFiles);
            
            // 如果有文件要上传，显示进度条
            if (allFiles.length > 0) {
              showUploadProgress.value = true;
              uploadPercentage.value = 0;
              uploadStatus.value = '准备上传...';
            }

            const response = await httpService.postForm(
              apiConfig.endpoints.wasteRecords, 
              formData,
              handleUploadProgress
            );
            
            console.log('提交响应:', response.data);

            // 显示成功消息
            ElMessage.success('废物记录提交成功！正在跳转到记录列表...');
            
            // 重置表单
            resetForm();
            
            // 延迟跳转，让用户看到成功消息
            safeTimeout(() => {
              // 根据用户角色跳转到相应的记录查看页面
              if (auth.state.isLoggedIn && auth.state.user) {
                const userRole = auth.state.user.role_id;

                if (userRole === 3 || userRole === 4) {
                  // 超级管理员 - 跳转到管理员记录页面
                  router.push('/admin-records');
                } else if (userRole === 2) {
                  // 单位管理员 - 跳转到单位记录列表
                  router.push({ name: 'RecordsList', params: { unitId: props.id } });
                } else if (userRole === 1) {
                  // 普通员工 - 跳转到个人记录列表
                  router.push({ name: 'RecordsList', params: { unitId: props.id } });
                } else {
                  // 其他角色，默认跳转到记录列表
                  router.push({ name: 'RecordsList', params: { unitId: props.id } });
                }
              } else {
                // 未登录用户，跳转到记录列表
                router.push({ name: 'RecordsList', params: { unitId: props.id } });
              }
            }, 1500); // 1.5秒后跳转
          } catch (error) {
            console.error('Error submitting form:', error);
            if (error.response) {
              console.error('错误响应数据:', error.response.data);
              console.error('错误状态码:', error.response.status);
            }
            ElMessage.error('提交失败，请稍后再试');
          } finally {
            loading.value = false;
            showUploadProgress.value = false;
          }
        } else {
          ElMessage.warning('请完成必填项');
        }
      });
    };

    const resetForm = () => {
      if (wasteForm.value) {
        wasteForm.value.resetFields();
      }
      // 重置表单各字段
      form.wasteTypeId = '';
      form.location = ''; 
      form.process = '';
      form.remarks = '';
      form.quantity = undefined;
      form.collectionDate = new Date().toISOString().slice(0, 10); // 重置为今天
      form.collectionTime = new Date().toTimeString().slice(0, 5); // 重置为当前时间，格式为HH:MM
      
      // 清空自定义输入
      customLocation.value = '';
      customProcess.value = '';
      
      // 清空照片数据
      photoFilesBefore.value = [];
      photoFilesAfter.value = [];
      fileListBefore.value = [];
      fileListAfter.value = [];
      showLargeFileWarning.value = false;
    };

    const goBack = () => {
      // 只有超级管理员才能返回到单位选择页面
      if (isAdmin.value) {
        router.push('/');
      }
    };

    const viewRecords = () => {
      router.push({ name: 'RecordsList', params: { unitId: props.id } });
    };

    const selectAllText = (event) => {
      // 使用safeTimeout确保DOM已完全渲染
      safeTimeout(() => {
        if (event && event.target) {
          // 找到el-input-number内部的input元素
          const inputEl = event.target.querySelector('input');
          if (inputEl) {
            inputEl.select();
          }
        }
      }, 10);
    };

    return {
      form,
      rules,
      wasteForm,
      loading,
      unitName,
      wasteTypes,
      isAdmin,
      fileListBefore,
      fileListAfter,
      handlePhotoBeforeChange,
      handlePhotoBeforeRemove,
      handlePhotoAfterChange,
      handlePhotoAfterRemove,
      handleBeforeUpload,
      submitForm,
      resetForm,
      goBack,
      viewRecords,
      selectAllText,
      showUploadProgress,
      uploadPercentage,
      uploadStatus,
      percentageFormat,
      showLargeFileWarning,
      locationOptions,
      customLocation,
      customProcess,
      processOptions,
      // 位置相关
      locationLoading,
      locationInfo,
      locationError,
      getCurrentLocation,
      isLocationSupported,
      isSecureContext,
      formatCoordinates,
      formatAddress,
      Location
    };
  }
};
</script>

<style scoped>
/* 位置信息样式 */
.location-section {
  width: 100%;
}

.location-controls {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
  flex-wrap: wrap;
}

.location-tip {
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.location-info {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  margin-top: var(--space-2);
}

.location-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.location-item:last-child {
  margin-bottom: 0;
}

.location-item span {
  color: var(--color-text-secondary);
  font-size: 14px;
}

.location-error {
  margin-top: var(--space-2);
}

.waste-form-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-bg-secondary);
}

.header {
  background-color: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-primary);
  padding: var(--space-4) var(--space-5);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.back-button, .view-records {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  white-space: nowrap;
  color: var(--color-text-secondary);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  border: 1px solid var(--color-border);
  background-color: var(--color-bg-primary);
  font-weight: 500;
}

.back-button:hover, .view-records:hover {
  color: var(--color-accent);
  border-color: var(--color-accent);
  background-color: var(--color-accent-light);
}

.content {
  flex: 1;
  padding: var(--space-4);
  max-width: 100%;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.unit-info {
  text-align: center;
  margin-bottom: var(--space-4);
}

.unit-info h2 {
  color: var(--color-text-primary);
  border-bottom: 2px solid var(--color-accent);
  display: inline-block;
  padding-bottom: 5px;
  font-size: 18px;
  margin: 0;
}

.waste-form {
  background-color: var(--color-bg-primary);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-xs);
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

@media (min-width: 768px) {
  .form-row {
    flex-direction: row;
  }

  .date-item, .time-item {
    flex: 1;
  }

  .content {
    padding: var(--space-6);
    max-width: 800px;
  }

  .header h1 {
    font-size: 18px;
  }
}

.waste-photo-uploader {
  width: 100%;
}

.waste-photo-uploader :deep(.el-upload--picture-card) {
  width: 80px;
  height: 80px;
  line-height: 80px;
}

.waste-photo-uploader :deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 80px;
  height: 80px;
}

.photo-tip, .time-tip {
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-2);
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: var(--space-3);
  margin-top: var(--space-6);
}

.submit-btn {
  width: 45%;
  height: 44px;
  font-size: 16px;
  border-radius: var(--radius-lg);
}

.reset-btn {
  width: 45%;
  height: 44px;
  font-size: 16px;
  border-radius: var(--radius-lg);
  background-color: var(--color-bg-primary) !important;
  border: 1px solid var(--color-border) !important;
  color: var(--color-text-secondary) !important;
}

.reset-btn:hover {
  border-color: var(--color-accent) !important;
  color: var(--color-accent) !important;
}

@media (min-width: 768px) {
  .form-actions {
    justify-content: flex-start;
  }

  .submit-btn, .reset-btn {
    width: auto;
  }
}

.footer {
  background-color: var(--color-bg-secondary);
  padding: var(--space-3);
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: 12px;
}

:deep(.el-form-item__label) {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  padding-bottom: 4px;
}

:deep(.el-input__inner),
:deep(.el-select__input),
:deep(.el-input-number__decrease),
:deep(.el-input-number__increase) {
  height: 44px;
  font-size: 15px;
}

:deep(.el-button) {
  font-size: 15px;
  padding: 12px 20px;
}

:deep(.el-select-dropdown__item) {
  font-size: 15px;
  padding: 12px 20px;
}

:deep(.el-date-editor.el-input),
:deep(.el-date-editor.el-input__inner) {
  width: 100%;
}

:deep(.el-form-item) {
  margin-bottom: var(--space-5);
}

:deep(.date-picker-popup),
:deep(.time-picker-popup) {
  touch-action: none;
}

:deep(.el-input__wrapper) {
  cursor: pointer;
}

:deep(.el-input__inner) {
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.upload-warning {
  margin-bottom: var(--space-3);
}

.upload-progress {
  text-align: center;
  padding: var(--space-3);
}

.upload-status {
  margin-top: var(--space-3);
  color: var(--color-text-secondary);
  font-size: 14px;
}

.waste-form :deep(.el-input__wrapper) {
  box-sizing: border-box;
  height: 40px !important;
  line-height: normal;
}

.waste-form :deep(.el-input__inner) {
  height: 40px !important;
  line-height: 40px;
}

.waste-form :deep(.el-textarea__inner) {
  height: auto !important;
  min-height: 32px;
}
</style>
