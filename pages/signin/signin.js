Page({
  data: {
    signedIn: false
  },
  signInSuccess() {
    this.setData({ signedIn: true });
    wx.showToast({
      title: '签到成功！',
      icon: 'success'
    });
  }
})