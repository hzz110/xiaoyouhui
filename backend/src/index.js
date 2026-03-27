export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 默认返回 JSON
    if (url.pathname === "/api/hello") {
      return new Response(JSON.stringify({
        message: "Welcome to Southwest Jiaotong University Alumni Association API!",
        status: "success"
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response("Not Found", { status: 404 });
  }
};
