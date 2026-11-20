import { CommerceDB } from "./db";
import { INITIAL_BLOG_POSTS, INITIAL_STATIC_PAGES, INITIAL_CATEGORIES } from "../src/utils/cmsStore";

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\u0600-\u06FF\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '') || 'item';
}

export function formatToman(amount: number): string {
  return new Intl.NumberFormat('fa-IR').format(amount);
}

export function getRobotsTxt(baseUrl: string): string {
  return `User-agent: *
Disallow: /admin
Disallow: /admin/
Disallow: /api
Disallow: /api/
Disallow: /cart
Disallow: /checkout
Disallow: /account
Disallow: /account/
Disallow: /payment
Disallow: /payment/
Disallow: /login
Disallow: /*?*sort=
Disallow: /*?*min=
Disallow: /*?*max=
Disallow: /*?*brand=
Disallow: /*?*inStock=

Sitemap: ${baseUrl}/sitemap.xml
`;
}

export function getSitemapXml(baseUrl: string): string {
  const products = CommerceDB.getProducts();
  const now = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  xml += `  <url><loc>${baseUrl}/</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;
  xml += `  <url><loc>${baseUrl}/help</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
  xml += `  <url><loc>${baseUrl}/blog</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>\n`;

  for (const cat of INITIAL_CATEGORIES) {
    xml += `  <url><loc>${baseUrl}/category/${cat.slug}</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>\n`;
  }

  for (const prod of products) {
    const slug = slugify(prod.title);
    xml += `  <url><loc>${baseUrl}/product/${prod.id}-${encodeURIComponent(slug)}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>\n`;
  }

  for (const post of INITIAL_BLOG_POSTS) {
    xml += `  <url><loc>${baseUrl}/blog/${post.slug}</loc><lastmod>${now}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>\n`;
  }

  for (const page of INITIAL_STATIC_PAGES) {
    xml += `  <url><loc>${baseUrl}/page/${page.slug}</loc><lastmod>${now}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>\n`;
  }

  xml += `</urlset>`;
  return xml;
}

export interface SeoRenderResult {
  status: number;
  redirectUrl?: string;
  html: string;
}

