// pages/record-detail/record-detail.js
const app = getApp();

Page({
  data: {
    article: null,
    htmlContent: '',
    loading: true
  },
  onLoad(options) {
    const id = options.id;
    if(id) {
      this.fetchDetail(id);
    } else {
      wx.navigateBack();
    }
  },
  fetchDetail(id) {
    wx.request({
      url: `${app.globalData.apiUrl}/api/records`,
      method: 'GET',
      success: (res) => {
        if(res.data && res.data.status === 'success') {
           const record = res.data.data.find(r => r.id == id);
           if(record) {
              // 微信特权级操作：无情替换所有 <img> 标签的样式属性，强制手机端自适应，防止图片比手机宽而撑爆排版！
              let parsedHtml = record.html_content || '';
              // 匹配所有 <img>，并塞入 style="..."
              // 即使 WangEditor 里面有 style 也不怕，我们会暴力注入并覆盖宽度。
              parsedHtml = parsedHtml.replace(/<img(.*?)>/gi, '<img style="max-width:100%;height:auto;display:block;margin:16px 0;border-radius:12px;box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" $1>');
              
              this.setData({ article: record, htmlContent: parsedHtml });
           }
        }
        this.setData({ loading: false });
      },
      fail: () => {
        this.setData({ loading: false });
        wx.showToast({ title: '获取正文超时', icon: 'none' });
      }
    });
  },
  // 支持转发给微信好友
  onShareAppMessage() {
    return {
      title: this.data.article ? this.data.article.title : '西南交大校友会长篇报告',
      path: `/pages/record-detail/record-detail?id=${this.data.article.id}`
    };
  }
})
