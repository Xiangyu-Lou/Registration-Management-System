<template>
  <el-form
    ref="form"
    :model="form"
    :rules="rules"
    label-width="120px"
    class="waste-form"
    :disabled="submitting"
  >
    <el-form-item label="废物类型" prop="waste_type">
      <el-select v-model="form.waste_type" placeholder="请选择废物类型" style="width: 100%">
        <el-option
          v-for="item in wasteTypes"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        ></el-option>
      </el-select>
    </el-form-item>

    <el-form-item label="收集地点" prop="location">
      <el-input v-model="form.location" placeholder="请输入收集地点"></el-input>
    </el-form-item>

    <el-form-item label="备注" prop="remarks">
      <el-input
        v-model="form.remarks"
        type="textarea"
        :rows="1"
        placeholder="请输入备注信息"
      ></el-input>
    </el-form-item>

    <el-form-item label="收集数量" prop="quantity">
      <el-input-number v-model="form.quantity" :min="0" :precision="2" style="width: 100%"></el-input-number>
    </el-form-item>

    <el-form-item label="收集开始时间" prop="collection_start_time">
      <el-date-picker
        v-model="form.collection_start_time"
        type="datetime"
        placeholder="选择收集开始时间"
        style="width: 100%"
      ></el-date-picker>
    </el-form-item>

    <el-form-item label="收集结束时间" prop="collection_end_time">
      <el-date-picker
        v-model="form.collection_end_time"
        type="datetime"
        placeholder="选择收集结束时间"
        style="width: 100%"
      ></el-date-picker>
    </el-form-item>

    <el-form-item label="记录时间" prop="record_time">
      <el-date-picker
        v-model="form.record_time"
        type="datetime"
        placeholder="选择记录时间"
        style="width: 100%"
      ></el-date-picker>
    </el-form-item>

    <el-col :span="12">
      <el-form-item label="填报人ID" prop="creator_id">
        <el-input v-model="form.creator_id" placeholder="请输入填报人ID" disabled></el-input>
      </el-form-item>
    </el-col>

    <el-form-item label="现场照片（收集前）" prop="photo_path_before">
      <div class="photo-tip">请上传废物收集前的现场照片</div>
      <div class="upload-warning" v-if="showLargeFileWarning">
        <el-alert
          title="警告：大文件上传可能需要较长时间"
          type="warning"
          :closable="false"
          show-icon
        >
          <div>您选择的文件较大，上传可能需要较长时间。请耐心等待上传完成。</div>
        </el-alert>
      </div>
      <el-upload
        class="upload"
        action="#"
        :auto-upload="false"
        :on-change="handlePhotoBeforeChange"
        :on-remove="handlePhotoBeforeRemove"
        :file-list="fileListBefore"
        :limit="5"
        multiple
        list-type="picture-card"
      >
        <el-icon><plus /></el-icon>
      </el-upload>
    </el-form-item>

    <el-form-item label="现场照片（收集后）" prop="photo_path_after">
      <div class="photo-tip">请上传废物收集后的现场照片</div>
      <el-upload
        class="upload"
        action="#"
        :auto-upload="false"
        :on-change="handlePhotoAfterChange"
        :on-remove="handlePhotoAfterRemove"
        :file-list="fileListAfter"
        :limit="5"
        multiple
        list-type="picture-card"
      >
        <el-icon><plus /></el-icon>
      </el-upload>
    </el-form-item>

    <el-form-item>
      <div v-if="uploadProgress > 0" class="upload-progress">
        <el-progress :percentage="uploadProgress" :format="progressFormat"></el-progress>
      </div>
      <el-button type="primary" @click="submitForm" :loading="submitting">提交</el-button>
      <el-button @click="resetForm">重置</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import httpService from '../config/httpService';

