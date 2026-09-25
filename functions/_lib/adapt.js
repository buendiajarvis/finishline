// Wraps a Vercel-style Node handler `(req, res) => {...}` so it runs as a
// Cloudflare Pages Function `onRequestPost(context)`. Keeps the ported
// function bodies (error handling, validation, etc.) untouched — only the
// request/response plumbing changes.
//
// process.env is populated from context.env on every call so existing
// `process.env.X` reads inside the ported handlers keep working under the
// nodejs_compat flag.
export function adaptVercelHandler(vercelHandler) {
  return async (context) => {
    const { request, env } = context;

    if (typeof process !== 'undefined' && process.env) {
      Object.assign(process.env, env);
    }

    const bodyText = request.method === 'GET' || request.method === 'HEAD'
      ? ''
      : await request.text();

    const headers = {};
    for (const [key, value] of request.headers) {
      headers[key.toLowerCase()] = value;
    }

    const req = {
      method: request.method,
      headers,
      url: (() => {
        const u = new URL(request.url);
        return u.pathname + u.search;
      })(),
      on(event, cb) {
        if (event === 'data') {
          if (bodyText) cb(bodyText);
        } else if (event === 'end') {
          cb();
        }
        // 'error' intentionally unhandled — body is already fully read.
      }
    };

    let statusCode = 200;
    let settled = false;
    let resolveResponse;
    const responsePromise = new Promise((resolve) => { resolveResponse = resolve; });

    const res = {
      status(code) {
        statusCode = code;
        return res;
      },
      json(obj) {
        if (settled) return res;
        settled = true;
        resolveResponse(new Response(JSON.stringify(obj), {
          status: statusCode,
          headers: { 'content-type': 'application/json' }
        }));
        return res;
      },
      send(data) {
        if (settled) return res;
        settled = true;
        resolveResponse(new Response(data, { status: statusCode }));
        return res;
      },
      setHeader() {
        return res;
      },
      end() {
        if (settled) return res;
        settled = true;
        resolveResponse(new Response(null, { status: statusCode }));
        return res;
      }
    };

    await vercelHandler(req, res);
    return responsePromise;
  };
}
