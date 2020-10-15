const http = require("http");
const Koa = require("koa");
const Router = require("koa-router");
const { streamEvents } = require("http-event-stream");
const uuid = require("uuid");
const { rejects } = require("assert");

const app = new Koa();

app.use(async (ctx, next) => {
  const origin = ctx.request.get("Origin");
  if (!origin) {
    return await next();
  }

  const headers = { "Access-Control-Allow-Origin": "*" };

  if (ctx.request.method !== "OPTIONS") {
    ctx.response.set({ ...headers });
    try {
      return await next();
    } catch (e) {
      e.headers = { ...e.headers, ...headers };
      throw e;
    }
  }

  if (ctx.request.get("Access-Control-Request-Method")) {
    ctx.response.set({
      ...headers,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH",
    });

    if (ctx.request.get("Access-Control-Request-Headers")) {
      ctx.response.set(
        "Access-Control-Allow-Headers",
        ctx.request.get("Access-Control-Request-Headers")
      );
    }

    ctx.response.status = 204;
  }
});

const router = new Router();
const comments = [
  {
    text:
      "Идёт перемещение мяча по полю, игроки и той, и другой команды активно пытаются атаковать",
    type: "action",
  },
  {
    text: "Нарушение правил, будет штрафной удар",
    type: "freekick",
  },
  {
    text: "Отличный удар! И Г-О-Л!",
    type: "goal",
  },
];
router.get("/sse", async (ctx) => {
  const fetchEventsSince = async (lastEventId) => {
    return [];
  };
  streamEvents(ctx.req, ctx.res, {
    async fetch(lastEventId) {
      return fetchEventsSince(lastEventId);
    },
    stream(sse) {
      const interval = setInterval(() => {
        const randomComment = Math.random();
        let comment;
        if (randomComment < 0.5) {
          comment = comments[0];
        } else if (randomComment < 0.9) {
          comment = comments[1];
        } else {
          comment = comments[2];
        }
        comment.date = new Date().toLocaleString();
        sse.sendEvent({
          id: uuid.v4(),
          data: JSON.stringify(comment),
          event: "comment",
        });
      }, 5000);

      return () => clearInterval(interval);
    },
  });
  ctx.respond = false;
});

router.get("/index", async (ctx) => {
  ctx.response.body = "hello";
});

app.use(router.routes()).use(router.allowedMethods());

const port = process.env.PORT || 7070;
const server = http.createServer(app.callback());
server.listen(port);
