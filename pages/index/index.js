Page({
  data: {},

  onLoad(options) {
    // 页面加载
  },

  showNotification() {
    wx.showModal({
      title: '通知',
      content: '2 条新通知\n1. 春季座谈会签到开启\n2. 王教授直播预告',
      showCancel: false
    })
  },

  notAvailable() {
    wx.showToast({
      title: '已跳转发布活动~',
      icon: 'none'
    })
  }
})