export default {
  name: 'WasteForm',
  components: {
    Plus
  },
  props: {
    recordId: {
      type: String,
      default: null
    }
  },
  setup(props, { emit }) {
    // 表单数据
    const form = reactive({
      waste_type: '',
      location: '',
      quantity: 0,
      collection_start_time: '',
      collection_end_time: '',
      record_time: '',
      creator_id: '',
      photo_path_before: '',
      photo_path_after: '',
      remarks: ''
    });

    // 表单验证规则
    const rules = {
      waste_type: [
        { required: true, message: '请选择废物类型', trigger: 'change' }
      ],
      location: [
        { required: true, message: '请输入收集地点', trigger: 'blur' }
      ],
      quantity: [
        { required: true, message: '请输入收集数量', trigger: 'blur' }
      ],
      collection_start_time: [
        { required: true, message: '请选择收集开始时间', trigger: 'change' }
      ],
      collection_end_time: [
        { required: true, message: '请选择收集结束时间', trigger: 'change' }
      ],
      record_time: [
        { required: true, message: '请选择记录时间', trigger: 'change' }
      ],
      creator_id: [
        { required: true, message: '请输入填报人ID', trigger: 'blur' }
      ]
    };

    // 废物类型列表
    const wasteTypes = ref([]);
    // 照片文件列表
    const fileListBefore = ref([]);
    const fileListAfter = ref([]);
    // 提交状态
    const submitting = ref(false);
    // 表单引用
    const formRef = ref(null);
    // 上传进度
    const uploadProgress = ref(0);
    // 大文件警告
    const showLargeFileWarning = ref(false);
    // 最大文件大小 (5MB)
    const maxFileSize = 5 * 1024 * 1024;
    const maxFileSizeMB = 5;

    // 获取废物类型
    const fetchWasteTypes = async () => {
      try {
        const response = await httpService.get('/api/waste-types');
        wasteTypes.value = response.data;
      } catch (error) {
        console.error('获取废物类型失败', error);
        ElMessage.error('获取废物类型失败');
      }
    };

    // 获取记录详情
    const fetchRecord = async () => {
      if (!props.recordId) return;
      
      try {
        const response = await httpService.get(`/api/records/${props.recordId}`);
        const record = response.data;
        
        // 更新表单数据
        Object.keys(form).forEach(key => {
          if (record[key] !== undefined) {
            form[key] = record[key];
          }
        });
        
        // 处理照片
        if (record.photo_path_before) {
          fileListBefore.value = [{
            name: record.photo_path_before.split('/').pop(),
            url: `${httpService.defaults.baseURL}/${record.photo_path_before}`
          }];
        }
        
        if (record.photo_path_after) {
          fileListAfter.value = [{
            name: record.photo_path_after.split('/').pop(),
            url: `${httpService.defaults.baseURL}/${record.photo_path_after}`
          }];
        }
      } catch (error) {
        console.error('获取记录详情失败', error);
        ElMessage.error('获取记录详情失败');
      }
    };

    // 处理收集前照片变更
    const handlePhotoBeforeChange = (file) => {
      // 检查文件大小
      if (file.size > maxFileSize) {
        showLargeFileWarning.value = true;
      }
      
      fileListBefore.value = [file];
      return false;
    };

    // 处理收集后照片变更
    const handlePhotoAfterChange = (file) => {
      // 检查文件大小
      if (file.size > maxFileSize) {
        showLargeFileWarning.value = true;
      }
      
      fileListAfter.value = [file];
      return false;
    };

    // 处理收集前照片移除
    const handlePhotoBeforeRemove = (file, fileList) => {
      fileListBefore.value = fileList;
      
      // 如果没有大文件了，隐藏警告
      if (!checkForLargeFiles([...fileListBefore.value, ...fileListAfter.value])) {
        showLargeFileWarning.value = false;
      }
    };

    // 处理收集后照片移除
    const handlePhotoAfterRemove = (file, fileList) => {
      fileListAfter.value = fileList;
      
      // 如果没有大文件了，隐藏警告
      if (!checkForLargeFiles([...fileListBefore.value, ...fileListAfter.value])) {
        showLargeFileWarning.value = false;
      }
    };

    // 检查是否有大文件
    const checkForLargeFiles = (files) => {
      return files.some(file => file.size > maxFileSize);
    };

    // 提交表单
    const submitForm = async () => {
      if (!formRef.value) return;
      
      formRef.value.validate(async (valid) => {
        if (valid) {
          submitting.value = true;
          uploadProgress.value = 0;
          
          try {
            const formData = new FormData();
            
            // 添加表单字段
            Object.keys(form).forEach(key => {
              if (key !== 'photo_path_before' && key !== 'photo_path_after') {
                formData.append(key, form[key]);
              }
            });
            
            // 添加照片
            if (fileListBefore.value.length > 0 && fileListBefore.value[0] instanceof File) {
              formData.append('photo_before', fileListBefore.value[0]);
            } else if (form.photo_path_before) {
              formData.append('photo_path_before', form.photo_path_before);
            }
            
            if (fileListAfter.value.length > 0 && fileListAfter.value[0] instanceof File) {
              formData.append('photo_after', fileListAfter.value[0]);
            } else if (form.photo_path_after) {
              formData.append('photo_path_after', form.photo_path_after);
            }
            
            // 发送请求
            const url = props.recordId ? `/api/waste-records/${props.recordId}` : '/api/waste-records';
            const method = props.recordId ? 'put' : 'post';
            
            const response = await httpService({
              url,
              method,
              data: formData,
              onUploadProgress: (progressEvent) => {
                uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              }
            });
            
            ElMessage.success(props.recordId ? '更新成功' : '添加成功');
            emit('success', response.data);
          } catch (error) {
            console.error('提交失败', error);
            ElMessage.error('提交失败: ' + (error.response?.data?.message || error.message));
          } finally {
            submitting.value = false;
          }
        }
      });
    };

    // 重置表单
    const resetForm = () => {
      if (formRef.value) {
        formRef.value.resetFields();
        fileListBefore.value = [];
        fileListAfter.value = [];
        showLargeFileWarning.value = false;
        uploadProgress.value = 0;
      }
    };

    // 格式化进度
    const progressFormat = (percentage) => {
      return percentage === 100 ? '处理中...' : `${percentage}%`;
    };

    // 组件挂载时获取数据
    onMounted(() => {
      fetchWasteTypes();
      fetchRecord();
    });

    return {
      form,
      rules,
      wasteTypes,
      fileListBefore,
      fileListAfter,
      submitting,
      formRef,
      uploadProgress,
      showLargeFileWarning,
      maxFileSize,
      maxFileSizeMB,
      handlePhotoBeforeChange,
      handlePhotoAfterChange,
      handlePhotoBeforeRemove,
      handlePhotoAfterRemove,
      checkForLargeFiles,
      submitForm,
      resetForm,
      progressFormat
    };
  }
};
</script>

<style scoped>
.waste-form {
  max-width: 800px;
  margin: 0 auto;
}

.upload {
  width: 100%;
}

.photo-tip {
  margin-bottom: 10px;
  color: #666;
  font-size: 14px;
}

.upload-warning {
  margin-bottom: 10px;
}

.upload-progress {
  margin-bottom: 15px;
}
</style> 