// https://developers.cloudflare.com/d1/get-started/
export interface Env {
  // If you set another name in wrangler.toml as the value for 'binding',
  // replace "DB" with the variable name you defined.
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env) {
    const { pathname } = new URL(request.url);

    if (pathname.startsWith("/api/lnxlink")) {
      console.log(request.cf.country)

      if (request.method === "POST") {
        const data = await request.json();
        console.log(data);
        await env.DB.prepare(
            "INSERT INTO LNXlink (uuid, version, country) VALUES (?, ?, ?)"
          )
            .bind(data.uuid, data.version, request.cf.country)
            .all();
            return new Response(null)
      } else if (pathname.endsWith("users")) {
        const { results } = await env.DB.prepare(
          "SELECT date(created) as date, count(DISTINCT(uuid)) as sum, version FROM LNXlink group by date(created), version"
        ).all();
        return Response.json(results);
      }  else if (pathname.endsWith("countries")) {
        const { results } = await env.DB.prepare(
          "SELECT date(created) as date, count(DISTINCT(uuid)) as sum, country FROM LNXlink group by date(created), country"
        ).all();
        return Response.json(results);
      }
    }

    return new Response(null, { status: 405 });
  },
};
