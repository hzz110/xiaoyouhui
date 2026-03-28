// pages/record/record.js
const app = getApp();

Page({
  data: {
    records: [],
    loading: true
  },
  onLoad() {
    this.fetchRecords();
  },
  onPullDownRefresh() {
    this.fetchRecords().then(() => wx.stopPullDownRefresh());
  },
  fetchRecords() {
    return new Promise((resolve) => {
      wx.request({
        url: `${app.globalData.apiUrl}/api/records`,
        method: 'GET',
        success: (res) => {
          if(res.data && res.data.status === 'success') {
             const processedRecords = res.data.data.map(item => ({
               ...item,
               plain_content: (item.html_content || '').replace(/<[^>]+>/g, '').trim()
             }));
             this.setData({ records: processedRecords });
          }
          this.setData({ loading: false });
          resolve();
        },
        fail: () => {
          this.setData({ loading: false });
          wx.showToast({ title: '网络连接失败', icon: 'none' });
          resolve();
        }
      });
    });
  },
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/record-detail/record-detail?id=${id}` });
  }
})