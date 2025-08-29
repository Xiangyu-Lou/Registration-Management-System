
import { ElNotification } from 'element-plus';

const notificationService = {
  ws: null,
  url: null,
  reconnectInterval: 5000, // 5秒后重连
  reconnectAttempts: 0,
  maxReconnectAttempts: 10,

  initialize() {
    // 从当前浏览器地址动态生成WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.url = `${protocol}//${window.location.host}`;
    this.connect();
  },

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket 已连接。');
      return;
    }

    console.log(`正在连接到 ${this.url}...`);
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('✅ WebSocket 连接成功！');
      this.reconnectAttempts = 0; // 重置重连尝试次数
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('收到通知:', message);
        this.handleNotification(message);
      } catch (error) {
        console.error('处理消息时出错:', error);
      }
    };

    this.ws.onclose = () => {
      console.warn('WebSocket 连接已关闭。');
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket 发生错误:', error);
      this.ws.close(); // 触发 onclose 来处理重连
    };
  },

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`尝试重新连接... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => this.connect(), this.reconnectInterval);
    } else {
      console.error('已达到最大重连次数，停止重连。');
      ElNotification({
        title: '网络通知已断开',
        message: '无法连接到实时通知服务，请刷新页面重试。',
        type: 'error',
        duration: 0, // 永久显示直到用户关闭
      });
    }
  },

  handleNotification(message) {
    let title = '系统通知';
    let notifMessage = '';

    switch (message.type) {
      case 'NEW_WASTE_RECORD':
        title = '新废物记录';
        notifMessage = `单位 “${message.payload.unit_name}” 添加了一条新的废物记录。`;
        break;
      case 'UPDATE_WASTE_RECORD':
        title = '记录已更新';
        notifMessage = `单位 “${message.payload.unit_name}” 的一条废物记录已被更新。`;
        break;
      case 'DELETE_WASTE_RECORD':
        title = '记录已删除';
        notifMessage = `单位 “${message.payload.unitName}” 的一条废物记录已被删除。`;
        break;
      default:
        return; // 如果消息类型未知，则不显示通知
    }

    ElNotification({
      title: title,
      message: notifMessage,
      type: 'info',
      duration: 6000, // 显示6秒
      position: 'bottom-right',
    });
  },

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.error('WebSocket 未连接，无法发送消息。');
    }
  },
};

export default notificationService;
