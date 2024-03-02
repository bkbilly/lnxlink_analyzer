// https://developers.cloudflare.com/d1/get-started/
export interface Env {
  // If you set another name in wrangler.toml as the value for 'binding',
  // replace "DB" with the variable name you defined.
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env) {
    const { pathname } = new URL(request.url);

    var path = pathname.split("/");
    if (path[1] == "api") {
      if (request.method === "POST") {
        const data = await request.json();
        console.log(data);
        await env.DB.prepare(
            "INSERT INTO LNXlink (uuid, version, country) VALUES (?, ?, ?)"
          ).bind(data.uuid, data.version, request.cf.country).all();
        return new Response(null)
      } else if (path[3] == "users") {
        var { results } = await env.DB.prepare("SELECT version FROM LNXlink group by version").all();
        let mydict = {}
        for (var result of results) {
          var { results } = await env.DB.prepare(
            "SELECT created as date, count(DISTINCT(uuid)) as sum FROM LNXlink WHERE version = ? group by created"
          ).bind(result.version).all();
          mydict[result.version] = results
        }
        return Response.json(mydict);
      } else if (path[3] == "countries") {
        var date = new Date();
        date.setDate(date.getDate() - 10);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const mydate = year + '-' + month + '-' + day
        console.log(mydate)
        var { results } = await env.DB.prepare(
          "SELECT count(DISTINCT(uuid)) as sum, country FROM LNXlink WHERE created > ? group by country"
        ).bind(mydate).all();
        return Response.json(results);
      }
    } else if (path[2] == "graph" && path.length == 3) {
      var { results } = await env.DB.prepare(
        "SELECT version FROM LNXlink group by version"
      ).all();
      let data = []
      for (var result of results) {
        var { results } = await env.DB.prepare(
          "SELECT created as date, count(DISTINCT(uuid)) as sum FROM LNXlink WHERE version = ? group by created"
        ).bind(result.version).all();
        let data_data = []
        for (var sql_data of results) {
          const [y, m, d] = sql_data.date.split("-");
          var newDate = new Date(y, m - 1, d);
          data_data.push({"x": newDate.getTime(), "y": sql_data.sum})
        }
        data.push({"label": result.version, "data": data_data})
      }

      const html = `
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LNXlink Statistics</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
      </head>
      <body style="background-color: #111;">
        <h1 style="color: #999;">LNXlink Statistics</h1>
        <div><canvas id="myChart"></canvas></div>
        <script>
          const ctx = document.getElementById('myChart');

          Chart.defaults.borderColor = "#222";
          Chart.defaults.plugins.legend.position = "top";
          new Chart(ctx, {
            type: 'line',
            options: {scales: {x: {type: 'time'}}},
            data: {datasets: `+ JSON.stringify(data) +`}
          });
        </script>
      </body>
      `
      return new Response(html, {
        headers: {
          "content-type": "text/html;charset=UTF-8",
        },
      });
    } else if (path[2] == "map" && path.length == 3) {

      // Get countries
      var date = new Date();
      date.setDate(date.getDate() - 10);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const mydate = year + '-' + month + '-' + day
      console.log(mydate)
      var { results } = await env.DB.prepare(
          "SELECT count(DISTINCT(uuid)) as sum, country FROM LNXlink WHERE created > ? group by country"
        ).bind(mydate).all();
      let data = {};
      for (var result of results) {
        data[result.country] = {"sum": result.sum};
      }

      // Create html
      const html = `
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LNXlink Statistics</title>
        <script src="https://cdn.jsdelivr.net/npm/svg-pan-zoom@3.6.1/dist/svg-pan-zoom.min.js"></script>
        <script src="https://cdn.jsdelivr.net/gh/StephanWagner/svgMap@v2.10.1/dist/svgMap.min.js"></script>
        <link href="https://cdn.jsdelivr.net/gh/StephanWagner/svgMap@v2.10.1/dist/svgMap.min.css" rel="stylesheet">
      </head>
      <body style="background-color: #111;">
        <h1 style="color: #999;">LNXlink Statistics</h1>
        <div id="svgMap"></div>
        <script>
          new svgMap({
            targetElementID: 'svgMap',
            data: {
              data: {
                sum: {
                  name: 'Installations',
                  format: '{0} Installations',
                }
              },
              applyData: 'sum',
              values: `+ JSON.stringify(data) +`
            }
          });
        </script>
      </body>
      `
      return new Response(html, {
        headers: {
          "content-type": "text/html;charset=UTF-8",
        },
      });
    }

    return new Response(null, { status: 405 });
  },
};
