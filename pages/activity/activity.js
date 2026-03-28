const app = getApp();

Page({
  data: {
    currentTab: 'upcoming',
    eventsList: [],
    loading: true
  },
  
  onLoad() {
    this.fetchEvents();
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
  },

  fetchEvents() {
    this.setData({ loading: true });
    
    if(app.globalData.apiUrl.includes("YOUR_BACKEND")) {
       this.setData({ loading: false });
       return;
    }

    wx.request({
      url: app.globalData.apiUrl + '/api/events',
      method: 'GET',
      success: (res) => {
        if (res.data && res.data.status === 'success') {
          // 清洗时间格式
          const list = res.data.data.map(item => {
             const d = new Date(item.created_at);
             item.created_at = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
             return item;
          });
          this.setData({ eventsList: list });
        }
      },
      fail: () => {
        wx.showToast({ title: '活动拿取失败', icon: 'none' });
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  }
})