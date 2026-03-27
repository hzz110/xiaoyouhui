Page({
  data: {},
  addAlumni() {
    wx.showToast({
      title: '管理员已开启新增模式',
      icon: 'none'
    });
  },
  filterAlumni() {
    // 搜索逻辑
  },
  viewDetail(e) {
    wx.showToast({
      title: '已打开校友详情页',
      icon: 'none'
    });
  }
})