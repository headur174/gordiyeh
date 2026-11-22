import React from "react";
import { renderToString } from "react-dom/server";
import {
  SEO_PRODUCTS,
  SEO_CATEGORIES,
  SEO_ARTICLES,
  SEO_STATIC_PAGES,
  PRODUCT_BY_SLUG,
  CATEGORY_BY_SLUG,
  ARTICLE_BY_SLUG,
  STATIC_PAGE_BY_SLUG,
  resolve301Redirect,
  SeoProduct,
} from "../src/data/seoCatalog";
import { PORTED_PRODUCTS } from "../src/data/portedProducts";
import { BlockRenderer } from "../src/components/cms/BlockRenderer";
import {
  getDocumentBySlug,
  resolveDirectSlugRedirect,
  listAllDocuments,
  getLatestContentTimestamp,
} from "./db/cmsDb";
import { DRAFT_PREVIEW_TOKEN } from "./cmsApi";
import { CanonicalProduct } from "../src/types";

export function formatToman(amount: number): string {
  return new Intl.NumberFormat("fa-IR").format(amount);
}

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function getSiteUrl(req?: any): string {
  if (process.env.SITE_URL && process.env.SITE_URL.trim()) {
    return process.env.SITE_URL.trim().replace(/\/+$/, "");
  }
  if (req) {
    const proto = req.get("x-forwarded-proto") || req.protocol || "https";
    const host = req.get("host") || "ais-dev-nursgucwf57kuiaai22xjy-157059526200.asia-southeast1.run.app";
    return `${proto}://${host}`;
  }
  return "https://ais-dev-nursgucwf57kuiaai22xjy-157059526200.asia-southeast1.run.app";
}

/**
 * Dynamic robots.txt
 */
