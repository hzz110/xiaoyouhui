Page({
  data: {
    currentTab: 'summary'
  },
  switchTab(e) {
    this.setData({ currentTab: e.currentTarget.dataset.tab });
  }
})