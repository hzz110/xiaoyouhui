const app = getApp();

Page({
  data: {
    latestEvent: null,
    loading: true
  },
  
  onLoad() {
    this.fetchLatestEvent();
  },

  onShow() {
    this.fetchLatestEvent();
  },

  fetchLatestEvent() {
    this.setData({ loading: true });
    
    if (app.globalData.apiUrl.includes("YOUR_BACKEND")) {
      this.setData({ loading: false });
      return;
    }

    wx.request({
      url: app.globalData.apiUrl + '/api/events',
      method: 'GET',
      success: (res) => {
        if (res.data && res.data.status === 'success' && res.data.data.length > 0) {
          const firstEvent = res.data.data[0];
          const d = new Date(firstEvent.created_at);
          firstEvent.created_at = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
          this.setData({ latestEvent: firstEvent });
        }
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  goToActivity() {
    wx.redirectTo({
      url: '/pages/activity/activity'
    });
  },

  showNotification() {
    wx.showToast({
      title: '没有新通知哦',
      icon: 'none'
    });
  },

  notAvailable() {
    wx.showModal({
      title: '管理提示',
      content: '为了保证数据严谨性与审核流程，小程序端暂不开放发布！请移步到专为您开发的 PC 独立 Web 后台大屏进行高级发布和管理操作。',
      showCancel: false
    });
  }
});
