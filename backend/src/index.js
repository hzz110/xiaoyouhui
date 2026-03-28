export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 跨域设置，方便未来独立的 Web PC 管理后台请求 API
    const headers = {
      "Content-Type": "application/json;charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    // [示例] 获取校友列表
    if (url.pathname === "/api/alumni" && request.method === "GET") {
      try {
        const { results } = await env.DB.prepare("SELECT * FROM alumni ORDER BY id DESC").all();
        return new Response(JSON.stringify({ status: "success", data: results }), { headers });
      } catch (err) {
        return new Response(JSON.stringify({ status: "error", message: err.message }), { status: 500, headers });
      }
    }

    // [示例] 获取活动列表
    if (url.pathname === "/api/events" && request.method === "GET") {
      try {
        const { results } = await env.DB.prepare("SELECT * FROM events ORDER BY id DESC").all();
        return new Response(JSON.stringify({ status: "success", data: results }), { headers });
      } catch (err) {
        return new Response(JSON.stringify({ status: "error", message: err.message }), { status: 500, headers });
      }
    }

    if (url.pathname === "/api/hello") {
      return new Response(JSON.stringify({
        message: "Welcome to Southwest Jiaotong University Alumni Association API!",
        status: "success"
      }), { headers });
    }

    return new Response(JSON.stringify({ status: "error", message: "Not Found" }), { status: 404, headers });
  }
};
