Page({
  adminTip() {
    wx.showModal({
      title: '管理员入口',
      content: '进入后台管理系统：可发通知、添加活动、审核校友等。这里是管理员特权入口！',
      showCancel: false
    });
  }
})
