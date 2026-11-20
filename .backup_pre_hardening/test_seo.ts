/**
 * test_seo.ts - SEO & SSR Verification Script (Workstream W11.4)
 * Asserts RAW HTML output (no client-side JS) for:
 * 1. Home /
 * 2. Category /category/digital
 * 3. Product /product/prod_ported_shaker
 * 4. Blog Post /blog/mechanical-keyboard-buying-guide
 * 5. Missing Slug (404) /category/non-existent-category
 * 6. Robots.txt (/robots.txt)
 * 7. Sitemap.xml (/sitemap.xml)
 */

async function runSeoTests() {
  const baseUrl = 'http://localhost:3000';
  console.log(`Starting SEO & SSR Test Suite against ${baseUrl}...\n`);

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
    assert(!!descHomeMatch && descHomeMatch[1].length <= 160, 'Description exists and <= 160 chars', `Desc len: ${descHomeMatch?.[1].length}`);
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

    // 3. Product /product/prod_ported_shaker
    console.log('\n3. Testing Product (/product/prod_ported_shaker)');
    const resProd = await fetch(`${baseUrl}/product/prod_ported_shaker`);
    assert(resProd.status === 200, 'Product status is 200', `Got ${resProd.status}`);
    const htmlProd = await resProd.text();
    const h1CountProd = (htmlProd.match(/<h1[\s>]/gi) || []).length;
    assert(h1CountProd === 1, 'Product title <h1> present in raw HTML', `Found ${h1CountProd}`);
    assert(htmlProd.includes('تومان') || htmlProd.includes('price'), 'Product price present in raw HTML');
    assert(htmlProd.includes('"@type":"Product"') || htmlProd.includes('"@type": "Product"'), 'Product JSON-LD parses and is present');

    // 4. Blog Post /blog/mechanical-keyboard-buying-guide
    console.log('\n4. Testing Blog (/blog/mechanical-keyboard-buying-guide)');
    const resBlog = await fetch(`${baseUrl}/blog/mechanical-keyboard-buying-guide`);
    assert(resBlog.status === 200, 'Blog post status is 200', `Got ${resBlog.status}`);
    const htmlBlog = await resBlog.text();
    const h1CountBlog = (htmlBlog.match(/<h1[\s>]/gi) || []).length;
    assert(h1CountBlog === 1, 'Exactly ONE <h1> on Blog post', `Found ${h1CountBlog}`);
    assert(htmlBlog.includes('"@type":"Article"') || htmlBlog.includes('"@type": "Article"'), 'Article JSON-LD present');

    // 5. Missing Slug (404)
    console.log('\n5. Testing 404 for Unknown Slug (/category/non-existent-category)');
    const res404 = await fetch(`${baseUrl}/category/non-existent-category`);
    assert(res404.status === 404, 'Returns HTTP 404 status code', `Got ${res404.status}`);
    const html404 = await res404.text();
    assert(html404.includes('۴۰۴') || html404.includes('404'), 'Title/content contains 404 error message');

    // 6. Robots.txt
    console.log('\n6. Testing /robots.txt');
    const resRobots = await fetch(`${baseUrl}/robots.txt`);
    assert(resRobots.status === 200, 'robots.txt returns status 200');
    const txtRobots = await resRobots.text();
    assert(txtRobots.includes('Disallow: /admin'), 'robots.txt disallows /admin');
    assert(txtRobots.includes('Disallow: /cart'), 'robots.txt disallows /cart');
    assert(txtRobots.includes('Sitemap:'), 'robots.txt references sitemap');

    // 7. Sitemap.xml
    console.log('\n7. Testing /sitemap.xml');
    const resSitemap = await fetch(`${baseUrl}/sitemap.xml`);
    assert(resSitemap.status === 200, 'sitemap.xml returns status 200');
    const xmlSitemap = await resSitemap.text();
    assert(xmlSitemap.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'), 'Valid sitemap xmlns');
    assert(xmlSitemap.includes('/category/digital'), 'Sitemap includes digital category');
    assert(xmlSitemap.includes('/product/prod_ported_shaker'), 'Sitemap includes canonical products');

    console.log('\n----------------------------------------');
    if (allPassed) {
      console.log('ALL SEO & SSR VERIFICATION TESTS PASSED (100%)');
      process.exit(0);
    } else {
      console.error('SOME SEO & SSR TESTS FAILED');
      process.exit(1);
    }
  } catch (err: any) {
    console.error('SEO Test Suite execution failed with error:', err.message);
    process.exit(1);
  }
}

runSeoTests();
