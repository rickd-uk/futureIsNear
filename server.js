// server.js
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import morgan from "morgan";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT, 10) || 5000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    // Morgan "combined" format - outputs IP addresses for Fail2Ban
    morgan("combined")(req, res, () => {});

    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