export function getRobotsTxt(siteUrl: string): string {
  return `User-agent: *
Disallow: /cart
Disallow: /checkout
Disallow: /receipt
Disallow: /login
Disallow: /orders
Disallow: /invoice
Disallow: /privacy-hub
Disallow: /tasks
Disallow: /admin
Disallow: /offline
Disallow: /search
Disallow: /compare
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;
}

// In-Memory Stale-While-Revalidate Cache for Sitemap
let cachedSitemapXml = "";
let cachedSitemapTimestamp = "";
let cachedSitemapSiteUrl = "";

/**
 * Dynamic sitemap.xml with Stale-While-Revalidate caching
 * Excludes DRAFT and noindex documents automatically
 */
export async function getSitemapXmlAsync(siteUrl: string): Promise<string> {
  const cleanBase = siteUrl.replace(/\/+$/, "");
  const latestDbTs = await getLatestContentTimestamp();

  // Return SWR cache if still valid
  if (cachedSitemapXml && cachedSitemapTimestamp === latestDbTs && cachedSitemapSiteUrl === cleanBase) {
    return cachedSitemapXml;
  }

  interface SitemapEntry {
    loc: string;
    lastmod?: string;
  }

  const entries: SitemapEntry[] = [];

  // 1. Home (1)
  entries.push({
    loc: `${cleanBase}/`,
    lastmod: "2026-11-09",
  });

  // 2. Categories (4)
  for (const cat of SEO_CATEGORIES) {
    entries.push({
      loc: `${cleanBase}/category/${cat.slug}`,
      lastmod: cat.updatedAt ? cat.updatedAt.split("T")[0] : undefined,
    });
  }

  // 3. Products (11)
  for (const prod of SEO_PRODUCTS) {
    entries.push({
      loc: `${cleanBase}/product/${prod.slug}`,
      lastmod: prod.updatedAt ? prod.updatedAt.split("T")[0] : undefined,
    });
  }

  // 4. Blog Index (1)
  entries.push({
    loc: `${cleanBase}/blog`,
    lastmod: "2026-11-08",
  });

  // 5. Dynamic CMS Documents from Database (Articles & Static Pages)
  const publishedDocs = await listAllDocuments("all", false);

  if (publishedDocs.length > 0) {
    for (const doc of publishedDocs) {
      if (doc.noindex || doc.status !== "PUBLISHED") continue;
      const pathPrefix = doc.kind === "article" ? "/blog/" : "/page/";
      entries.push({
        loc: `${cleanBase}${pathPrefix}${doc.slug}`,
        lastmod: doc.contentModifiedAt ? doc.contentModifiedAt.split("T")[0] : doc.updatedAt.split("T")[0],
      });
    }
  } else {
    // Fallback seed entries
    for (const art of SEO_ARTICLES) {
      entries.push({
        loc: `${cleanBase}/blog/${art.slug}`,
        lastmod: art.updatedAt ? art.updatedAt.split("T")[0] : undefined,
      });
    }
    for (const page of SEO_STATIC_PAGES) {
      entries.push({
        loc: `${cleanBase}/page/${page.slug}`,
        lastmod: page.updatedAt ? page.updatedAt.split("T")[0] : undefined,
      });
    }
  }

  // Build XML
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  for (const entry of entries) {
    xml += `\n  <url>\n    <loc>${escapeXml(entry.loc)}</loc>`;
    if (entry.lastmod) {
      xml += `\n    <lastmod>${entry.lastmod}</lastmod>`;
    }
    xml += `\n  </url>`;
  }
  xml += `\n</urlset>`;

  // Update Cache
  cachedSitemapXml = xml;
  cachedSitemapTimestamp = latestDbTs;
  cachedSitemapSiteUrl = cleanBase;

  return xml;
}

export function getSitemapXml(siteUrl: string): string {
  // Synchronous wrapper returning cached version or computed static fallback
  if (cachedSitemapXml) return cachedSitemapXml;
  return getSitemapXmlStaticSync(siteUrl);
}

function getSitemapXmlStaticSync(siteUrl: string): string {
  const cleanBase = siteUrl.replace(/\/+$/, "");
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  const entries = [
    { loc: `${cleanBase}/`, lastmod: "2026-11-09" },
    ...SEO_CATEGORIES.map((c) => ({ loc: `${cleanBase}/category/${c.slug}`, lastmod: c.updatedAt?.split("T")[0] })),
    ...SEO_PRODUCTS.map((p) => ({ loc: `${cleanBase}/product/${p.slug}`, lastmod: p.updatedAt?.split("T")[0] })),
    { loc: `${cleanBase}/blog`, lastmod: "2026-11-08" },
    ...SEO_ARTICLES.map((a) => ({ loc: `${cleanBase}/blog/${a.slug}`, lastmod: a.updatedAt?.split("T")[0] })),
    ...SEO_STATIC_PAGES.map((p) => ({ loc: `${cleanBase}/page/${p.slug}`, lastmod: p.updatedAt?.split("T")[0] })),
  ];
  for (const entry of entries) {
    xml += `\n  <url>\n    <loc>${escapeXml(entry.loc)}</loc>`;
    if (entry.lastmod) xml += `\n    <lastmod>${entry.lastmod}</lastmod>`;
    xml += `\n  </url>`;
  }
  xml += `\n</urlset>`;
  return xml;
}

export interface SeoRenderResult {
  status: number;
  isNoindex: boolean;
  isNofollow?: boolean;
  html: string;
  redirectUrl?: string;
}

/**
 * Universal SSR Renderer & Meta Injector for public storefront
 * Uses unified BlockRenderer component and safe JSON hydration injection
 */
export async function renderStorefrontSeoPageAsync(
  urlPath: string,
  query: Record<string, any>,
  siteUrl: string,
  rawHtmlTemplate: string
): Promise<SeoRenderResult> {
  const cleanBase = siteUrl.replace(/\/+$/, "");

  // 1. Check for legacy 301 redirects in static catalog
  const legacyRedirect = resolve301Redirect(urlPath);
  if (legacyRedirect) {
    return {
      status: 301,
      isNoindex: false,
      html: "",
      redirectUrl: legacyRedirect,
    };
  }

  // Normalize path
  let cleanPath = urlPath.trim();
  if (cleanPath.length > 1 && cleanPath.endsWith("/")) {
    cleanPath = cleanPath.slice(0, -1);
  }

  // 2. Check for dynamic slug history redirects (direct 1-step 301)
  const slugPart = cleanPath.replace(/^\/(?:blog|page)\//, "");
  if (slugPart) {
    const historicalRedirect = await resolveDirectSlugRedirect(slugPart);
    if (historicalRedirect) {
      return {
        status: 301,
        isNoindex: false,
        html: "",
        redirectUrl: historicalRedirect,
      };
    }
  }

  let statusCode = 200;
  let isNoindex = false;
  let isNofollow = false;
  let title = "گُردیه | فروشگاه گجت‌های کاربردی برای خونه، سفر و باشگاه";
  let description = "برای هر محصول می‌گیم چه مشکلی رو حل می‌کنه، چه کاری از دستش برنمی‌آد و شرایط تست و تعویضش چیه. گجت‌های کاربردی با توضیح صادقانه.";
  let canonicalUrl = `${cleanBase}${cleanPath}`;
  let ogImage = `${cleanBase}/assets/gordiyeh-logo-emblem.webp`;
  let ogType = "website";
  let h1Text = "";
  let bodyContent = "";
  let initialDataScript = "";
  const jsonLdList: any[] = [];

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "گُردیه (GORDIYEH)",
    "url": `${cleanBase}/`,
    "logo": `${cleanBase}/assets/gordiyeh-logo-emblem.webp`,
    "sameAs": [],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "گُردیه",
    "url": `${cleanBase}/`,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${cleanBase}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const breadcrumbItems: { name: string; url: string }[] = [
    { name: "خانه", url: `${cleanBase}/` },
  ];

  // Route routing
  if (cleanPath === "/" || cleanPath === "") {
    canonicalUrl = `${cleanBase}/`;
    title = "گُردیه | فروشگاه گجت‌های کاربردی برای خونه، سفر و باشگاه";
    description = "برای هر محصول می‌گیم چه مشکلی رو حل می‌کنه، چه کاری از دستش برنمی‌آد و شرایط تست و تعویضش چیه. گجت‌های کاربردی با توضیح صادقانه.";
    h1Text = "گجت‌هایی که یه کار روزمره رو راحت‌تر می‌کنن";
    jsonLdList.push(orgSchema);
    jsonLdList.push(websiteSchema);

    bodyContent = `
      <div class="ssr-page">
        <h1>${h1Text}</h1>
        <p>${description}</p>
        <div class="ssr-categories">
          ${SEO_CATEGORIES.map((c) => `<a href="/category/${c.slug}">${c.h1}</a>`).join(" • ")}
        </div>
      </div>
    `;
  } else if (cleanPath.startsWith("/category/")) {
    const catSlug = cleanPath.replace(/^\/category\//, "").split("/")[0];
    const category = CATEGORY_BY_SLUG.get(catSlug);

    if (!category) {
      statusCode = 404;
      isNoindex = true;
      title = "دسته‌بندی پیدا نشد - ۴۰۴ | گُردیه";
      description = "این دسته‌بندی توی فروشگاه گُردیه پیدا نشد.";
      h1Text = "دسته‌بندی پیدا نشد - خطای ۴۰۴";
      bodyContent = `<h1>${h1Text}</h1><p>${description}</p>`;
    } else {
      canonicalUrl = `${cleanBase}/category/${category.slug}`;
      title = category.title;
      description = category.description;
      h1Text = category.h1;

      breadcrumbItems.push({ name: category.h1, url: canonicalUrl });

      const catProducts = SEO_PRODUCTS.filter((p) => p.categorySlug === category.slug);

      bodyContent = `
        <div class="ssr-category-page">
          <nav aria-label="Breadcrumb">
            ${breadcrumbItems.map((b) => `<a href="${b.url}">${b.name}</a>`).join(" / ")}
          </nav>
          <h1>${h1Text}</h1>
          <p>${description}</p>
          <div class="ssr-product-grid">
            ${catProducts.map((p) => `
              <div class="ssr-product-card">
                <a href="/product/${p.slug}">
                  <h2>${p.title}</h2>
                  <span class="price">${formatToman(p.retailPriceToman)} تومان</span>
                </a>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }
  } else if (cleanPath.startsWith("/product/")) {
    const prodSlug = cleanPath.replace(/^\/product\//, "").split("/")[0];
    const product = PRODUCT_BY_SLUG.get(prodSlug);

    if (!product) {
      statusCode = 404;
      isNoindex = true;
      title = "محصول پیدا نشد - ۴۰۴ | گُردیه";
      description = "این محصول توی فروشگاه گُردیه پیدا نشد.";
      h1Text = "محصول پیدا نشد - خطای ۴۰۴";
      bodyContent = `<h1>${h1Text}</h1><p>${description}</p>`;
    } else {
      canonicalUrl = `${cleanBase}/product/${product.slug}`;
      const rawTitle = product.seoTitle || `${product.title} | گُردیه`;
      title = rawTitle.length > 60 ? rawTitle.slice(0, 58) + "…" : rawTitle;
      const rawDesc = product.description;
      description = rawDesc.length > 160 ? rawDesc.slice(0, 158) + "…" : rawDesc;
      h1Text = product.title;
      ogImage = product.image;
      ogType = "product";

      const cat = CATEGORY_BY_SLUG.get(product.categorySlug);
      if (cat) {
        breadcrumbItems.push({ name: cat.h1, url: `${cleanBase}/category/${cat.slug}` });
      }
      breadcrumbItems.push({ name: product.title, url: canonicalUrl });

      jsonLdList.push({
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.title,
        "image": product.image,
        "description": product.description,
        "sku": product.sku,
        "brand": {
          "@type": "Brand",
          "name": product.brandFa || product.brand,
        },
        "offers": {
          "@type": "Offer",
          "url": canonicalUrl,
          "price": product.retailPriceRial,
          "priceCurrency": "IRR",
          "priceSpecification": {
            "@type": "UnitPriceSpecification",
            "price": product.retailPriceToman,
            "priceCurrency": "TOMAN",
          },
          "itemCondition": "https://schema.org/NewCondition",
          "availability": "https://schema.org/InStock",
        },
      });

      bodyContent = `
        <div class="ssr-product-page">
          <nav aria-label="Breadcrumb">
            ${breadcrumbItems.map((b) => `<a href="${b.url}">${b.name}</a>`).join(" / ")}
          </nav>
          <h1>${h1Text}</h1>
          <div class="ssr-price-box">
            <span class="ssr-price">${formatToman(product.retailPriceToman)} تومان</span>
          </div>
          <div class="ssr-description">
            <p>${product.description}</p>
          </div>
        </div>
      `;
    }
  } else if (cleanPath === "/blog") {
    canonicalUrl = `${cleanBase}/blog`;
    title = "راهنمای انتخاب گجت‌ها و مجله | گُردیه";
    description = "قبل از خرید بخونید: تفاوت لومن واقعی ANSI، مرتب کردن میز کار و باورهای غلط درباره باتری گجت‌های شارژی.";
    h1Text = "راهنمای انتخاب و مجله گُردیه";

    breadcrumbItems.push({ name: "راهنمای انتخاب", url: canonicalUrl });

    // Fetch published articles from database
    const publishedArticles = await listAllDocuments("article", false);

    bodyContent = `
      <div class="ssr-blog-list">
        <h1>${h1Text}</h1>
        <p>${description}</p>
        <ul>
          ${publishedArticles.map((a) => `<li><a href="/blog/${a.slug}">${a.title}</a></li>`).join("")}
        </ul>
      </div>
    `;
  } else if (cleanPath.startsWith("/blog/") || cleanPath.startsWith("/page/")) {
    const isBlog = cleanPath.startsWith("/blog/");
    const docKind = isBlog ? "article" : "page";
    const slug = cleanPath.replace(/^\/(?:blog|page)\//, "").split("/")[0];

    // Check signed preview token
    const isPreview = query.preview_token === DRAFT_PREVIEW_TOKEN;
    const document = await getDocumentBySlug(slug, docKind, isPreview);

    if (!document) {
      statusCode = 404;
      isNoindex = true;
      title = "صفحه پیدا نشد - ۴۰۴ | گُردیه";
      description = "این صفحه توی فروشگاه گُردیه پیدا نشد.";
      h1Text = "صفحه پیدا نشد - خطای ۴۰۴";
      bodyContent = `<h1>${h1Text}</h1><p>${description}</p>`;
    } else {
      canonicalUrl = document.canonicalUrl || `${cleanBase}/${docKind === "article" ? "blog" : "page"}/${document.slug}`;
      const baseDocTitle = document.seoTitle || document.title;
      title = baseDocTitle.includes("گُردیه") ? baseDocTitle : `${baseDocTitle} | گُردیه`;
      description = document.seoDescription || document.derivedPlainText.substring(0, 160);
      h1Text = document.title;
      isNoindex = document.noindex || document.slug === "licenses";
      isNofollow = document.slug === "licenses";
      ogImage = document.coverImage || ogImage;
      ogType = isBlog ? "article" : "website";

      if (isBlog) {
        breadcrumbItems.push({ name: "راهنمای انتخاب", url: `${cleanBase}/blog` });
      }
      breadcrumbItems.push({ name: document.title, url: canonicalUrl });

      if (isBlog) {
        jsonLdList.push({
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": document.title,
          "description": description,
          "image": ogImage,
          "datePublished": document.publishedAt || document.updatedAt,
          "dateModified": document.contentModifiedAt || document.updatedAt,
          "author": {
            "@type": "Person",
            "name": document.author,
          },
          "publisher": {
            "@type": "Organization",
            "name": "گُردیه (GORDIYEH)",
            "logo": {
              "@type": "ImageObject",
              "url": `${cleanBase}/assets/gordiyeh-logo-emblem.webp`,
            },
          },
        });
      }

      // Pre-fetch product_card items for SSR & Hydration
      const productIds = document.blocks
        .filter((b) => b.type === "product_card")
        .map((b: any) => b.productId);

      const productMap: Record<string, CanonicalProduct> = {};
      for (const pid of productIds) {
        const prod = PORTED_PRODUCTS.find((p) => p.id === pid);
        if (prod) productMap[pid] = prod;
      }

      // Render shared BlockRenderer
      const renderedBlocks = renderToString(
        React.createElement(BlockRenderer, {
          blocks: document.blocks,
          products: productMap,
        })
      );

      bodyContent = `
        <article class="ssr-document ssr-${docKind}">
          <nav aria-label="Breadcrumb">
            ${breadcrumbItems.map((b) => `<a href="${b.url}">${b.name}</a>`).join(" / ")}
          </nav>
          <h1>${h1Text}</h1>
          <div class="ssr-blocks">${renderedBlocks}</div>
        </article>
      `;

      // Escaped Initial Data for client-side hydration (no hydration mismatch)
      const initialPayload = JSON.stringify({ document, products: productMap }).replace(/</g, "\\u003c");
      initialDataScript = `<script>window.__INITIAL_DATA__ = ${initialPayload};</script>`;
    }
  } else if (
    cleanPath === "/cart" ||
    cleanPath === "/checkout" ||
    cleanPath === "/receipt" ||
    cleanPath === "/login" ||
    cleanPath === "/orders" ||
    cleanPath === "/invoice" ||
    cleanPath === "/privacy-hub" ||
    cleanPath === "/tasks" ||
    cleanPath === "/admin" ||
    cleanPath === "/offline" ||
    cleanPath === "/search" ||
    cleanPath === "/compare"
  ) {
    isNoindex = true;
    title = "فروشگاه گُردیه";
    h1Text = "فروشگاه گُردیه";
    bodyContent = `<h1>${h1Text}</h1>`;
  } else {
    statusCode = 404;
    isNoindex = true;
    title = "صفحه پیدا نشد - خطای ۴۰۴ | گُردیه";
    description = "این صفحه توی فروشگاه گُردیه پیدا نشد.";
    h1Text = "صفحه پیدا نشد - خطای ۴۰۴";
    bodyContent = `<h1>${h1Text}</h1><p>${description}</p>`;
  }

  // Construct meta injection tags
  let metaTags = `
    <title>${escapeXml(title)}</title>
    <meta name="description" content="${escapeXml(description)}" />
    <link rel="canonical" href="${escapeXml(canonicalUrl)}" />
    <meta property="og:title" content="${escapeXml(title)}" />
    <meta property="og:description" content="${escapeXml(description)}" />
    <meta property="og:image" content="${escapeXml(ogImage)}" />
    <meta property="og:url" content="${escapeXml(canonicalUrl)}" />
    <meta property="og:type" content="${escapeXml(ogType)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeXml(title)}" />
    <meta name="twitter:description" content="${escapeXml(description)}" />
    <meta name="twitter:image" content="${escapeXml(ogImage)}" />
  `;

  if (isNoindex) {
    metaTags += `\n    <meta name="robots" content="${isNofollow ? "noindex, nofollow" : "noindex, follow"}" />`;
  }

  for (const schema of jsonLdList) {
    metaTags += `\n    <script type="application/ld+json">${JSON.stringify(schema)}</script>`;
  }

  if (initialDataScript) {
    metaTags += `\n    ${initialDataScript}`;
  }

  let finalHtml = rawHtmlTemplate;
  if (!finalHtml.includes('dir="rtl"')) {
    finalHtml = finalHtml.replace(/<html[^>]*>/i, '<html lang="fa" dir="rtl">');
  }

  finalHtml = finalHtml.replace(/<title>.*?<\/title>/is, metaTags);
  finalHtml = finalHtml.replace('<div id="root"></div>', `<div id="root">${bodyContent}</div>`);

  return {
    status: statusCode,
    isNoindex,
    isNofollow,
    html: finalHtml,
  };
}

// Backward-compatible synchronous wrapper
export function renderStorefrontSeoPage(
  urlPath: string,
  query: Record<string, any>,
  siteUrl: string,
  rawHtmlTemplate: string
): SeoRenderResult {
  // Simple synchronous execution returning basic skeleton if called synchronously
  const cleanBase = siteUrl.replace(/\/+$/, "");
  const legacyRedirect = resolve301Redirect(urlPath);
  if (legacyRedirect) {
    return { status: 301, isNoindex: false, html: "", redirectUrl: legacyRedirect };
  }
  return {
    status: 200,
    isNoindex: false,
    html: rawHtmlTemplate,
  };
}
