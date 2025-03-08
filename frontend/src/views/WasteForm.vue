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
            :controls="false"
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
import { ArrowLeft, Document, Plus, Clock } from '@element-plus/icons-vue';
import auth from '../store/auth';
import Compressor from 'compressorjs';

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
    const wasteForm = ref(null);
    const loading = ref(false);
    const unitName = ref('');
    const wasteTypes = ref([]);
    const photoFilesBefore = ref([]);
    const photoFilesAfter = ref([]);
    const fileListBefore = ref([]);
    const fileListAfter = ref([]);
    const showUploadProgress = ref(false);
    const uploadPercentage = ref(0);
    const uploadStatus = ref('准备上传...');
    const showLargeFileWarning = ref(false);
    
    // 检查用户是否为超级管理员
    const isAdmin = computed(() => {
      return auth.state.isLoggedIn && auth.state.user.role_id === 3;
    });

    // 初始化表单，将日期和时间分开
    const form = reactive({
      wasteTypeId: '',
      location: '',
      collectionDate: new Date().toISOString().slice(0, 10), // 默认为当天
      collectionTime: '08:00',
      quantity: undefined,
      photo_before: [],
      photo_after: [],
      remarks: ''
    });

    const rules = {
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

      await fetchUnitName();
      await fetchWasteTypes();
    });

    onBeforeUnmount(() => {
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

    const fetchUnitName = async () => {
      try {
        const response = await httpService.get(apiConfig.endpoints.units);
        const unit = response.data.find(u => u.id === parseInt(props.id));
        if (unit) {
          unitName.value = unit.name;
        }
      } catch (error) {
        console.error('Error fetching unit name:', error);
        ElMessage.error('获取单位信息失败');
      }
    };

    const fetchWasteTypes = async () => {
      try {
        const response = await httpService.get(apiConfig.endpoints.wasteTypes);
        wasteTypes.value = response.data;
      } catch (error) {
        console.error('Error fetching waste types:', error);
        ElMessage.error('获取废物类型失败');
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

    // 处理收集前照片变更
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
          
          // 将处理后的文件添加到photoFilesBefore
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
          
          // 添加原始文件
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
      
      // 检查是否有大文件需要显示警告
      const allFiles = [...photoFilesBefore.value, ...photoFilesAfter.value];
      showLargeFileWarning.value = checkForLargeFiles(allFiles);
      
      console.log('更新后的photoFilesBefore:', photoFilesBefore.value);
      console.log('更新后的fileListBefore:', fileListBefore.value);
    };

    // 处理收集前照片移除
    const handlePhotoBeforeRemove = (file, fileList) => {
      console.log('收集前照片移除:', file);
      fileListBefore.value = fileList;
      
      // 从photoFilesBefore中移除被删除的文件
      if (file.raw) {
        photoFilesBefore.value = photoFilesBefore.value.filter(f => 
          f.name !== file.raw.name
        );
      } else {
        // 如果没有raw属性，可能是已经处理过的文件，使用uid或name来匹配
        photoFilesBefore.value = photoFilesBefore.value.filter(f => 
          f.uid !== file.uid && f.name !== file.name
        );
      }
      
      // 如果没有大文件了，隐藏警告
      if (!checkForLargeFiles([...photoFilesBefore.value, ...photoFilesAfter.value])) {
        showLargeFileWarning.value = false;
      }
      
      console.log('更新后的photoFilesBefore:', photoFilesBefore.value);
    };

    // 处理收集后照片变更
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
          
          // 将处理后的文件添加到photoFilesAfter
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
          
          // 添加原始文件
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
      
      // 检查是否有大文件需要显示警告
      const allFiles = [...photoFilesBefore.value, ...photoFilesAfter.value];
      showLargeFileWarning.value = checkForLargeFiles(allFiles);
      
      console.log('更新后的photoFilesAfter:', photoFilesAfter.value);
      console.log('更新后的fileListAfter:', fileListAfter.value);
    };

    // 处理收集后照片移除
    const handlePhotoAfterRemove = (file, fileList) => {
      console.log('收集后照片移除:', file);
      fileListAfter.value = fileList;
      
      // 从photoFilesAfter中移除被删除的文件
      if (file.raw) {
        photoFilesAfter.value = photoFilesAfter.value.filter(f => 
          f.name !== file.raw.name
        );
      } else {
        // 如果没有raw属性，可能是已经处理过的文件，使用uid或name来匹配
        photoFilesAfter.value = photoFilesAfter.value.filter(f => 
          f.uid !== file.uid && f.name !== file.name
        );
      }
      
      // 如果没有大文件了，隐藏警告
      if (!checkForLargeFiles([...photoFilesBefore.value, ...photoFilesAfter.value])) {
        showLargeFileWarning.value = false;
      }
      
      console.log('更新后的photoFilesAfter:', photoFilesAfter.value);
    };

    // 检查是否有大文件
    const checkForLargeFiles = (files) => {
      const largeFileThreshold = 5 * 1024 * 1024; // 5MB
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

    const submitForm = () => {
      wasteForm.value.validate(async (valid) => {
        if (valid) {
          loading.value = true;
          try {
            const formData = new FormData();
            formData.append('unitId', props.id);
            formData.append('wasteTypeId', form.wasteTypeId);
            formData.append('location', form.location);
            
            // 组合日期和时间，如果有的话
            if (form.collectionDate && form.collectionTime) {
              formData.append('collectionDate', form.collectionDate);
              formData.append('collectionTime', form.collectionTime);
            }
            formData.append('quantity', form.quantity);
            
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
              location: form.location,
              quantity: form.quantity,
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

            ElMessage.success('废物记录提交成功');
            resetForm();
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
      photoFilesBefore.value = [];
      photoFilesAfter.value = [];
      fileListBefore.value = [];
      fileListAfter.value = [];
      form.quantity = undefined;
      form.collectionDate = new Date().toISOString().slice(0, 10); // 重置为今天
      form.collectionTime = '08:00'; // 重置为默认时间
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
      // 使用setTimeout确保DOM已完全渲染
      setTimeout(() => {
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
      showLargeFileWarning
    };
  }
};
</script>

<style scoped>
.waste-form-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.header {
  background-color: #409EFF;
  color: white;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.header h1 {
  font-size: 18px;
  margin: 0;
  font-weight: 500;
}

.back-button, .view-records {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  white-space: nowrap;
}

.content {
  flex: 1;
  padding: 16px;
  max-width: 100%;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.unit-info {
  text-align: center;
  margin-bottom: 16px;
}

.unit-info h2 {
  color: #333;
  border-bottom: 2px solid #409EFF;
  display: inline-block;
  padding-bottom: 5px;
  font-size: 18px;
  margin: 0;
}

.waste-form {
  background-color: #ffffff;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (min-width: 768px) {
  .form-row {
    flex-direction: row;
  }
  
  .date-item, .time-item {
    flex: 1;
  }
  
  .content {
    padding: 24px;
    max-width: 800px;
  }
  
  .header h1 {
    font-size: 22px;
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
  color: #666;
  margin-bottom: 8px;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
}

.submit-btn, .reset-btn {
  width: 45%;
  height: 44px;
  font-size: 16px;
  border-radius: 8px;
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
  background-color: #f5f5f5;
  padding: 12px;
  text-align: center;
  color: #666;
  font-size: 12px;
}

:deep(.el-form-item__label) {
  font-size: 15px;
  font-weight: 500;
  color: #333;
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
  margin-bottom: 20px;
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
