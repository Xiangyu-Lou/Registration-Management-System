<template>
  <div class="edit-record-container">
    <div class="header">
      <div v-if="!isSupervisor" class="back-button" @click="goBack">
        <el-icon><arrow-left /></el-icon> 查看记录
      </div>
      <div v-else></div>
      <h1>{{ isNew ? '新增废物记录' : '编辑废物记录' }}</h1>
      <div v-if="isSupervisor" class="back-button supervisor-back-button" @click="goBack">
        查看记录
      </div>
      <div v-else></div>
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
        <!-- 如果用户是超级管理员，显示单位选择 -->
        <el-form-item label="单位" prop="unitId" v-if="isAdmin">
          <el-select v-model="form.unitId" placeholder="请选择单位" style="width: 100%">
            <el-option 
              v-for="unit in units" 
              :key="unit.id" 
              :label="unit.name" 
              :value="unit.id" 
            />
          </el-select>
          <div class="form-tip" v-if="isNew">请先选择单位，才能选择产生地点</div>
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

        <el-form-item label="产生工序" prop="process">
          <el-select v-model="form.process" placeholder="请选择产生工序" style="width: 100%">
            <el-option 
              v-for="option in processOptions" 
              :key="option" 
              :label="option" 
              :value="option" 
            />
          </el-select>
          <!-- 自定义产生工序输入框 -->
          <el-input 
            v-if="form.process === '其他'" 
            v-model="customProcess" 
            placeholder="请输入具体产生工序" 
            style="margin-top: 10px; height: 40px;"
          />
        </el-form-item>

        <el-form-item label="产生地点" prop="location">
          <el-select v-model="form.location" :placeholder="isAdmin && !unitName ? '请先选择单位' : '请选择废物产生地点'" style="width: 100%" :disabled="isAdmin && !unitName">
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

        <el-form-item label="备注" prop="remarks">
          <el-input 
            v-model="form.remarks" 
            type="textarea" 
            :rows="1"
            placeholder="请输入备注信息（选填）" 
          />
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
import { ref, reactive, onMounted, computed, watch } from 'vue';
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
    const record = ref(null);
    const locationOptions = ref([]);
    const customLocation = ref('');
    const customProcess = ref('');
    const processOptions = ['作业现场', '清罐清理', '报废清理', '管线刺漏', '历史遗留', '日常维护', '封井退出', '其他'];
    
    // 添加跟踪被删除照片的变量
    const deletedPhotosBefore = ref([]);
    const deletedPhotosAfter = ref([]);
    const originalPhotosBefore = ref([]);
    const originalPhotosAfter = ref([]);
    
    // 各管理区对应的四级单位列表
    const locationMap = {
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
      '单位1': ['注采站a', '注采站b', '其他'],
      '其他': ['其他']
    };
    
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
    
    // 检查用户是否为管理员（系统超级管理员、公司管理员或监督人员）
    const isAdmin = computed(() => {
      return auth.state.isLoggedIn && (auth.state.user.role_id === 3 || auth.state.user.role_id === 4 || auth.state.user.role_id === 5);
    });
    
    // 检查用户是否为监督人员
    const isSupervisor = computed(() => {
      return auth.state.isLoggedIn && auth.state.user.role_id === 4;
    });
    
    // 表单数据
    const form = reactive({
      unitId: '',
      wasteTypeId: '',
      location: '',
      collectionDate: '',
      collectionTime: '',
      quantity: undefined,
      recordId: null,
      creatorId: auth.state.user?.id || null,
      photo_path_before: '',
      photo_path_after: '',
      remarks: '',
      process: ''
    });

    const rules = {
      unitId: [
        { 
          required: true, 
          message: '请选择单位', 
          trigger: 'change',
          validator: (rule, value, callback) => {
            // 只有超级管理员才需要验证单位选择
            if (isAdmin.value) {
              if (!value) {
                callback(new Error('请选择单位'));
              } else {
                callback();
              }
            } else {
              // 非超级管理员不需要验证
              callback();
            }
          }
        }
      ],
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
      loading.value = true;
      
      try {
        // 获取废物类型
        await fetchWasteTypes();
        
        // 如果是超级管理员，获取所有单位
        if (isAdmin.value) {
          await fetchUnits();
        }
        
        // 如果是新增记录
        if (isNew.value) {
          // 新增记录默认使用当前用户的单位（非超级管理员）
          if (!isAdmin.value && auth.state.user) {
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
          
          // 获取到单位名称后，更新地点选项
          if (locationMap[unitName.value]) {
            locationOptions.value = locationMap[unitName.value];
          } else {
            locationOptions.value = [];
            console.warn(`未找到管理区 "${unitName.value}" 的地点选项`);
          }
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
        
        record.value = response.data; // 保存原始记录数据
        const recordData = response.data;
        console.log('获取到的记录详情:', recordData);
        
        form.unitId = recordData.unit_id;
        form.wasteTypeId = recordData.waste_type_id;
        
        // 获取单位名称和地点选项
        await fetchUnitName(form.unitId);
        
        // 处理产生工序 - 如果工序不在预设选项中，则设为"其他"并填写自定义工序
        if (recordData.process) {
          if (processOptions.includes(recordData.process)) {
            form.process = recordData.process;
          } else {
            form.process = '其他';
            customProcess.value = recordData.process;
          }
        }
        
        // 处理产生地点 - 如果地点不在预设选项中，则设为"其他"并填写自定义地点
        if (locationOptions.value.includes(recordData.location)) {
        form.location = recordData.location;
        } else {
          form.location = '其他';
          customLocation.value = recordData.location;
        }
        
        form.recordId = recordData.id;
        
        // 处理收集时间
        if (recordData.collection_start_time) {
          // 修复时区问题：直接按照字符串格式处理，避免时区转换
          const timeString = recordData.collection_start_time;
          console.log('原始时间字符串:', timeString);
          
          // 如果是 YYYY-MM-DD HH:mm:ss 格式
          if (timeString.includes(' ')) {
            const [datePart, timePart] = timeString.split(' ');
            form.collectionDate = datePart;
            form.collectionTime = timePart.substring(0, 5); // 只取HH:mm部分
            console.log('解析后日期:', datePart, '时间:', timePart.substring(0, 5));
          } else {
            // 如果只是日期格式，或者其他格式，尝试用原来的方法但修正时区
            const dateTime = new Date(timeString + (timeString.includes('T') ? '' : 'T00:00:00'));
            // 使用本地时区的方法，避免UTC转换
            const year = dateTime.getFullYear();
            const month = String(dateTime.getMonth() + 1).padStart(2, '0');
            const day = String(dateTime.getDate()).padStart(2, '0');
            const hours = String(dateTime.getHours()).padStart(2, '0');
            const minutes = String(dateTime.getMinutes()).padStart(2, '0');
            
            form.collectionDate = `${year}-${month}-${day}`;
            form.collectionTime = `${hours}:${minutes}`;
            console.log('解析后日期:', form.collectionDate, '时间:', form.collectionTime);
          }
        }
        
        form.quantity = recordData.quantity;
        
        // 添加备注字段赋值
        form.remarks = recordData.remarks || '';
        console.log('设置备注字段:', recordData.remarks);
        
        // 处理照片
        if (recordData.photo_path_before) {
          console.log('收集前照片路径:', recordData.photo_path_before);
          const photoPaths = parsePhotoPath(recordData.photo_path_before);
          console.log('解析后的收集前照片路径:', photoPaths);
          
          // 保存原始照片路径用于删除跟踪
          originalPhotosBefore.value = [...photoPaths];
          
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
              url: fullUrl,
              originalPath: path // 保存原始路径
            };
          });
        }
        
        if (recordData.photo_path_after) {
          console.log('收集后照片路径:', recordData.photo_path_after);
          const photoPaths = parsePhotoPath(recordData.photo_path_after);
          console.log('解析后的收集后照片路径:', photoPaths);
          
          // 保存原始照片路径用于删除跟踪
          originalPhotosAfter.value = [...photoPaths];
          
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
              url: fullUrl,
              originalPath: path // 保存原始路径
            };
          });
        }
        
        // 获取单位名称
        unitName.value = recordData.unit_name;
        
        // 设置创建时间
        createdAt.value = recordData.created_at;
        
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
      
      // 如果删除的是原有照片（有originalPath），记录到删除列表中
      if (file.originalPath) {
        console.log('记录要删除的收集前照片:', file.originalPath);
        deletedPhotosBefore.value.push(file.originalPath);
      }
      
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
      
      // 如果删除的是原有照片（有originalPath），记录到删除列表中
      if (file.originalPath) {
        console.log('记录要删除的收集后照片:', file.originalPath);
        deletedPhotosAfter.value.push(file.originalPath);
      }
      
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
            
            formData.append('collectionDate', form.collectionDate);
            formData.append('collectionTime', form.collectionTime);
            
            // 只有当quantity有值时才添加到formData
            if (form.quantity !== undefined && form.quantity !== null && form.quantity !== '') {
            formData.append('quantity', form.quantity);
            }
            
            formData.append('remarks', form.remarks || '');
            
            // 如果是编辑模式，发送要删除的照片列表
            if (!isNew.value) {
              if (deletedPhotosBefore.value.length > 0) {
                console.log('发送要删除的收集前照片列表:', deletedPhotosBefore.value);
                formData.append('photos_to_remove_before', JSON.stringify(deletedPhotosBefore.value));
              }
              
              if (deletedPhotosAfter.value.length > 0) {
                console.log('发送要删除的收集后照片列表:', deletedPhotosAfter.value);
                formData.append('photos_to_remove_after', JSON.stringify(deletedPhotosAfter.value));
              }
            }
            
            // 处理照片 - 使用新的删除跟踪逻辑
            
            // 处理收集前照片
            if (fileListBefore.value.length > 0) {
              const newFiles = fileListBefore.value.filter(file => file.raw);
              const existingFiles = fileListBefore.value.filter(file => !file.raw && file.originalPath);
              
              // 添加新上传的照片
                newFiles.forEach(file => {
                  if (file.raw) {
                    console.log('添加新的收集前照片:', file.raw.name);
                    formData.append('photo_before', file.raw);
                  }
                });
                
              // 如果有保留的现有照片，添加它们的路径
                if (existingFiles.length > 0) {
                const existingPaths = existingFiles.map(file => file.originalPath);
                console.log('保留的收集前照片路径:', existingPaths);
                  formData.append('photo_path_before', JSON.stringify(existingPaths));
                }
            } else if (!isNew.value && originalPhotosBefore.value.length > 0) {
              // 如果原本有照片但现在列表为空，表示用户删除了所有照片
              console.log('用户删除了所有收集前照片，发送NULL标记');
              formData.append('photo_path_before', 'NULL');
            }
            
            // 处理收集后照片
            if (fileListAfter.value.length > 0) {
              const newFiles = fileListAfter.value.filter(file => file.raw);
              const existingFiles = fileListAfter.value.filter(file => !file.raw && file.originalPath);
              
              // 添加新上传的照片
                newFiles.forEach(file => {
                  if (file.raw) {
                    console.log('添加新的收集后照片:', file.raw.name);
                    formData.append('photo_after', file.raw);
                  }
                });
                
              // 如果有保留的现有照片，添加它们的路径
                if (existingFiles.length > 0) {
                const existingPaths = existingFiles.map(file => file.originalPath);
                console.log('保留的收集后照片路径:', existingPaths);
                  formData.append('photo_path_after', JSON.stringify(existingPaths));
                }
            } else if (!isNew.value && originalPhotosAfter.value.length > 0) {
              // 如果原本有照片但现在列表为空，表示用户删除了所有照片
              console.log('用户删除了所有收集后照片，发送NULL标记');
              formData.append('photo_path_after', 'NULL');
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
              ElMessage.success('废物记录更新成功！正在跳转到记录列表...');
            } else {
              await httpService.postForm(
                apiConfig.endpoints.wasteRecords, 
                formData,
                handleUploadProgress
              );
              ElMessage.success('废物记录添加成功！正在跳转到记录列表...');
            }
            
            // 关闭上传进度对话框
            showUploadProgress.value = false;
            
            // 延迟跳转，让用户看到成功消息
            setTimeout(() => {
              // 根据用户角色跳转到相应的记录查看页面
              if (auth.state.isLoggedIn && auth.state.user) {
                const userRole = auth.state.user.role_id;
                
                if (userRole === 3 || userRole === 4) {
                  // 超级管理员 - 跳转到管理员记录页面
                  router.push('/admin-records');
                } else if (userRole === 2) {
                  // 单位管理员 - 跳转到单位记录列表
                  router.push({ 
                    name: 'RecordsList', 
                    params: { unitId: auth.state.user.unit_id } 
                  });
                } else if (userRole === 1) {
                  // 普通员工 - 跳转到个人记录列表
                  router.push({ 
                    name: 'RecordsList', 
                    params: { unitId: auth.state.user.unit_id } 
                  });
                } else {
                  // 其他角色，默认跳转到记录列表
                  router.push({ 
                    name: 'RecordsList', 
                    params: { unitId: auth.state.user.unit_id } 
                  });
                }
              } else {
                // 未登录用户，使用原有的goBack逻辑
            goBack();
              }
            }, 1500); // 1.5秒后跳转
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
      // 根据用户角色决定返回的页面
      if (auth.state.user.role_id === 5) {
        // 系统超级管理员返回到系统管理页面
        router.push({ name: 'SuperAdminRecords' });
      } else if (auth.state.user.role_id === 3 || auth.state.user.role_id === 4) {
        // 公司管理员和监督人员返回到公司管理页面
        router.push({ name: 'AdminRecords' });
      } else if (auth.state.user.unit_id) {
        // 单位管理员和基层员工返回到记录列表页面
        router.push({ 
          name: 'RecordsList', 
          params: { unitId: auth.state.user.unit_id } 
        });
      } else {
        // 没有单位的用户返回到单位选择页面
        router.push({ name: 'UnitSelection' });
      }
    };

    // 监听unitId变化，更新locationOptions
    watch(() => form.unitId, async (newUnitId) => {
      if (newUnitId) {
        await fetchUnitName(newUnitId);
      } else {
        // 清空地点选项
        locationOptions.value = [];
        unitName.value = '';
      }
    });

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
      isAdmin,
      isSupervisor,
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
      showLargeFileWarning,
      record,
      locationOptions,
      locationMap,
      customLocation,
      customProcess,
      processOptions,
      deletedPhotosBefore,
      deletedPhotosAfter,
      originalPhotosBefore,
      originalPhotosAfter
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
  background-color: rgba(255, 255, 255, 0.25);
  padding: 8px 14px;
  border-radius: 8px;
  transition: all 0.3s ease;
  border: 1.5px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  letter-spacing: 0.3px;
}

.back-button:hover {
  background-color: rgba(255, 255, 255, 0.35);
  transform: translateY(-2px);
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.25);
  border-color: rgba(255, 255, 255, 0.8);
}

.supervisor-back-button {
  justify-content: center;
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

.record-form :deep(.el-input__wrapper) {
  box-sizing: border-box;
  height: 40px !important;
  line-height: normal;
}

.record-form :deep(.el-input__inner) {
  height: 40px !important;
  line-height: 40px;
}

.record-form :deep(.el-textarea__inner) {
  height: auto !important; /* 让textarea可以自适应行数设置 */
  min-height: 32px; /* 最小高度与单行输入框一致 */
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

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
  line-height: 1.2;
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