export function renderStorefrontSeoPage(
  urlPath: string,
  queryParams: Record<string, any>,
  baseUrl: string,
  rawHtmlTemplate: string
): SeoRenderResult {
  const products = CommerceDB.getProducts();
  let decodedPath = urlPath;
  try {
    decodedPath = decodeURIComponent(urlPath);
  } catch {}

  let title = "فروشگاه اینترنتی | خرید هوشمند گجت و تجهیزات دیجیتال";
  let description = "فروشگاه تخصصی گجت‌های هوشمند، پروژکتورهای قابل حمل، لوازم خانگی و تجهیزات کمپینگ با ارسال سراسری و ضمانت سلامت فیزیکی کالاها";
  let canonicalUrl = `${baseUrl}${urlPath}`;
  let ogImage = `${baseUrl}/banner.jpg`;
  let h1Text = "فروشگاه اینترنتی لوازم هوشمند و تجهیزات دیجیتال";
  let bodyContent = "";
  let jsonLdList: any[] = [];
  let isNoindex = false;
  let statusCode = 200;

  // Organization Schema (for home and general)
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "فروشگاه اینترنتی",
    "url": baseUrl,
    "logo": `${baseUrl}/logo.png`,
    "sameAs": []
  };

  const breadcrumbItems: { name: string; url: string }[] = [
    { name: "خانه", url: `${baseUrl}/` }
  ];

  // Route matching
  if (decodedPath === "/" || decodedPath === "") {
    title = "فروشگاه اینترنتی | خرید گجت‌های هوشمند و دیجیتال";
    description = "فروشگاه اینترنتی گجت‌های هوشمند، پروژکتورهای همراه و تجهیزات کمپینگ با ارسال سراسری و ضمانت اصالت";
    h1Text = "فروشگاه اینترنتی لوازم هوشمند و تجهیزات دیجیتال";
    canonicalUrl = `${baseUrl}/`;
    jsonLdList.push(orgSchema);

    bodyContent = `
      <div class="ssr-page">
        <h1>${h1Text}</h1>
        <p>${description}</p>
        <div class="ssr-categories">
          ${INITIAL_CATEGORIES.map(c => `<a href="/category/${c.slug}">${c.name}</a>`).join(' • ')}
        </div>
      </div>
    `;
  } else if (decodedPath.startsWith("/category/")) {
    const slug = decodedPath.replace(/^\/category\//, "").split("/")[0].split("?")[0];
    const category = INITIAL_CATEGORIES.find(c => c.slug === slug);

    if (!category && slug !== "all") {
      statusCode = 404;
      title = "دسته‌بندی یافت نشد - ۴۰۴";
      description = "دسته‌بندی مورد نظر در فروشگاه موجود نمی‌باشد.";
      h1Text = "دسته‌بندی مورد نظر یافت نشد - ۴۰۴";
      bodyContent = `<h1>${h1Text}</h1><p>${description}</p>`;
    } else {
      const catName = category ? category.name : "همه کالاها";
      title = `خرید ${catName} با ضمانت اصالت | فروشگاه اینترنتی`;
      if (title.length > 60) title = title.slice(0, 58) + "…";
      description = `بررسی مشخصات و خرید انواع ${catName} با تضمین سلامت فیزیکی و ارسال سریع به سراسر کشور`;
      if (description.length > 160) description = description.slice(0, 158) + "…";

      // Pagination support: ?page=N with self-referencing canonical
      const pageQuery = queryParams.page ? `?page=${queryParams.page}` : "";
      canonicalUrl = `${baseUrl}/category/${slug}${pageQuery}`;
      h1Text = catName;

      // Filter check for noindex: multiple filter parameters
      const filterParamsCount = Object.keys(queryParams).filter(k => k !== 'page').length;
      if (filterParamsCount > 1) {
        isNoindex = true;
      }

      breadcrumbItems.push({ name: catName, url: canonicalUrl });
      jsonLdList.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbItems.map((b, idx) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "name": b.name,
          "item": b.url
        }))
      });

      const catProducts = products.filter(p => !category || p.category === category.name);
      bodyContent = `
        <div class="ssr-category-page">
          <nav aria-label="Breadcrumb">
            ${breadcrumbItems.map(b => `<a href="${b.url}">${b.name}</a>`).join(" / ")}
          </nav>
          <h1>${h1Text}</h1>
          <p>${description}</p>
          <div class="ssr-product-grid">
            ${catProducts.map(p => `
              <div class="ssr-product-item">
                <h3><a href="/product/${p.id}-${slugify(p.title)}">${p.title}</a></h3>
                <span>${formatToman(p.retailPrice)} تومان</span>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }
  } else if (decodedPath.startsWith("/product/")) {
    const rawParam = decodedPath.replace(/^\/product\//, "").split("/")[0].split("?")[0];
    
    // Find matching product by id
    const product = products.find(p => rawParam === p.id || rawParam.startsWith(p.id + "-") || rawParam.startsWith(p.id));

    if (!product) {
      statusCode = 404;
      title = "محصول مورد نظر یافت نشد - ۴۰۴";
      description = "کالای مورد نظر شما در فروشگاه موجود نمی‌باشد یا حذف شده است.";
      h1Text = "کالای مورد نظر یافت نشد - ۴۰۴";
      bodyContent = `<h1>${h1Text}</h1><p>${description}</p>`;
    } else {
      const canonicalSlug = slugify(product.title);
      const expectedDecodedPath = `/product/${product.id}-${canonicalSlug}`;

      // 301 Redirect from old or incomplete slug to canonical URL (W11.4 requirement)
      if (decodedPath !== expectedDecodedPath && decodedPath !== `/product/${product.id}`) {
        // If rawParam doesn't match canonical slug, 301 redirect
        if (decodedPath !== expectedDecodedPath) {
          return {
            status: 301,
            redirectUrl: `/product/${product.id}-${encodeURIComponent(canonicalSlug)}`,
            html: ""
          };
        }
      }

      canonicalUrl = `${baseUrl}/product/${product.id}-${encodeURIComponent(canonicalSlug)}`;
      title = `قیمت و خرید ${product.title} | فروشگاه`;
      if (title.length > 60) title = title.slice(0, 58) + "…";
      description = `${product.description?.slice(0, 140) || product.title} با تضمین اصالت فیزیکی و ارسال سریع`;
      if (description.length > 160) description = description.slice(0, 158) + "…";
      h1Text = product.title;
      ogImage = product.image;

      const catDetail = INITIAL_CATEGORIES.find(c => c.name === product.category);
      if (catDetail) {
        breadcrumbItems.push({ name: catDetail.name, url: `${baseUrl}/category/${catDetail.slug}` });
      }
      breadcrumbItems.push({ name: product.title, url: canonicalUrl });

      // Product Schema JSON-LD with real price from DB
      jsonLdList.push({
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.title,
        "image": product.image,
        "description": product.description || product.title,
        "sku": product.sku,
        "brand": {
          "@type": "Brand",
          "name": product.brandFa || product.brand
        },
        "offers": {
          "@type": "Offer",
          "url": canonicalUrl,
          "priceCurrency": "IRR",
          "price": product.retailPrice * 10,
          "priceSpecification": {
            "@type": "UnitPriceSpecification",
            "price": product.retailPrice,
            "priceCurrency": "TOMAN"
          },
          "itemCondition": "https://schema.org/NewCondition",
          "availability": "https://schema.org/InStock"
        }
      });

      jsonLdList.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbItems.map((b, idx) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "name": b.name,
          "item": b.url
        }))
      });

      bodyContent = `
        <div class="ssr-product-page">
          <nav aria-label="Breadcrumb">
            ${breadcrumbItems.map(b => `<a href="${b.url}">${b.name}</a>`).join(" / ")}
          </nav>
          <h1>${h1Text}</h1>
          <div class="ssr-price-box">
            <span class="ssr-price">${formatToman(product.retailPrice)} تومان</span>
          </div>
          <div class="ssr-description">
            <p>${product.description || ""}</p>
          </div>
        </div>
      `;
    }
  } else if (decodedPath.startsWith("/blog/")) {
    const slug = decodedPath.replace(/^\/blog\//, "").split("/")[0].split("?")[0];
    const post = INITIAL_BLOG_POSTS.find(p => p.slug === slug);

    if (!post) {
      statusCode = 404;
      title = "مقاله مورد نظر یافت نشد - ۴۰۴";
      description = "مقاله مورد نظر یافت نشد.";
      h1Text = "مقاله مورد نظر یافت نشد - ۴۰۴";
      bodyContent = `<h1>${h1Text}</h1><p>${description}</p>`;
    } else {
      title = `${post.title} | مجله فروشگاه`;
      if (title.length > 60) title = title.slice(0, 58) + "…";
      description = post.excerpt.slice(0, 155);
      canonicalUrl = `${baseUrl}/blog/${post.slug}`;
      h1Text = post.title;

      breadcrumbItems.push({ name: "مجله تخصصی", url: `${baseUrl}/blog` });
      breadcrumbItems.push({ name: post.title, url: canonicalUrl });

      jsonLdList.push({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": post.title,
        "description": post.excerpt,
        "datePublished": post.date,
        "author": {
          "@type": "Person",
          "name": post.author
        }
      });

      bodyContent = `
        <article class="ssr-blog-article">
          <nav aria-label="Breadcrumb">
            ${breadcrumbItems.map(b => `<a href="${b.url}">${b.name}</a>`).join(" / ")}
          </nav>
          <h1>${h1Text}</h1>
          <p class="ssr-excerpt">${post.excerpt}</p>
          <div class="ssr-article-body">${post.content}</div>
        </article>
      `;
    }
  } else if (decodedPath === "/blog") {
    title = "مجله تخصصی و راهنمای خرید | فروشگاه اینترنتی";
    description = "مقالات تخصصی، مقایسه گجت‌های هوشمند و راهنمای خرید ملزومات سفر و دیجیتال";
    canonicalUrl = `${baseUrl}/blog`;
    h1Text = "مجله تخصصی و راهنمای خرید";

    bodyContent = `
      <div class="ssr-blog-list">
        <h1>${h1Text}</h1>
        <p>${description}</p>
        <ul>
          ${INITIAL_BLOG_POSTS.map(p => `<li><a href="/blog/${p.slug}">${p.title}</a></li>`).join("")}
        </ul>
      </div>
    `;
  } else if (decodedPath === "/help") {
    title = "راهنما، پشتیبانی و سوالات متداول | فروشگاه اینترنتی";
    description = "مرکز پاسخگویی به سوالات متداول، راهنمای ثبت و پیگیری سفارش، شرایط بازگشت و پشتیبانی رسمی";
    canonicalUrl = `${baseUrl}/help`;
    h1Text = "مرکز پشتیبانی و راهنمای خرید";

    jsonLdList.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "چگونه می‌توانم وضعیت سفارش خود را پیگیری کنم؟",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "پس از ثبت سفارش، کد رهگیری پستی به همراه پیامک تایید به شماره شما ارسال می‌شود و در بخش سفارش‌های من قابل مشاهده است."
          }
        },
        {
          "@type": "Question",
          "name": "شرایط بازگشت کالا چگونه است؟",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "تمامی کالاها تا ۷ روز پس از دریافت دارای ضمانت سلامت و مهلت تست طبق ضوابط فروشگاه هستند."
          }
        }
      ]
    });

    bodyContent = `
      <div class="ssr-help-page">
        <h1>${h1Text}</h1>
        <p>${description}</p>
      </div>
    `;
  } else if (decodedPath === "/search") {
    isNoindex = true;
    title = "جستجو در محصولات | فروشگاه اینترنتی";
    description = "نتایج جستجو در کالاهای فروشگاه اینترنتی";
    canonicalUrl = `${baseUrl}/search`;
    h1Text = "نتایج جستجوی کالا";
    bodyContent = `<h1>${h1Text}</h1>`;
  } else if (decodedPath.startsWith("/page/")) {
    const slug = decodedPath.replace(/^\/page\//, "").split("/")[0].split("?")[0];
    const staticPage = INITIAL_STATIC_PAGES.find(p => p.slug === slug);

    if (!staticPage) {
      statusCode = 404;
      title = "صفحه مورد نظر یافت نشد - ۴۰۴";
      description = "صفحه مورد نظر یافت نشد.";
      h1Text = "صفحه مورد نظر یافت نشد - ۴۰۴";
      bodyContent = `<h1>${h1Text}</h1><p>${description}</p>`;
    } else {
      title = `${staticPage.title} | فروشگاه اینترنتی`;
      description = `${staticPage.title} - قوانین و اطلاعات فروشگاه اینترنتی`;
      canonicalUrl = `${baseUrl}/page/${staticPage.slug}`;
      h1Text = staticPage.title;
      bodyContent = `<h1>${h1Text}</h1><div>${staticPage.content}</div>`;
    }
  } else if (decodedPath === "/cart" || decodedPath === "/checkout" || decodedPath === "/compare" || decodedPath === "/login" || decodedPath.startsWith("/account") || decodedPath.startsWith("/payment")) {
    isNoindex = true;
    title = "سبد خرید و تسویه حساب | فروشگاه اینترنتی";
    h1Text = "فروشگاه اینترنتی";
    bodyContent = `<h1>${h1Text}</h1>`;
  } else {
    // Unknown public slug
    statusCode = 404;
    title = "صفحه مورد نظر یافت نشد - ۴۰۴";
    description = "صفحه مورد نظر شما در فروشگاه اینترنتی یافت نشد.";
    h1Text = "صفحه مورد نظر یافت نشد - خطای ۴۰۴";
    bodyContent = `<h1>${h1Text}</h1><p>${description}</p>`;
  }

  // Construct meta injection tags
  let metaTags = `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${canonicalUrl}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${ogImage}" />
  `;

  if (isNoindex) {
    metaTags += `\n    <meta name="robots" content="noindex, follow" />`;
  }

  for (const schema of jsonLdList) {
    metaTags += `\n    <script type="application/ld+json">${JSON.stringify(schema)}</script>`;
  }

  // Inject into raw template
  let finalHtml = rawHtmlTemplate;

  // Replace <title>...</title>
  finalHtml = finalHtml.replace(/<title>.*?<\/title>/is, metaTags);

  // Inject SSR body into <div id="root">
  finalHtml = finalHtml.replace(
    '<div id="root"></div>',
    `<div id="root">${bodyContent}</div>`
  );

  return {
    status: statusCode,
    html: finalHtml
  };
}
