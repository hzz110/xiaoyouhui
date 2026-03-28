export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 标准跨域配置
    const headers = {
      "Content-Type": "application/json;charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers });

    // ==========================================
    // 1. R2 图片对象存储 - CDN 下发代理
    // ==========================================
    if (url.pathname.startsWith("/cdn/")) {
      if (request.method !== "GET") return new Response("Method not allowed", { status: 405 });
      const key = decodeURIComponent(url.pathname.slice(5)); // 例如 /cdn/123.png -> 123.png
      const object = await env.IMAGES_BUCKET.get(key);
      
      if (object === null) {
        return new Response("Image Not Found", { status: 404 });
      }
      
      const cdnHeaders = new Headers();
      object.writeHttpMetadata(cdnHeaders);
      cdnHeaders.set("etag", object.httpEtag);
      cdnHeaders.set("Access-Control-Allow-Origin", "*");
      return new Response(object.body, { headers: cdnHeaders });
    }

    // ==========================================
    // 2. R2 图片直传接口 API
    // ==========================================
    if (url.pathname === "/api/upload" && request.method === "POST") {
      try {
        const fileData = await request.arrayBuffer();
        const contentType = request.headers.get("Content-Type") || "application/octet-stream";
        
        let ext = "png";
        if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = "jpg";
        if (contentType.includes("gif")) ext = "gif";
        if (contentType.includes("webp")) ext = "webp";

        // 生成唯一文件名时间戳
        const key = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
        
        // 直传进 R2 存储桶
        await env.IMAGES_BUCKET.put(key, fileData, {
          httpMetadata: { contentType },
        });
        
        // 返回可以对外公开访问的相对 CDN 路径
        return new Response(JSON.stringify({ status: "success", url: `/cdn/${key}` }), { headers });
      } catch(err) {
        return new Response(JSON.stringify({ status: "error", message: err.message }), { status: 500, headers });
      }
    }

    // ==========================================
    // 3. 通用 CRUD (增删改查) 数据库路由映射器
    // ==========================================
    const handleCRUD = async (tableName, req, idParam) => {
      try {
        if (req.method === "GET") {
          const { results } = await env.DB.prepare(`SELECT * FROM ${tableName} ORDER BY id DESC`).all();
          return new Response(JSON.stringify({ status: "success", data: results }), { headers });
        
        } else if (req.method === "POST") {
          const body = await req.json();
          const keys = Object.keys(body);
          const values = Object.values(body);
          const placeholders = keys.map(() => "?").join(", ");
          await env.DB.prepare(`INSERT INTO ${tableName} (${keys.join(", ")}) VALUES (${placeholders})`)
            .bind(...values).run();
          return new Response(JSON.stringify({ status: "success" }), { headers });
          
        } else if (req.method === "PUT" && idParam) {
          const body = await req.json();
          const keys = Object.keys(body);
          const values = Object.values(body);
          const updates = keys.map(k => `${k} = ?`).join(", ");
          await env.DB.prepare(`UPDATE ${tableName} SET ${updates} WHERE id = ?`)
            .bind(...values, idParam).run();
          return new Response(JSON.stringify({ status: "success" }), { headers });
          
        } else if (req.method === "DELETE" && idParam) {
          await env.DB.prepare(`DELETE FROM ${tableName} WHERE id = ?`).bind(idParam).run();
          return new Response(JSON.stringify({ status: "success" }), { headers });
        }
        
        return new Response(JSON.stringify({ status: "error", message: "Missing ID or invalid method" }), { status: 400, headers });
      } catch (err) {
        return new Response(JSON.stringify({ status: "error", message: err.message }), { status: 500, headers });
      }
    };

    const idParam = url.searchParams.get("id");

    if (url.pathname === "/api/alumni") return await handleCRUD("alumni", request, idParam);
    if (url.pathname === "/api/events") return await handleCRUD("events", request, idParam);
    if (url.pathname === "/api/records") return await handleCRUD("meeting_records", request, idParam); // 新增长图文记录表

    if (url.pathname === "/api/hello") {
      return new Response(JSON.stringify({ message: "SJTU AA Backend running gracefully!" }), { headers });
    }

    return new Response(JSON.stringify({ status: "error", message: "Not Found: API route missing." }), { status: 404, headers });
  }
};
