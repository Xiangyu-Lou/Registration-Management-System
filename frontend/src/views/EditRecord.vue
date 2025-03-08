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

        <el-form-item label="备注" prop="remarks">
          <el-input 
            v-model="form.remarks" 
            type="textarea" 
            :rows="3"
            placeholder="请输入备注信息（选填）" 
          />
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

        <el-form-item label="现场照片（收集前）" prop="photo_path_before">
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
            :on-preview="handlePictureCardPreview"
            :before-upload="handleBeforeUpload"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/bmp,image/webp,.jpeg,.jpg,.png,.gif,.bmp,.webp"
          >
            <el-icon><plus /></el-icon>
          </el-upload>
        </el-form-item>

        <el-form-item label="现场照片（收集后）" prop="photo_path_after">
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
            :on-preview="handlePictureCardPreview"
            :before-upload="handleBeforeUpload"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/bmp,image/webp,.jpeg,.jpg,.png,.gif,.bmp,.webp"
          >
            <el-icon><plus /></el-icon>
          </el-upload>
          
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
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElImageViewer } from 'element-plus';
import httpService from '../config/httpService';
import apiConfig from '../config/api';
import { ArrowLeft, Plus, Clock } from '@element-plus/icons-vue';
import auth from '../store/auth';
import Compressor from 'compressorjs';

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
    const fileListBefore = ref([]);
    const fileListAfter = ref([]);
    const photoFilesBefore = ref([]);
    const photoFilesAfter = ref([]);
    const previewImages = ref([]);
    const showViewer = ref(false);
    const previewIndex = ref(0);
    const createdAt = ref('');
    const showUploadProgress = ref(false);
    const uploadPercentage = ref(0);
    const uploadStatus = ref('准备上传...');
    const showLargeFileWarning = ref(false);
    
    // 添加解析照片路径的函数
    const parsePhotoPath = (path) => {
      if (!path) return [];
      
      console.log('解析照片路径，原始值:', path, '类型:', typeof path);
      
      try {
        // 如果已经是数组，直接返回
        if (Array.isArray(path)) {
          console.log('照片路径已经是数组:', path);
          return path;
        }
        
        // 尝试解析为JSON
        if (typeof path === 'string') {
          // 检查是否是JSON数组格式
          if (path.startsWith('[') && path.endsWith(']')) {
            const parsed = JSON.parse(path);
            console.log('照片路径解析为JSON数组:', parsed);
            return parsed;
          }
          
          // 检查是否是逗号分隔的字符串
          if (path.includes(',')) {
            const paths = path.split(',').map(p => p.trim()).filter(p => p);
            console.log('照片路径解析为逗号分隔字符串:', paths);
            return paths;
          }
          
          // 单个路径
          console.log('照片路径解析为单个字符串:', [path]);
          return [path];
        }
        
        // 其他情况，尝试转换为字符串后处理
        console.log('照片路径类型未知，尝试转换为字符串:', String(path));
        return [String(path)];
      } catch (error) {
        console.error('解析照片路径失败:', error);
        // 如果解析失败，将其作为单个路径返回
        return typeof path === 'string' ? [path] : [];
      }
    };
    
    // 是否为新增记录
    const isNew = computed(() => {
      return !route.params.id || route.params.id === 'new';
    });
    
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
      creatorId: auth.state.user?.id || null,
      photo_path_before: '',
      photo_path_after: '',
      remarks: ''
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
        
        // 如果是新增记录
        if (isNew.value) {
          // 新增记录默认使用当前用户的单位（非超级管理员）
          if (!isSuperAdmin.value && auth.state.user) {
            form.unitId = auth.state.user.unit_id;
            await fetchUnitName(form.unitId);
          }
          
          // 设置默认的收集日期和时间为当前时间
          form.collectionDate = new Date().toISOString().slice(0, 10);
          form.collectionTime = new Date().toTimeString().slice(0, 5);
        } else {
          // 只有在编辑现有记录时才获取记录详情
          await fetchRecordDetails();
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
        
        // 处理照片
        if (record.photo_path_before) {
          console.log('收集前照片路径:', record.photo_path_before);
          const photoPaths = parsePhotoPath(record.photo_path_before);
          console.log('解析后的收集前照片路径:', photoPaths);
          
          fileListBefore.value = photoPaths.map(path => {
            // 构建完整URL
            let fullUrl = path;
            if (!path.startsWith('http')) {
              // 移除开头的斜杠（如果有）
              const cleanPath = path.startsWith('/') ? path.substring(1) : path;
              fullUrl = `${window.location.origin}/${cleanPath}`;
            }
            
            console.log('收集前照片完整URL:', fullUrl);
            
            return {
              name: path.split('/').pop(),
              url: fullUrl
            };
          });
        }
        
        if (record.photo_path_after) {
          console.log('收集后照片路径:', record.photo_path_after);
          const photoPaths = parsePhotoPath(record.photo_path_after);
          console.log('解析后的收集后照片路径:', photoPaths);
          
          fileListAfter.value = photoPaths.map(path => {
            // 构建完整URL
            let fullUrl = path;
            if (!path.startsWith('http')) {
              // 移除开头的斜杠（如果有）
              const cleanPath = path.startsWith('/') ? path.substring(1) : path;
              fullUrl = `${window.location.origin}/${cleanPath}`;
            }
            
            console.log('收集后照片完整URL:', fullUrl);
            
            return {
              name: path.split('/').pop(),
              url: fullUrl
            };
          });
        }
        
        // 获取单位名称
        unitName.value = record.unit_name;
        
        // 设置创建时间
        createdAt.value = record.created_at;
        
        // 初始化预览图片列表
        updatePreviewImages([...fileListBefore.value, ...fileListAfter.value]);
        
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

      // 检查文件大小（50MB = 50 * 1024 * 1024 bytes）
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        ElMessage.error('图片大小不能超过50MB!');
        return false;
      }
      
      // 返回一个Promise
      return new Promise((resolve) => {
        // 显示处理进度提示
        showUploadProgress.value = true;
        uploadStatus.value = '正在处理图片...';
        uploadPercentage.value = 0;
        
        console.log('开始处理图片:', file.name, '类型:', file.type, '大小:', (file.size / 1024).toFixed(2), 'KB');
        
        // 使用Compressor直接处理图片
        new Compressor(file, {
          quality: 0.6,           // 中等压缩 (0-1)
          maxWidth: 1920,         // 最大宽度
          maxHeight: 1920,        // 最大高度
          mimeType: 'image/jpeg', // 强制转换为JPEG
          convertSize: 0,         // 所有图片都转换格式
          // 报告进度
          beforeDraw() {
            uploadPercentage.value = 30;
            uploadStatus.value = '正在处理图片...';
            console.log('图片处理中...');
          },
          // 报告进度
          drew() {
            uploadPercentage.value = 60;
            uploadStatus.value = '正在压缩图片...';
            console.log('图片绘制完成');
          },
          success(result) {
            // 创建新的文件名（确保扩展名为.jpg）
            const fileName = file.name.replace(/\.[^/.]+$/, "") + '.jpg';
            
            // 创建新的File对象
            const processedFile = new File([result], fileName, {
              type: 'image/jpeg',
              lastModified: new Date().getTime()
            });
            
            // 输出处理结果日志
            console.log('图片处理完成:');
            console.log('- 原始大小:', (file.size / 1024).toFixed(2), 'KB');
            console.log('- 处理后大小:', (processedFile.size / 1024).toFixed(2), 'KB');
            console.log('- 压缩率:', Math.round((1 - processedFile.size / file.size) * 100), '%');
            console.log('- 处理后文件类型:', processedFile.type);
            console.log('- 处理后文件名:', processedFile.name);
            
            // 处理完成
            uploadStatus.value = '图片处理完成';
            uploadPercentage.value = 100;
            
            // 延迟关闭进度条
            setTimeout(() => {
              showUploadProgress.value = false;
            }, 500);
            
            // 解析Promise，返回处理后的文件
            resolve(processedFile);
          },
          error(err) {
            console.error('图片压缩失败:', err);
            // 如果处理失败，返回原始文件
            uploadStatus.value = '处理失败，使用原始图片';
            uploadPercentage.value = 100;
            
            // 延迟关闭进度条
            setTimeout(() => {
              showUploadProgress.value = false;
            }, 500);
            
            resolve(file);
          }
        });
      });
    };

    // 处理收集前的照片变更
    const handlePhotoBeforeChange = async (file, fileList) => {
      // 更新文件列表（暂时）
      console.log('收集前照片变更:', file);
      console.log('当前文件列表:', fileList);
      
      // 先更新文件列表，确保UI显示所有文件
      fileListBefore.value = [...fileList];
      
      // 如果文件已经处理过，直接返回
      if (file.processed) {
        console.log('文件已处理过，跳过压缩:', file.name);
        return;
      }
      
      // 如果是新上传的文件，需要先处理
      if (file.raw && file.status === 'ready') {
        // 显示处理进度提示
        showUploadProgress.value = true;
        uploadStatus.value = '正在处理图片...';
        uploadPercentage.value = 0;
        
        console.log('开始处理收集前照片:', file.name, '类型:', file.raw.type, '大小:', (file.raw.size / 1024).toFixed(2), 'KB');
        
        try {
          // 使用Compressor直接处理图片
          const processedFile = await new Promise((resolve) => {
            new Compressor(file.raw, {
              quality: 0.6,           // 中等压缩 (0-1)
              maxWidth: 1920,         // 最大宽度
              maxHeight: 1920,        // 最大高度
              mimeType: 'image/jpeg', // 强制转换为JPEG
              convertSize: 0,         // 所有图片都转换格式
              // 报告进度
              beforeDraw() {
                uploadPercentage.value = 30;
                uploadStatus.value = '正在处理图片...';
                console.log('图片处理中...');
              },
              // 报告进度
              drew() {
                uploadPercentage.value = 60;
                uploadStatus.value = '正在压缩图片...';
                console.log('图片绘制完成');
              },
              success(result) {
                // 创建新的文件名（确保扩展名为.jpg）
                const fileName = file.raw.name.replace(/\.[^/.]+$/, "") + '.jpg';
                
                // 创建新的File对象
                const processedFile = new File([result], fileName, {
                  type: 'image/jpeg',
                  lastModified: new Date().getTime()
                });
                
                // 输出处理结果日志
                console.log('图片处理完成:');
                console.log('- 原始大小:', (file.raw.size / 1024).toFixed(2), 'KB');
                console.log('- 处理后大小:', (processedFile.size / 1024).toFixed(2), 'KB');
                console.log('- 压缩率:', Math.round((1 - processedFile.size / file.raw.size) * 100), '%');
                console.log('- 处理后文件类型:', processedFile.type);
                console.log('- 处理后文件名:', processedFile.name);
                
                // 处理完成
                uploadStatus.value = '图片处理完成';
                uploadPercentage.value = 100;
                
                resolve(processedFile);
              },
              error(err) {
                console.error('图片压缩失败:', err);
                // 如果处理失败，返回原始文件
                uploadStatus.value = '处理失败，使用原始图片';
                uploadPercentage.value = 100;
                
                resolve(file.raw);
              }
            });
          });
          
          // 替换原始文件
          console.log('替换原始文件为处理后的文件:', processedFile.name);
          
          // 标记文件为已处理
          file.processed = true;
          file.raw = processedFile;
          
          // 将处理后的文件添加到photoFilesBefore数组
          const existingIndex = photoFilesBefore.value.findIndex(f => f.uid === file.uid || f.name === file.name);
          if (existingIndex >= 0) {
            // 替换现有文件
            photoFilesBefore.value[existingIndex] = processedFile;
          } else {
            // 添加新文件
            photoFilesBefore.value.push(processedFile);
          }
          
          // 更新文件列表中对应的文件
          const fileIndex = fileListBefore.value.findIndex(f => f.uid === file.uid);
          if (fileIndex >= 0) {
            // 标记为已处理，避免重复处理
            fileListBefore.value[fileIndex].processed = true;
          }
          
          // 延迟关闭进度条
          setTimeout(() => {
            showUploadProgress.value = false;
          }, 500);
          
        } catch (error) {
          console.error('处理图片时出错:', error);
          ElMessage.warning('图片处理失败，将使用原始图片');
          
          // 添加原始文件到photoFilesBefore数组
          const existingIndex = photoFilesBefore.value.findIndex(f => f.uid === file.uid || f.name === file.name);
          if (existingIndex >= 0) {
            // 替换现有文件
            photoFilesBefore.value[existingIndex] = file.raw;
          } else {
            // 添加新文件
            photoFilesBefore.value.push(file.raw);
          }
          
          showUploadProgress.value = false;
        }
      } else if (!file.raw && file.url) {
        // 如果是已有的文件（有URL），不需要处理
        console.log('已有文件，不需要处理:', file.name);
      }
      
      // 检查是否有大文件
      checkForLargeFiles(fileList);
      
      // 确保文件有raw属性
      if (file.raw === undefined && file.status === 'ready') {
        file.raw = file.originFileObj || file;
        console.log('为收集前照片添加raw属性:', file.raw);
      }
      
      // 更新预览图片
      updatePreviewImages([...fileListBefore.value, ...fileListAfter.value]);
      
      console.log('更新后的fileListBefore:', fileListBefore.value);
      console.log('更新后的photoFilesBefore:', photoFilesBefore.value);
      
      return false; // 阻止自动上传
    };

    // 处理收集前的照片移除
    const handlePhotoBeforeRemove = (file, fileList) => {
      console.log('收集前照片移除:', file);
      
      // 更新fileListBefore
      fileListBefore.value = fileList;
      
      // 如果没有大文件了，隐藏警告
      if (!checkForLargeFiles([...fileListBefore.value, ...fileListAfter.value])) {
        showLargeFileWarning.value = false;
      }
      
      // 更新预览图片
      updatePreviewImages([...fileListBefore.value, ...fileListAfter.value]);
    };

    // 处理收集后的照片变更
    const handlePhotoAfterChange = async (file, fileList) => {
      // 更新文件列表（暂时）
      console.log('收集后照片变更:', file);
      console.log('当前文件列表:', fileList);
      
      // 先更新文件列表，确保UI显示所有文件
      fileListAfter.value = [...fileList];
      
      // 如果文件已经处理过，直接返回
      if (file.processed) {
        console.log('文件已处理过，跳过压缩:', file.name);
        return;
      }
      
      // 如果是新上传的文件，需要先处理
      if (file.raw && file.status === 'ready') {
        // 显示处理进度提示
        showUploadProgress.value = true;
        uploadStatus.value = '正在处理图片...';
        uploadPercentage.value = 0;
        
        console.log('开始处理收集后照片:', file.name, '类型:', file.raw.type, '大小:', (file.raw.size / 1024).toFixed(2), 'KB');
        
        try {
          // 使用Compressor直接处理图片
          const processedFile = await new Promise((resolve) => {
            new Compressor(file.raw, {
              quality: 0.6,           // 中等压缩 (0-1)
              maxWidth: 1920,         // 最大宽度
              maxHeight: 1920,        // 最大高度
              mimeType: 'image/jpeg', // 强制转换为JPEG
              convertSize: 0,         // 所有图片都转换格式
              // 报告进度
              beforeDraw() {
                uploadPercentage.value = 30;
                uploadStatus.value = '正在处理图片...';
                console.log('图片处理中...');
              },
              // 报告进度
              drew() {
                uploadPercentage.value = 60;
                uploadStatus.value = '正在压缩图片...';
                console.log('图片绘制完成');
              },
              success(result) {
                // 创建新的文件名（确保扩展名为.jpg）
                const fileName = file.raw.name.replace(/\.[^/.]+$/, "") + '.jpg';
                
                // 创建新的File对象
                const processedFile = new File([result], fileName, {
                  type: 'image/jpeg',
                  lastModified: new Date().getTime()
                });
                
                // 输出处理结果日志
                console.log('图片处理完成:');
                console.log('- 原始大小:', (file.raw.size / 1024).toFixed(2), 'KB');
                console.log('- 处理后大小:', (processedFile.size / 1024).toFixed(2), 'KB');
                console.log('- 压缩率:', Math.round((1 - processedFile.size / file.raw.size) * 100), '%');
                console.log('- 处理后文件类型:', processedFile.type);
                console.log('- 处理后文件名:', processedFile.name);
                
                // 处理完成
                uploadStatus.value = '图片处理完成';
                uploadPercentage.value = 100;
                
                resolve(processedFile);
              },
              error(err) {
                console.error('图片压缩失败:', err);
                // 如果处理失败，返回原始文件
                uploadStatus.value = '处理失败，使用原始图片';
                uploadPercentage.value = 100;
                
                resolve(file.raw);
              }
            });
          });
          
          // 替换原始文件
          console.log('替换原始文件为处理后的文件:', processedFile.name);
          
          // 标记文件为已处理
          file.processed = true;
          file.raw = processedFile;
          
          // 将处理后的文件添加到photoFilesAfter数组
          const existingIndex = photoFilesAfter.value.findIndex(f => f.uid === file.uid || f.name === file.name);
          if (existingIndex >= 0) {
            // 替换现有文件
            photoFilesAfter.value[existingIndex] = processedFile;
          } else {
            // 添加新文件
            photoFilesAfter.value.push(processedFile);
          }
          
          // 更新文件列表中对应的文件
          const fileIndex = fileListAfter.value.findIndex(f => f.uid === file.uid);
          if (fileIndex >= 0) {
            // 标记为已处理，避免重复处理
            fileListAfter.value[fileIndex].processed = true;
          }
          
          // 延迟关闭进度条
          setTimeout(() => {
            showUploadProgress.value = false;
          }, 500);
          
        } catch (error) {
          console.error('处理图片时出错:', error);
          ElMessage.warning('图片处理失败，将使用原始图片');
          
          // 添加原始文件到photoFilesAfter数组
          const existingIndex = photoFilesAfter.value.findIndex(f => f.uid === file.uid || f.name === file.name);
          if (existingIndex >= 0) {
            // 替换现有文件
            photoFilesAfter.value[existingIndex] = file.raw;
          } else {
            // 添加新文件
            photoFilesAfter.value.push(file.raw);
          }
          
          showUploadProgress.value = false;
        }
      } else if (!file.raw && file.url) {
        // 如果是已有的文件（有URL），不需要处理
        console.log('已有文件，不需要处理:', file.name);
      }
      
      // 检查是否有大文件
      checkForLargeFiles(fileList);
      
      // 确保文件有raw属性
      if (file.raw === undefined && file.status === 'ready') {
        file.raw = file.originFileObj || file;
        console.log('为收集后照片添加raw属性:', file.raw);
      }
      
      // 更新预览图片
      updatePreviewImages([...fileListBefore.value, ...fileListAfter.value]);
      
      console.log('更新后的fileListAfter:', fileListAfter.value);
      console.log('更新后的photoFilesAfter:', photoFilesAfter.value);
      
      return false; // 阻止自动上传
    };

    // 处理收集后的照片移除
    const handlePhotoAfterRemove = (file, fileList) => {
      console.log('收集后照片移除:', file);
      
      // 更新fileListAfter
      fileListAfter.value = fileList;
      
      // 如果没有大文件了，隐藏警告
      if (!checkForLargeFiles([...fileListBefore.value, ...fileListAfter.value])) {
        showLargeFileWarning.value = false;
      }
      
      // 更新预览图片
      updatePreviewImages([...fileListBefore.value, ...fileListAfter.value]);
    };

    // 更新预览图片
    const updatePreviewImages = (fileList) => {
      previewImages.value = fileList.map(file => {
        if (file.url) {
          console.log('预览图片URL:', file.url);
          return file.url;
        } else if (file.raw) {
          // 检查是否已经创建了Blob URL
          if (!file._blobUrl) {
            file._blobUrl = URL.createObjectURL(file.raw);
          }
          console.log('预览图片从raw创建:', file._blobUrl);
          return file._blobUrl;
        } else if (file instanceof File) {
          // 检查是否已经创建了Blob URL
          if (!file._blobUrl) {
            file._blobUrl = URL.createObjectURL(file);
          }
          console.log('预览图片从File创建:', file._blobUrl);
          return file._blobUrl;
        }
        return '';
      }).filter(url => url);
      
      console.log('预览图片列表:', previewImages.value);
    };

    // 处理图片预览
    const handlePictureCardPreview = (file) => {
      console.log('预览图片:', file);
      
      // 更新预览图片列表
      updatePreviewImages([...fileListBefore.value, ...fileListAfter.value]);
      
      // 找到当前图片在预览列表中的索引
      const index = previewImages.value.findIndex(url => {
        if (file.url) {
          return url === file.url;
        } else if (file.raw) {
          // 对于新上传的文件，需要比较Blob URL
          const blobUrl = URL.createObjectURL(file.raw);
          const result = url === blobUrl;
          // 释放Blob URL
          URL.revokeObjectURL(blobUrl);
          return result;
        }
        return false;
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

    // 检查是否有大文件
    const checkForLargeFiles = (files) => {
      const largeFileThreshold = 2 * 1024 * 1024; // 2MB
      return files.some(file => file.size > largeFileThreshold);
    };

    // 处理上传进度
    const handleUploadProgress = (progressEvent) => {
      if (progressEvent.total) {
        const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        uploadPercentage.value = percentage;
        
        if (percentage < 33) {
          uploadStatus.value = '正在上传文件...';
        } else if (percentage < 66) {
          uploadStatus.value = '正在处理文件...';
        } else if (percentage < 100) {
          uploadStatus.value = '即将完成...';
        } else {
          uploadStatus.value = '上传完成，正在保存...';
        }
      }
    };

    // 格式化百分比显示
    const percentageFormat = (percentage) => {
      return percentage === 100 ? '完成' : `${percentage}%`;
    };

    // 提交表单
    const submitForm = async () => {
      if (!recordForm.value) return;
      
      await recordForm.value.validate(async (valid) => {
        if (valid) {
          // 显示上传进度对话框
          uploadPercentage.value = 0;
          uploadStatus.value = '正在上传文件...';
          showUploadProgress.value = true;
          
          try {
            const formData = new FormData();
            formData.append('unitId', form.unitId);
            formData.append('wasteTypeId', form.wasteTypeId);
            formData.append('location', form.location);
            formData.append('collectionDate', form.collectionDate);
            formData.append('collectionTime', form.collectionTime);
            formData.append('quantity', form.quantity);
            formData.append('remarks', form.remarks || '');
            
            // 处理照片 - 根据后端逻辑，如果有新上传的照片，后端会删除所有旧照片
            // 因此，我们需要合并现有照片和新上传的照片
            
            // 处理收集前照片
            if (fileListBefore.value.length > 0) {
              const newFiles = fileListBefore.value.filter(file => file.raw);
              const existingFiles = fileListBefore.value.filter(file => !file.raw);
              
              // 如果有新上传的照片，我们需要将现有照片的URL转换为File对象
              if (newFiles.length > 0) {
                console.log('有新上传的收集前照片，需要合并现有照片');
                
                // 将新照片添加到formData
                newFiles.forEach(file => {
                  if (file.raw) {
                    console.log('添加新的收集前照片:', file.raw.name);
                    formData.append('photo_before', file.raw);
                  }
                });
                
                // 如果有现有照片，我们需要将它们的路径保存到photo_path_before字段
                if (existingFiles.length > 0) {
                  const existingPaths = existingFiles.map(file => {
                    // 确保URL是相对路径
                    let path = file.url;
                    const origin = window.location.origin;
                    if (path.startsWith(origin)) {
                      path = path.substring(origin.length);
                      // 确保路径以/开头
                      if (!path.startsWith('/')) {
                        path = '/' + path;
                      }
                    }
                    return path;
                  });
                  
                  console.log('保存现有收集前照片路径:', existingPaths);
                  formData.append('photo_path_before', JSON.stringify(existingPaths));
                }
              } else if (existingFiles.length > 0) {
                // 如果没有新上传的照片，只有现有照片，我们需要将它们的路径保存到photo_path_before字段
                const existingPaths = existingFiles.map(file => {
                  // 确保URL是相对路径
                  let path = file.url;
                  const origin = window.location.origin;
                  if (path.startsWith(origin)) {
                    path = path.substring(origin.length);
                    // 确保路径以/开头
                    if (!path.startsWith('/')) {
                      path = '/' + path;
                    }
                  }
                  return path;
                });
                
                console.log('保存现有收集前照片路径(无新照片):', existingPaths);
                formData.append('photo_path_before', JSON.stringify(existingPaths));
              }
            } else {
              // 如果没有照片，设置为空数组
              formData.append('photo_path_before', JSON.stringify([]));
            }
            
            // 处理收集后照片
            if (fileListAfter.value.length > 0) {
              const newFiles = fileListAfter.value.filter(file => file.raw);
              const existingFiles = fileListAfter.value.filter(file => !file.raw);
              
              // 如果有新上传的照片，我们需要将现有照片的URL转换为File对象
              if (newFiles.length > 0) {
                console.log('有新上传的收集后照片，需要合并现有照片');
                
                // 将新照片添加到formData
                newFiles.forEach(file => {
                  if (file.raw) {
                    console.log('添加新的收集后照片:', file.raw.name);
                    formData.append('photo_after', file.raw);
                  }
                });
                
                // 如果有现有照片，我们需要将它们的路径保存到photo_path_after字段
                if (existingFiles.length > 0) {
                  const existingPaths = existingFiles.map(file => {
                    // 确保URL是相对路径
                    let path = file.url;
                    const origin = window.location.origin;
                    if (path.startsWith(origin)) {
                      path = path.substring(origin.length);
                      // 确保路径以/开头
                      if (!path.startsWith('/')) {
                        path = '/' + path;
                      }
                    }
                    return path;
                  });
                  
                  console.log('保存现有收集后照片路径:', existingPaths);
                  formData.append('photo_path_after', JSON.stringify(existingPaths));
                }
              } else if (existingFiles.length > 0) {
                // 如果没有新上传的照片，只有现有照片，我们需要将它们的路径保存到photo_path_after字段
                const existingPaths = existingFiles.map(file => {
                  // 确保URL是相对路径
                  let path = file.url;
                  const origin = window.location.origin;
                  if (path.startsWith(origin)) {
                    path = path.substring(origin.length);
                    // 确保路径以/开头
                    if (!path.startsWith('/')) {
                      path = '/' + path;
                    }
                  }
                  return path;
                });
                
                console.log('保存现有收集后照片路径(无新照片):', existingPaths);
                formData.append('photo_path_after', JSON.stringify(existingPaths));
              }
            } else {
              // 如果没有照片，设置为空数组
              formData.append('photo_path_after', JSON.stringify([]));
            }
            
            // 打印FormData内容，用于调试
            console.log('FormData内容:');
            for (let [key, value] of formData.entries()) {
              if (value instanceof File) {
                console.log(`${key}: File - ${value.name} (${value.type}, ${value.size} bytes)`);
              } else {
                console.log(`${key}: ${value}`);
              }
            }
            
            // 根据是新增还是编辑选择不同的API
            if (form.recordId) {
              await httpService.putForm(
                `${apiConfig.endpoints.wasteRecords}/${form.recordId}`, 
                formData,
                handleUploadProgress
              );
              ElMessage.success('废物记录更新成功');
            } else {
              await httpService.postForm(
                apiConfig.endpoints.wasteRecords, 
                formData,
                handleUploadProgress
              );
              ElMessage.success('废物记录添加成功');
            }
            
            // 关闭上传进度对话框
            showUploadProgress.value = false;
            
            // 返回列表页
            goBack();
          } catch (error) {
            console.error('提交表单失败:', error);
            if (error.response && error.response.data) {
              console.error('服务器返回错误:', error.response.data);
              ElMessage.error(`提交表单失败: ${error.response.data.error || '未知错误'}`);
            } else {
              ElMessage.error('提交表单失败，请检查网络连接');
            }
            showUploadProgress.value = false;
          }
        } else {
          console.log('表单验证失败');
          ElMessage.error('请填写所有必填字段');
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
      fileListBefore,
      fileListAfter,
      photoFilesBefore,
      photoFilesAfter,
      previewImages,
      showViewer,
      previewIndex,
      isNew,
      isSuperAdmin,
      parsePhotoPath,
      handlePhotoBeforeChange,
      handlePhotoBeforeRemove,
      handlePhotoAfterChange,
      handlePhotoAfterRemove,
      handlePictureCardPreview,
      handleBeforeUpload,
      closeViewer,
      submitForm,
      goBack,
      showUploadProgress,
      uploadPercentage,
      uploadStatus,
      percentageFormat,
      showLargeFileWarning
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
  background: linear-gradient(135deg, #42a5f5, #1976d2);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 0 0 20px 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
}

.header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%);
  z-index: 1;
}

.header h1 {
  position: relative;
  z-index: 2;
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  letter-spacing: 1px;
}

.back-button {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  position: relative;
  z-index: 2;
  background-color: rgba(255, 255, 255, 0.15);
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.back-button:hover {
  background-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
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

.upload-warning {
  margin-bottom: 10px;
}

.upload-progress {
  text-align: center;
  padding: 10px;
}

.upload-status {
  margin-top: 10px;
  color: #606266;
  font-size: 14px;
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
