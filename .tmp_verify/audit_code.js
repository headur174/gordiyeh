async (page) => {
  const report = { mobile: {}, admin: {} };

  // 1. Mobile 390x844 check
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  report.mobile = await page.evaluate(() => {
    const supportBtn = document.querySelector('button[aria-label="پشتیبانی گُردیه"]');
    const supportRect = supportBtn ? supportBtn.getBoundingClientRect() : null;
    const bottomBar = document.querySelector('div.fixed.bottom-0');
    const bottomBarRect = bottomBar ? bottomBar.getBoundingClientRect() : null;
    return {
      supportBottom: supportRect ? Math.round(supportRect.bottom) : -1,
      bottomBarTop: bottomBarRect ? Math.round(bottomBarRect.top) : -1,
      noOverlap: supportRect && bottomBarRect ? supportRect.bottom <= bottomBarRect.top : false,
      overflowPx: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
    };
  });
  await page.screenshot({ path: `.tmp_verify/shots/03-mobile-hero-fixed.png`, fullPage: false, animations: 'disabled' });

  // 2. Desktop Admin via secret query param
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/admin?secret=gordiyeh-supervisor-secure', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // Open تنظیم اسلایدرها drawer
  const drawerBtn = page.locator('button:has-text("تنظیم اسلایدرها")').first();
  report.admin.hasDrawerBtn = (await drawerBtn.count()) > 0;
  if (await drawerBtn.count()) {
    await drawerBtn.click();
    await page.waitForTimeout(450);
    await page.screenshot({ path: `.tmp_verify/shots/04-site-visual-editor.png`, fullPage: false, animations: 'disabled' });
    const closeBtn = page.locator('div.fixed.inset-y-0.right-0 button').first();
    if (await closeBtn.count()) await closeBtn.click();
    await page.waitForTimeout(300);
  }

  // Open #tab-cms -> مدیریت اسلایدرها و ویترین
  const cmsTab = page.locator('#tab-cms').first();
  report.admin.hasCmsTab = (await cmsTab.count()) > 0;
  if (await cmsTab.count()) {
    await cmsTab.click();
    await page.waitForTimeout(700);
    const sliderStudioBtn = page.locator('button:has-text("مدیریت اسلایدرها و ویترین")').first();
    report.admin.hasSliderStudioBtn = (await sliderStudioBtn.count()) > 0;
    if (await sliderStudioBtn.count()) {
      await sliderStudioBtn.click();
      await page.waitForTimeout(450);
      await page.screenshot({ path: `.tmp_verify/shots/05-admin-cms-sliders.png`, fullPage: false, animations: 'disabled' });

      // Toggle پرفروش‌ترین‌ها off & switch to manual deduplication, then save
      const bestsellerToggle = page.locator('label:has-text("پرفروش‌ترین‌ها")').first();
      if (await bestsellerToggle.count()) await bestsellerToggle.click();
      const manualBtn = page.locator('button:has-text("مدیریت دستی هر اسلایدر")').first();
      if (await manualBtn.count()) await manualBtn.click();
      await page.waitForTimeout(250);
      const saveBtn = page.locator('button:has-text("ذخیره تنظیمات")').first();
      if (await saveBtn.count()) await saveBtn.click();
      await page.waitForTimeout(400);
    }
  }

  // Check storefront live sync
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  report.admin.sync = await page.evaluate(() => {
    const raw = localStorage.getItem('commerce_os_site_config');
    const parsed = raw ? JSON.parse(raw) : null;
    const h2Texts = Array.from(document.querySelectorAll('h2')).map((h) => h.textContent.trim());
    return {
      storedMode: parsed && parsed.homepageSliders ? parsed.homepageSliders.deduplicateMode : null,
      storedShowBestsellers: parsed && parsed.homepageSliders ? parsed.homepageSliders.showBestsellers : null,
      hasBestsellerHeading: h2Texts.some((t) => t.includes('پرفروش‌ترین‌ها')),
      sliderHeadings: h2Texts.filter((t) => t.includes('تخفیف') || t.includes('تازه‌ترین') || t.includes('پرفروش')),
    };
  });

  // Restore clean default config
  await page.evaluate(() => localStorage.removeItem('commerce_os_site_config'));
  return JSON.stringify(report, null, 2);
}
