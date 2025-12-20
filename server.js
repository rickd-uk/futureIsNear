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
  // Convert to Tokyo time (UTC+9)
  const tokyoTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);

  // Format: [20/Dec/2025:16:54:04 +0900]
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

// Custom format using Tokyo time
const tokyoFormat =
  ':remote-addr - - :tokyo-date ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';

app.prepare().then(() => {
  const server = createServer((req, res) => {
    // Morgan with Tokyo timezone
    morgan(tokyoFormat)(req, res, () => {});

    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
