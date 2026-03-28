App({
  onLaunch() {
    console.log("西南交大校友会 小程序启动");
  },
  globalData: {
    userInfo: null,
    // [重要提示] 请将此处替换为您在 Cloudflare Workers 上部署成功后的实际外网请求地址！
    apiUrl: "https://sjtuaa-backend.hzz110.workers.dev"
  }
})
