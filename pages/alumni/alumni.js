const app = getApp();

Page({
  data: {
    alumniList: [],
    loading: true
  },
  
  onLoad() {
    this.fetchAlumni();
  },

  fetchAlumni() {
    this.setData({ loading: true });
    // 拦截默认报错，增加校验体验提示
    if(app.globalData.apiUrl.includes("YOUR_BACKEND")) {
       wx.showModal({
         title: '未配置 API',
         content: '请先在 app.js 中替换真实部署的 worker 网址 URL。现仅为您展示空白状态。',
         showCancel: false
       });
       this.setData({ loading: false });
       return;
    }

    // 真正向云端网络开火
    wx.request({
      url: app.globalData.apiUrl + '/api/alumni',
      method: 'GET',
      success: (res) => {
        if (res.data && res.data.status === 'success') {
          this.setData({ alumniList: res.data.data });
        } else {
          wx.showToast({ title: '数据读取不合法', icon: 'none' });
        }
      },
      fail: (err) => {
        console.error('网络请求被阻断:', err);
        wx.showToast({ title: '网络请求失踪了', icon: 'none' });
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  addAlumni() {
    wx.showToast({
      title: '需要在新的后台填表接口',
      icon: 'none'
    });
  },
  filterAlumni() {
    // 搜索逻辑预留
  },
  viewDetail(e) {
    wx.showToast({
      title: '前往详情页...',
      icon: 'none'
    });
  }
})