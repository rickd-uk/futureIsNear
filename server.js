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

// Custom Morgan token for Tokyo timezone
morgan.token("tokyo-date", function () {
  const now = new Date();
  const tokyoTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);

  const day = String(tokyoTime.getUTCDate()).padStart(2, "0");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = months[tokyoTime.getUTCMonth()];
  const year = tokyoTime.getUTCFullYear();
  const hours = String(tokyoTime.getUTCHours()).padStart(2, "0");
  const minutes = String(tokyoTime.getUTCMinutes()).padStart(2, "0");
  const seconds = String(tokyoTime.getUTCSeconds()).padStart(2, "0");

  return `[${day}/${month}/${year}:${hours}:${minutes}:${seconds} +0900]`;
});

// Custom token to get real IP from X-Forwarded-For header
morgan.token("real-ip", function (req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    // X-Forwarded-For can be comma-separated, get the first (original client) IP
    return forwarded.split(",")[0].trim();
  }
  return req.connection.remoteAddress || req.socket.remoteAddress;
});

// Custom format using Tokyo time and real IP
const tokyoFormat =
  ':real-ip - - :tokyo-date ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';

app.prepare().then(() => {
  const server = createServer((req, res) => {
    // Morgan with Tokyo timezone and real IP from X-Forwarded-For
    morgan(tokyoFormat)(req, res, () => {});

    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
