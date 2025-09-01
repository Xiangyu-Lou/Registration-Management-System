import { ElNotification } from 'element-plus';
import { h } from 'vue';
import router from '../router'; // 导入路由实例以便进行导航

// --- UI & Performance Enhancements ---
// 1. Throttling: Prevents notification spam.
let isNotificationVisible = false;
const NOTIFICATION_COOLDOWN = 3000; // 3 seconds

// 2. Icons: Specific icons for different notification types.
const notificationIcons = {
  success: 'el-icon-success', // Using built-in icons
  warning: 'el-icon-warning',
  error: 'el-icon-error',
  info: 'el-icon-info-filled',
};

const notificationService = {
  socket: null,
  wsUrl: '',
  reconnectAttempts: 0,
  maxReconnectAttempts: 10,
  reconnectInterval: 5000, // 5 seconds

  initialize() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    this.wsUrl = `${protocol}//${host}`;

    this.connect();

    // 3. Resource Cleanup: Close WebSocket connection on page unload.
    window.addEventListener('beforeunload', () => {
      this.close();
    });
  },

  connect() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket is already connected.');
      return;
    }

    console.log(`Connecting to WebSocket at ${this.wsUrl}...`);
    this.socket = new WebSocket(this.wsUrl);

    this.socket.onopen = () => {
      console.log('WebSocket connection established.');
      ElNotification({
        title: 'Connection Status',
        message: 'Real-time notification service connected!',
        type: 'success',
        icon: notificationIcons.success,
        duration: 2000,
      });
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleNotification(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket connection closed.');
      this.handleReconnect();
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      // The 'close' event will be fired automatically after an error.
    };
  },

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect in ${this.reconnectInterval / 1000}s... (Attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.connect(), this.reconnectInterval);
    } else {
      console.error('Max reconnect attempts reached. Could not connect to WebSocket.');
      ElNotification({
        title: 'Connection Failed',
        message: 'Could not connect to the real-time notification service. Please refresh the page to try again.',
        type: 'error',
        icon: notificationIcons.error,
        duration: 0, 
      });
    }
  },

  handleNotification(notification) {
    // --- Notification Throttling ---
    if (isNotificationVisible) {
      console.log('Notification throttled. Another notification is still on cooldown.');
      return; // Skip if a notification was shown recently
    }

    let title = 'System Notification';
    let message = 'You have a new message.';
    let type = 'info';

    switch (notification.type) {
      case 'NEW_WASTE_RECORD':
        title = 'New Waste Record';
        message = `A new record was added for unit "${notification.payload.unit_name}".`;
        type = 'success';
        break;
      case 'UPDATE_WASTE_RECORD':
        title = 'Record Updated';
        message = `A record for unit "${notification.payload.unit_name}" was updated.`;
        type = 'warning';
        break;
      case 'DELETE_WASTE_RECORD':
        title = 'Record Deleted';
        message = `A record for unit "${notification.payload.unitName}" was deleted.`;
        type = 'error';
        break;
      default:
        console.log('Received unknown notification type:', notification.type);
        return; 
    }

    ElNotification({
      title: title,
      message: h('p', null, message),
      type: type,
      icon: notificationIcons[type],
      duration: 4500,
      position: 'bottom-right',
      onClick: () => {
        // 4. Interactivity: Navigate to the records list on click
        router.push({ name: 'WasteRecordList' }); 
      },
    });
    
    // Activate cooldown
    isNotificationVisible = true;
    setTimeout(() => {
      isNotificationVisible = false;
    }, NOTIFICATION_COOLDOWN);
  },

  close() {
    if (this.socket) {
      console.log('Closing WebSocket connection.');
      this.socket.close();
    }
  }
};

export default notificationService;
