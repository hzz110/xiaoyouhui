export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 跨域设置，使得在管理后台浏览器内能够成功发送 HTTP 请求
    const headers = {
      "Content-Type": "application/json;charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    // ========== 校友 API ===========
    if (url.pathname === "/api/alumni") {
      if (request.method === "GET") {
        try {
          const { results } = await env.DB.prepare("SELECT * FROM alumni ORDER BY id DESC").all();
          return new Response(JSON.stringify({ status: "success", data: results }), { headers });
        } catch (err) {
          return new Response(JSON.stringify({ status: "error", message: err.message }), { status: 500, headers });
        }
      } else if (request.method === "POST") {
        try {
          const body = await request.json();
          const { name, batch, major } = body;
          if (!name || !batch) throw new Error("缺少必填字段：校友姓名或届别");
          await env.DB.prepare("INSERT INTO alumni (name, batch, major) VALUES (?, ?, ?)")
            .bind(name, batch, major || "")
            .run();
          return new Response(JSON.stringify({ status: "success" }), { headers });
        } catch (err) {
          return new Response(JSON.stringify({ status: "error", message: err.message }), { status: 500, headers });
        }
      }
    }

    // ========== 活动 API ===========
    if (url.pathname === "/api/events") {
      if (request.method === "GET") {
        try {
          const { results } = await env.DB.prepare("SELECT * FROM events ORDER BY id DESC").all();
          return new Response(JSON.stringify({ status: "success", data: results }), { headers });
        } catch (err) {
          return new Response(JSON.stringify({ status: "error", message: err.message }), { status: 500, headers });
        }
      } else if (request.method === "POST") {
        try {
          const body = await request.json();
          const { title, content, location } = body;
          if (!title || !location) throw new Error("缺少必填字段：标题或地点");
          await env.DB.prepare("INSERT INTO events (title, content, location) VALUES (?, ?, ?)")
            .bind(title, content || "", location)
            .run();
          return new Response(JSON.stringify({ status: "success" }), { headers });
        } catch (err) {
          return new Response(JSON.stringify({ status: "error", message: err.message }), { status: 500, headers });
        }
      }
    }

    // 默认兜底项，用于当直接访问绑定域名根目录时提示存活状态。
    return new Response(JSON.stringify({ status: "error", message: "Not Found - 请访问具体的 /api/... 路径获取数据" }), { status: 404, headers });
  }
};
