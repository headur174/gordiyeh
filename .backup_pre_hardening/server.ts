import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { v1Router } from "./server/routes/v1Router";
import { getRobotsTxt, getSitemapXml, renderStorefrontSeoPage } from "./server/seoEngine";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Commerce OS Modular Monolith Architecture:
  // 1. Versioned Primary API: /api/v1/*
  // 2. Backward Compatibility Alias: /api/* (supports existing clients & E2E test suites)
  app.use("/api/v1", v1Router);
  app.use("/api", v1Router);


  // 9. SEO & Crawler Endpoints: robots.txt
  app.get("/robots.txt", (req, res) => {
    const host = req.get("host") || "ais-dev-nursgucwf57kuiaai22xjy-157059526200.asia-southeast1.run.app";
    const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
    const baseUrl = `${protocol}://${host}`;
    res.type("text/plain").send(getRobotsTxt(baseUrl));
  });

  // 10. Dynamic XML Sitemap (Products, Categories, Blog, Pages)
  app.get("/sitemap.xml", (req, res) => {
    const host = req.get("host") || "ais-dev-nursgucwf57kuiaai22xjy-157059526200.asia-southeast1.run.app";
    const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
    const baseUrl = `${protocol}://${host}`;
    res.type("application/xml").send(getSitemapXml(baseUrl));
  });

  // Vite middleware for development
  let vite: any = null;
  if (process.env.NODE_ENV !== "production") {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, { index: false }));
  }

  // 11. Server-Side Rendering (SSR) & SEO Meta Injection for Public Storefront
  app.get("*", async (req, res, next) => {
    const url = req.originalUrl;

    // Skip API, Vite internal assets, and static files with extensions
    if (url.startsWith("/api") || url.startsWith("/@") || (url.includes(".") && !url.endsWith(".html"))) {
      return next();
    }

    try {
      const host = req.get("host") || "ais-dev-nursgucwf57kuiaai22xjy-157059526200.asia-southeast1.run.app";
      const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
      const baseUrl = `${protocol}://${host}`;
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
        return res.status(200).send(template);
      }

      // Storefront SSR & SEO Render
      const rawTemplatePath = process.env.NODE_ENV === "production"
        ? path.join(process.cwd(), "dist", "index.html")
        : path.join(process.cwd(), "index.html");
      let rawTemplate = fs.readFileSync(rawTemplatePath, "utf-8");

      const seoResult = renderStorefrontSeoPage(urlPath, req.query, baseUrl, rawTemplate);

      if (seoResult.status === 301 && seoResult.redirectUrl) {
        const targetUrl = seoResult.redirectUrl.startsWith("http")
          ? seoResult.redirectUrl
          : `${baseUrl}${seoResult.redirectUrl}`;
        return res.redirect(301, targetUrl);
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Commerce OS Brain server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
