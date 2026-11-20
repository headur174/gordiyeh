/**
 * test_seo.ts - Comprehensive SEO, 301 Redirects & Architecture Verification
 */

async function runSeoTests() {
  const baseUrl = 'http://localhost:3000';
  console.log(`Starting SEO & Architecture Test Suite against ${baseUrl}...\n`);

  let allPassed = true;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
    } else {
      console.error(`  [FAIL] ${testName} ${details ? `(${details})` : ''}`);
      allPassed = false;
    }
  }

  try {
    // 1. Home /
    console.log('1. Testing Home (/)');
    const resHome = await fetch(`${baseUrl}/`);
    assert(resHome.status === 200, 'Home status is 200', `Got ${resHome.status}`);
    const htmlHome = await resHome.text();
    const titleHomeMatch = htmlHome.match(/<title>(.*?)<\/title>/i);
    assert(!!titleHomeMatch && titleHomeMatch[1].length <= 60, 'Title exists and <= 60 chars', `Title: "${titleHomeMatch?.[1]}"`);
    const descHomeMatch = htmlHome.match(/<meta\s+name="description"\s+content="(.*?)"/i);
    assert(!!descHomeMatch && descHomeMatch[1].length <= 160, 'Description exists and <= 160 chars', `Desc len: ${descHomeMatch?.[1]?.length}`);
    const canonicalHomeMatch = htmlHome.match(/<link\s+rel="canonical"\s+href="(.*?)"/i);
    assert(!!canonicalHomeMatch, 'Canonical tag exists on Home');
    const h1CountHome = (htmlHome.match(/<h1[\s>]/gi) || []).length;
    assert(h1CountHome === 1, 'Exactly ONE <h1> on Home page', `Found ${h1CountHome} <h1> tags`);
    assert(htmlHome.includes('application/ld+json'), 'JSON-LD schema present on Home');

    // 2. Category /category/digital
    console.log('\n2. Testing Category (/category/digital)');
    const resCat = await fetch(`${baseUrl}/category/digital`);
    assert(resCat.status === 200, 'Category status is 200');
    const htmlCat = await resCat.text();
    const h1CountCat = (htmlCat.match(/<h1[\s>]/gi) || []).length;
    assert(h1CountCat === 1, 'Exactly ONE <h1> on Category page', `Found ${h1CountCat}`);
    const canonicalCat = htmlCat.match(/<link\s+rel="canonical"\s+href="(.*?)"/i);
    assert(!!canonicalCat && canonicalCat[1].includes('/category/digital'), 'Category self-referencing canonical exists');

    // 3. Product /product/mini-shaker-blender
    console.log('\n3. Testing Product (/product/mini-shaker-blender)');
    const resProd = await fetch(`${baseUrl}/product/mini-shaker-blender`);
    assert(resProd.status === 200, 'Product status is 200', `Got ${resProd.status}`);
    const htmlProd = await resProd.text();
    const h1CountProd = (htmlProd.match(/<h1[\s>]/gi) || []).length;
    assert(h1CountProd === 1, 'Product title <h1> present in raw HTML', `Found ${h1CountProd}`);
    assert(htmlProd.includes('"@type":"Product"') || htmlProd.includes('"@type": "Product"'), 'Product JSON-LD parses and is present');
    assert(htmlProd.includes('"priceCurrency":"IRR"') || htmlProd.includes('"priceCurrency": "IRR"'), 'Price currency in schema is IRR');

    // 4. 301 Redirects (no client navigation, real HTTP 301)
    console.log('\n4. Testing HTTP 301 Redirects');
    
    // 4a. Legacy product URL: /pro-beam -> /product/portable-smart-projector
    const resRedir1 = await fetch(`${baseUrl}/pro-beam`, { redirect: 'manual' });
    assert(resRedir1.status === 301, '301 redirect for /pro-beam', `Got ${resRedir1.status}`);
    const loc1 = resRedir1.headers.get('location') || '';
    assert(loc1 === '/product/portable-smart-projector' || loc1.endsWith('/product/portable-smart-projector'), 'Location header ends with /product/portable-smart-projector', `Got ${loc1}`);

    // 4b. Legacy product ID URL: /product/prod_ported_shaker -> /product/mini-shaker-blender
    const resRedir2 = await fetch(`${baseUrl}/product/prod_ported_shaker`, { redirect: 'manual' });
    assert(resRedir2.status === 301, '301 redirect for /product/prod_ported_shaker', `Got ${resRedir2.status}`);
    const loc2 = resRedir2.headers.get('location') || '';
    assert(loc2 === '/product/mini-shaker-blender' || loc2.endsWith('/product/mini-shaker-blender'), 'Location header ends with /product/mini-shaker-blender', `Got ${loc2}`);

    // 4c. Legacy category: /digital -> /category/digital
    const resRedir3 = await fetch(`${baseUrl}/digital`, { redirect: 'manual' });
    assert(resRedir3.status === 301, '301 redirect for /digital', `Got ${resRedir3.status}`);
    const loc3 = resRedir3.headers.get('location') || '';
    assert(loc3 === '/category/digital' || loc3.endsWith('/category/digital'), 'Location header ends with /category/digital', `Got ${loc3}`);

    // 4d. Legacy static page: /about -> /page/about-us
    const resRedir4 = await fetch(`${baseUrl}/about`, { redirect: 'manual' });
    assert(resRedir4.status === 301, '301 redirect for /about', `Got ${resRedir4.status}`);
    const loc4 = resRedir4.headers.get('location') || '';
    assert(loc4 === '/page/about-us' || loc4.endsWith('/page/about-us'), 'Location header ends with /page/about-us', `Got ${loc4}`);

    // 4e. Legacy blog post: /blog/mechanical-keyboard-buying-guide -> /blog/how-to-choose-a-real-mini-projector
    const resRedir5 = await fetch(`${baseUrl}/blog/mechanical-keyboard-buying-guide`, { redirect: 'manual' });
    assert(resRedir5.status === 301, '301 redirect for legacy blog post', `Got ${resRedir5.status}`);
    const loc5 = resRedir5.headers.get('location') || '';
    assert(loc5 === '/blog/how-to-choose-a-real-mini-projector' || loc5.endsWith('/blog/how-to-choose-a-real-mini-projector'), 'Location header ends with /blog/how-to-choose-a-real-mini-projector', `Got ${loc5}`);

    // 5. Blog Post /blog/how-to-choose-a-real-mini-projector
    console.log('\n5. Testing Canonical Blog (/blog/how-to-choose-a-real-mini-projector)');
    const resBlog = await fetch(`${baseUrl}/blog/how-to-choose-a-real-mini-projector`);
    assert(resBlog.status === 200, 'Blog post status is 200', `Got ${resBlog.status}`);
    const htmlBlog = await resBlog.text();
    const h1CountBlog = (htmlBlog.match(/<h1[\s>]/gi) || []).length;
    assert(h1CountBlog === 1, 'Exactly ONE <h1> on Blog post', `Found ${h1CountBlog}`);
    assert(htmlBlog.includes('"@type":"Article"') || htmlBlog.includes('"@type": "Article"'), 'Article JSON-LD present');

    // 6. Static Page /page/privacy
    console.log('\n6. Testing Static Page (/page/privacy)');
    const resPrivacy = await fetch(`${baseUrl}/page/privacy`);
    assert(resPrivacy.status === 200, 'Privacy page status is 200', `Got ${resPrivacy.status}`);
    const htmlPrivacy = await resPrivacy.text();
    assert(htmlPrivacy.includes('حریم خصوصی'), 'Privacy page contains Persian title');
    assert(htmlPrivacy.includes('عدم ردیابی') || htmlPrivacy.includes('ردیابی'), 'Privacy page details tracking transparency');

    // 7. Missing Slug (404)
    console.log('\n7. Testing 404 for Unknown Slug (/category/non-existent-category)');
    const res404 = await fetch(`${baseUrl}/category/non-existent-category`);
    assert(res404.status === 404, 'Returns HTTP 404 status code', `Got ${res404.status}`);
    assert(res404.headers.get('x-robots-tag')?.includes('noindex'), '404 has X-Robots-Tag: noindex header');
    const html404 = await res404.text();
    assert(html404.includes('۴۰۴') || html404.includes('404'), 'Title/content contains 404 error message');

    // 8. Robots.txt
    console.log('\n8. Testing /robots.txt');
    const resRobots = await fetch(`${baseUrl}/robots.txt`);
    assert(resRobots.status === 200, 'robots.txt returns status 200');
    const txtRobots = await resRobots.text();
    assert(txtRobots.includes('Disallow: /admin'), 'robots.txt disallows /admin');
    assert(txtRobots.includes('Disallow: /cart'), 'robots.txt disallows /cart');
    assert(txtRobots.includes('Disallow: /checkout'), 'robots.txt disallows /checkout');
    assert(txtRobots.includes('Disallow: /privacy-hub'), 'robots.txt disallows /privacy-hub');
    assert(txtRobots.includes('Disallow: /tasks'), 'robots.txt disallows /tasks');
    assert(txtRobots.includes('Sitemap:'), 'robots.txt references sitemap');

    // 9. X-Robots-Tag on private routes
    console.log('\n9. Testing X-Robots-Tag on /cart');
    const resCart = await fetch(`${baseUrl}/cart`);
    const cartRobots = resCart.headers.get('x-robots-tag');
    assert(!!cartRobots && cartRobots.includes('noindex'), 'Cart has X-Robots-Tag: noindex', `Got: ${cartRobots}`);

    // 10. Sitemap.xml - Exact 25 canonical items
    console.log('\n10. Testing /sitemap.xml');
    const resSitemap = await fetch(`${baseUrl}/sitemap.xml`);
    assert(resSitemap.status === 200, 'sitemap.xml returns status 200');
    assert(resSitemap.headers.get('content-type')?.includes('application/xml'), 'sitemap Content-Type is application/xml');
    const xmlSitemap = await resSitemap.text();
    assert(xmlSitemap.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'), 'Valid sitemap xmlns');
    
    // Count <loc> entries (at least the 25 canonical base URLs + any dynamically created CMS documents)
    const locMatches = xmlSitemap.match(/<loc>(.*?)<\/loc>/g) || [];
    assert(locMatches.length >= 25, `Sitemap has at least 25 canonical URLs (found ${locMatches.length})`, `Count: ${locMatches.length}`);
    
    // Verify no changefreq or priority
    assert(!xmlSitemap.includes('<changefreq>'), 'Sitemap has NO changefreq tags');
    assert(!xmlSitemap.includes('<priority>'), 'Sitemap has NO priority tags');

    // Verify all 11 products in sitemap
    assert(xmlSitemap.includes('/product/portable-smart-projector'), 'Sitemap has portable-smart-projector');
    assert(xmlSitemap.includes('/product/g-lamp-smart-speaker'), 'Sitemap has g-lamp-smart-speaker');
    assert(xmlSitemap.includes('/product/mini-shaker-blender'), 'Sitemap has mini-shaker-blender');
    assert(xmlSitemap.includes('/product/massage-gun'), 'Sitemap has massage-gun');
    assert(xmlSitemap.includes('/product/4k-action-camera'), 'Sitemap has 4k-action-camera');
    assert(xmlSitemap.includes('/product/robot-vacuum'), 'Sitemap has robot-vacuum');
    assert(xmlSitemap.includes('/product/astronaut-galaxy-lamp'), 'Sitemap has astronaut-galaxy-lamp');
    assert(xmlSitemap.includes('/product/minipresso-portable-espresso'), 'Sitemap has minipresso-portable-espresso');
    assert(xmlSitemap.includes('/product/microderm-blackhead-remover'), 'Sitemap has microderm-blackhead-remover');
    assert(xmlSitemap.includes('/product/car-air-mattress'), 'Sitemap has car-air-mattress');
    assert(xmlSitemap.includes('/product/tsco-wireless-gamepad'), 'Sitemap has tsco-wireless-gamepad');

    // Verify 4 categories
    assert(xmlSitemap.includes('/category/digital'), 'Sitemap has /category/digital');
    assert(xmlSitemap.includes('/category/smart-home'), 'Sitemap has /category/smart-home');
    assert(xmlSitemap.includes('/category/travel-camping'), 'Sitemap has /category/travel-camping');
    assert(xmlSitemap.includes('/category/beauty-health'), 'Sitemap has /category/beauty-health');

    // Verify 3 blog articles
    assert(xmlSitemap.includes('/blog/how-to-choose-a-real-mini-projector'), 'Sitemap has projector blog');
    assert(xmlSitemap.includes('/blog/smart-lighting-and-desk-setup'), 'Sitemap has lighting blog');
    assert(xmlSitemap.includes('/blog/fast-charging-battery-health-myths'), 'Sitemap has battery blog');

    // Verify 5 static pages
    assert(xmlSitemap.includes('/page/about-us'), 'Sitemap has /page/about-us');
    assert(xmlSitemap.includes('/page/terms'), 'Sitemap has /page/terms');
    assert(xmlSitemap.includes('/page/faq'), 'Sitemap has /page/faq');
    assert(xmlSitemap.includes('/page/contact'), 'Sitemap has /page/contact');
    assert(xmlSitemap.includes('/page/privacy'), 'Sitemap has /page/privacy');

    console.log('\n----------------------------------------');
    if (allPassed) {
      console.log('ALL SEO & ARCHITECTURE VERIFICATION TESTS PASSED (100%)');
      process.exit(0);
    } else {
      console.error('SOME SEO & ARCHITECTURE TESTS FAILED');
      process.exit(1);
    }
  } catch (err: any) {
    console.error('SEO Test Suite execution failed with error:', err.message);
    process.exit(1);
  }
}

runSeoTests();
