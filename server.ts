import express from "express";
import http from "node:http";
import path from "path";
import fs from "fs";
import zlib from "node:zlib";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { v1Router } from "./server/routes/v1Router";
import { getRobotsTxt, getSitemapXml, getSitemapXmlAsync, renderStorefrontSeoPage, renderStorefrontSeoPageAsync, getSiteUrl } from "./server/seoEngine";
import { cmsRouter } from "./server/cmsApi";
import { mediaRouter } from "./server/mediaHandler";
import { initCmsDatabase } from "./server/db/cmsDb";

import { outboxProcessor } from "./server/db";

dotenv.config();

async function startServer() {
  // Initialize CMS Database (PostgreSQL / Resilient store)
  await initCmsDatabase();

  const app = express();
  const server = http.createServer(app);
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: "10mb" }));

  // Lightweight HTTP Gzip Compression for JSON & Text Responses (Zero extra dependency, preserves SSE streams)
  app.use((req, res, next) => {
    if (req.path.includes("/notifications/stream")) {
      return next();
    }
    const acceptEncoding = String(req.headers["accept-encoding"] || "");
    if (!acceptEncoding.includes("gzip")) {
      return next();
    }
    const origJson = res.json.bind(res);
    res.json = (body: any) => {
      try {
        const jsonStr = JSON.stringify(body);
        if (jsonStr.length < 1024) {
          return origJson(body);
        }
        const compressed = zlib.gzipSync(Buffer.from(jsonStr, "utf-8"));
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader("Content-Encoding", "gzip");
        res.setHeader("Vary", "Accept-Encoding");
        return res.send(compressed);
      } catch {
        return origJson(body);
      }
    };
    next();
  });

  // Security & Long-Lived Asset Cache Headers Middleware
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    if (/\.(webp|woff2|svg)$/i.test(req.path)) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    }
    next();
  });

  // Commerce OS Modular Monolith Architecture:
  // 1. Versioned Primary API: /api/v1/*
  // 2. Backward Compatibility Alias: /api/* (supports existing clients & E2E test suites)
  app.use("/api/v1", v1Router);
  app.use("/api", v1Router);

  // 3. CMS & Media Asset Endpoints
  app.use("/api/admin/media", mediaRouter);
  app.use("/api/v1/admin/media", mediaRouter);
  app.use("/api", cmsRouter);
  app.use("/api/v1", cmsRouter);

  // 9. SEO & Crawler Endpoints: robots.txt
  app.get("/robots.txt", (req, res) => {
    const siteUrl = getSiteUrl(req);
    res.type("text/plain; charset=utf-8").send(getRobotsTxt(siteUrl));
  });

  // 10. Dynamic XML Sitemap (Products, Categories, Blog, Pages) with SWR Caching
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const siteUrl = getSiteUrl(req);
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400");
      const sitemapXml = await getSitemapXmlAsync(siteUrl);
      res.send(sitemapXml);
    } catch (err) {
      const fallbackUrl = getSiteUrl(req);
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400");
      res.send(getSitemapXml(fallbackUrl));
    }
  });

  // Vite middleware for development
  let vite: any = null;
  if (process.env.NODE_ENV !== "production") {
    vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server },
      },
      appType: "custom",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, { index: false, maxAge: "365d", immutable: true }));
  }

  // Protected Admin & Tasks Server-Side Route Guard
  app.use(["/admin", "/tasks"], (req, res, next) => {
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    
    // Server-side auth check: robots.txt is not security
    const adminSecret = process.env.ADMIN_SECRET_KEY || "gordiyeh-supervisor-secure";
    const authHeader = req.headers["authorization"] || req.headers["x-admin-token"];
    const querySecret = req.query.secret;

    // Check basic auth or token header
    let isAuthorized = false;
    if (authHeader) {
      const token = typeof authHeader === "string" ? authHeader.replace(/^Bearer\s+/i, "") : "";
      if (token === adminSecret) isAuthorized = true;
    }
    if (querySecret === adminSecret || req.headers["cookie"]?.includes("gordiyeh_admin_auth=true")) {
      isAuthorized = true;
    }

    // In local development or client iframe, allow if requested with auth cookie or prompt
    if (!isAuthorized && req.headers["accept"]?.includes("text/html")) {
      // Basic challenge for direct browser access to protect sensitive routes
      if (!req.headers["authorization"]) {
        res.setHeader("WWW-Authenticate", 'Basic realm="Gordiyeh Supervisor Admin"');
        return res.status(401).send("Authentication required for administrative operations.");
      }
      const b64auth = (req.headers["authorization"] || "").split(" ")[1] || "";
      const [login, password] = Buffer.from(b64auth, "base64").toString().split(":");
      if (login === "admin" && password === (process.env.ADMIN_PASSWORD || "gordiyeh2026")) {
        res.cookie("gordiyeh_admin_auth", "true", { httpOnly: true, sameSite: "lax" });
        return next();
      }
      res.setHeader("WWW-Authenticate", 'Basic realm="Gordiyeh Supervisor Admin"');
      return res.status(401).send("Invalid administrative credentials.");
    }

    next();
  });

  // 11. Server-Side Rendering (SSR) & SEO Meta Injection for Public Storefront
  app.get("*", async (req, res, next) => {
    const url = req.originalUrl;

    // Skip API, Vite internal assets, and static files with extensions
    if (url.startsWith("/api") || url.startsWith("/@") || (url.includes(".") && !url.endsWith(".html"))) {
      return next();
    }

    try {
      const baseUrl = getSiteUrl(req);
      const urlPath = req.path;

      // Admin panel stays client-rendered
      if (urlPath.startsWith("/admin")) {
        const templatePath = process.env.NODE_ENV === "production"
          ? path.join(process.cwd(), "dist", "index.html")
          : path.join(process.cwd(), "index.html");
        let template = fs.readFileSync(templatePath, "utf-8");
        if (vite) {
          template = await vite.transformIndexHtml(url, template);
        }
        res.setHeader("X-Robots-Tag", "noindex, nofollow");
        return res.status(200).send(template);
      }

      // Storefront SSR & SEO Render
      const rawTemplatePath = process.env.NODE_ENV === "production"
        ? path.join(process.cwd(), "dist", "index.html")
        : path.join(process.cwd(), "index.html");
      let rawTemplate = fs.readFileSync(rawTemplatePath, "utf-8");

      const seoResult = await renderStorefrontSeoPageAsync(urlPath, req.query, baseUrl, rawTemplate);

      // Handle 301 Redirects
      if (seoResult.status === 301 && seoResult.redirectUrl) {
        const targetUrl = seoResult.redirectUrl.startsWith("http")
          ? seoResult.redirectUrl
          : `${baseUrl}${seoResult.redirectUrl}`;
        return res.redirect(301, targetUrl);
      }

      // Set X-Robots-Tag for noindex or 404 pages
      if (seoResult.isNoindex || seoResult.status === 404) {
        res.setHeader("X-Robots-Tag", seoResult.status === 404 ? "noindex, follow" : "noindex, nofollow");
      }

      let finalHtml = seoResult.html;
      if (vite) {
        finalHtml = await vite.transformIndexHtml(url, finalHtml);
      }

      return res.status(seoResult.status).send(finalHtml);
    } catch (err: any) {
      console.error("SSR rendering error:", err);
      return res.status(500).send("Server Error");
    }
  });

  // Start durable Transactional Outbox processor
  outboxProcessor.start(3000);

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Commerce OS Brain server listening on http://0.0.0.0:${PORT}`);
  });

  // Graceful shutdown handling (Gate 4 & Gate 8)
  const shutdown = () => {
    console.log("Initiating graceful shutdown: stopping outbox worker and closing server...");
    outboxProcessor.stop();
    server.close(() => {
      console.log("Server stopped successfully.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

startServer();
