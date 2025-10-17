// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/m3u-parser.ts
function parseM3U(content) {
  const lines = content.split("\n").filter((line) => line.trim());
  const channels = [];
  let currentChannel = {};
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "#EXTM3U") continue;
    if (line.startsWith("#EXTINF:")) {
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      const groupMatch = line.match(/group-title="([^"]+)"/);
      const countryMatch = line.match(/tvg-country="([^"]+)"/);
      const languageMatch = line.match(/tvg-language="([^"]+)"/);
      const nameMatch = line.match(/,(.+)$/);
      const name = nameMatch ? nameMatch[1].trim() : "Unknown Channel";
      currentChannel = {
        name,
        logo: logoMatch ? logoMatch[1] : void 0,
        group: groupMatch ? groupMatch[1] : void 0,
        country: countryMatch ? countryMatch[1] : void 0,
        language: languageMatch ? languageMatch[1] : void 0,
        category: groupMatch ? groupMatch[1] : void 0
      };
    } else if (line.startsWith("http://") || line.startsWith("https://")) {
      if (currentChannel.name) {
        const id = Buffer.from(`${currentChannel.name}-${line}`).toString("base64").substring(0, 16);
        channels.push({
          id,
          name: currentChannel.name,
          url: line,
          logo: currentChannel.logo,
          group: currentChannel.group,
          country: currentChannel.country,
          language: currentChannel.language,
          category: currentChannel.category
        });
        currentChannel = {};
      }
    }
  }
  return channels;
}
function filterChannels(channels, filters) {
  let filtered = channels;
  if (filters.country) {
    filtered = filtered.filter(
      (ch) => ch.country?.toLowerCase().includes(filters.country.toLowerCase())
    );
  }
  if (filters.category) {
    filtered = filtered.filter(
      (ch) => ch.category?.toLowerCase().includes(filters.category.toLowerCase())
    );
  }
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (ch) => ch.name.toLowerCase().includes(searchLower) || ch.country?.toLowerCase().includes(searchLower) || ch.category?.toLowerCase().includes(searchLower)
    );
  }
  const total = filtered.length;
  const offset = filters.offset || 0;
  const limit = filters.limit || 50;
  filtered = filtered.slice(offset, offset + limit);
  return { channels: filtered, total };
}
function getUniqueValues(channels, field) {
  const values = /* @__PURE__ */ new Set();
  channels.forEach((ch) => {
    const value = ch[field];
    if (value && typeof value === "string") {
      values.add(value);
    }
  });
  return Array.from(values).sort();
}

// server/routes.ts
import rateLimit from "express-rate-limit";
var PLAYLIST_SOURCES = [
  "https://iptv-org.github.io/iptv/countries/br.m3u"
  // você pode adicionar mais URLs de backup aqui
];
var currentSourceIndex = 0;
var startTime = Date.now();
var cachedChannels = [];
var cachedPlaylist = "";
var cacheTimestamp = 0;
var CACHE_DURATION = 3600 * 1e3;
var EXTRA_BR = `
#EXTINF:-1 tvg-id="GloboRJ.br" tvg-country="BR" tvg-language="Portuguese" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/3/3d/TV_Globo_logo.svg" group-title="Abertos",Globo RJ
https://live.video.globo.com/h/14021966839910071175461551861587141314289/playlist720p.m3u8
#EXTINF:-1 tvg-id="SBT.br" tvg-country="BR" tvg-language="Portuguese" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/4/45/SBT_logo_2022.svg" group-title="Abertos",SBT
https://5cf4a2c2512a2.streamlock.net/sbt/sbt/playlist.m3u8
#EXTINF:-1 tvg-id="RecordTV.br" tvg-country="BR" tvg-language="Portuguese" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/3/3a/RecordTV_logo.svg" group-title="Abertos",RecordTV
https://5cf4a2c2512a2.streamlock.net/record/record/playlist.m3u8
`;
var apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  max: 100,
  message: "Too many requests from this IP, please try again later."
});
var playlistLimiter = rateLimit({
  windowMs: 60 * 1e3,
  max: 10,
  message: "Too many playlist requests, please try again later."
});
async function fetchFromSources() {
  const totalSources = PLAYLIST_SOURCES.length;
  for (let i = 0; i < totalSources; i++) {
    const index = (currentSourceIndex + i) % totalSources;
    try {
      const response = await fetch(PLAYLIST_SOURCES[index]);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      currentSourceIndex = index;
      return text;
    } catch (err) {
      console.warn(`Falha ao buscar fonte [${PLAYLIST_SOURCES[index]}]:`, err);
    }
  }
  throw new Error("Todas as fontes falharam");
}
async function updateCache() {
  try {
    const playlistText = await fetchFromSources();
    cachedPlaylist = playlistText;
    cachedChannels = parseM3U(playlistText);
    cacheTimestamp = Date.now();
    console.log("Cache atualizado com sucesso!");
  } catch (err) {
    console.error("Falha ao atualizar cache:", err);
  }
}
updateCache();
setInterval(updateCache, CACHE_DURATION);
async function registerRoutes(app2) {
  app2.get("/api/status", (req, res) => {
    const uptime = Math.floor((Date.now() - startTime) / 1e3);
    res.json({
      status: "online",
      source: PLAYLIST_SOURCES[currentSourceIndex],
      sources: PLAYLIST_SOURCES,
      port: parseInt(process.env.PORT || "5000"),
      uptime
    });
  });
  app2.get("/api/channels", apiLimiter, async (req, res) => {
    try {
      const now = Date.now();
      if (!cachedChannels.length || now - cacheTimestamp > CACHE_DURATION) {
        await updateCache();
      }
      const filters = {
        country: req.query.country,
        category: req.query.category,
        search: req.query.search,
        limit: req.query.limit ? Math.min(parseInt(req.query.limit), 100) : 50,
        offset: req.query.offset ? Math.max(parseInt(req.query.offset), 0) : 0
      };
      const filtered = filterChannels(cachedChannels, filters);
      const countries = getUniqueValues(cachedChannels, "country");
      const categories = getUniqueValues(cachedChannels, "category");
      res.json({
        channels: filtered.channels,
        total: filtered.total,
        countries,
        categories
      });
    } catch (error) {
      console.error("Erro ao buscar canais:", error);
      res.status(500).json({ error: "Failed to fetch channels" });
    }
  });
  app2.get("/playlist.m3u", playlistLimiter, async (req, res) => {
    try {
      const now = Date.now();
      if (!cachedPlaylist || now - cacheTimestamp > CACHE_DURATION) {
        await updateCache();
      }
      res.set("Content-Type", "application/vnd.apple.mpegurl");
      res.set("Cache-Control", "public, max-age=3600");
      res.send(`${cachedPlaylist.trim()}
${EXTRA_BR.trim()}`);
    } catch (error) {
      console.error("Erro ao buscar playlist:", error);
      res.status(502).json({
        error: "Failed to fetch playlist",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  return createServer(app2);
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "127.0.0.1", () => {
    log(`serving on port ${port}`);
  });
})();
