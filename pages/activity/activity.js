Page({
  data: {
    currentTab: 'upcoming'
  },
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      currentTab: tab
    });
  }
})