// Sourced directly from Document 1: Procurement & Supplier Directory Table
// بانک اطلاعاتی تأمین‌کنندگان معتبر و ماتریس کالاهای بازرگانی

export interface SourcedSupplierOffer {
  row: number;
  productName: string;
  productCategory: string;
  supplierName: string;
  phone: string;
  website?: string;
}

export interface PortedProductItem {
  id: string;
  title: string;
  titleEn: string;
  sku: string;
  category: string;
  subCategory: string;
  brand: string;
  brandFa: string;
  retailPrice: number;
  originalPrice?: number;
  discountPercent?: number;
  winnerScore: number;
  marginPercent: number;
  riskScore: number;
  image: string;
  description: string;
  rating: number;
  ratingCount: number;
  suppliers: Array<{
    name: string;
    phone: string;
    website?: string;
  }>;
}

export const SOURCED_SUPPLIERS_DATA: SourcedSupplierOffer[] = [
  // مینی شیکر شارژی
  { row: 1, productName: 'مینی شیکر شارژی', productCategory: 'لوازم خانگی هوشمند', supplierName: 'هوم شاپ حیدری', phone: '09198592502' },
  { row: 2, productName: 'مینی شیکر شارژی', productCategory: 'لوازم خانگی هوشمند', supplierName: 'ارزون گردی', phone: '09044462903', website: 'https://arzungardi.com' },
  { row: 3, productName: 'مینی شیکر شارژی', productCategory: 'لوازم خانگی هوشمند', supplierName: 'گجت بوم', phone: '09139527110', website: 'https://Gadgetboom.ir' },
  { row: 4, productName: 'مینی شیکر شارژی', productCategory: 'لوازم خانگی هوشمند', supplierName: 'جاینا 724', phone: '09389161600', website: 'https://donyaedigitall.ir' },
  { row: 5, productName: 'مینی شیکر شارژی', productCategory: 'لوازم خانگی هوشمند', supplierName: 'لازو', phone: '09378000244' },
  { row: 6, productName: 'مینی شیکر شارژی', productCategory: 'لوازم خانگی هوشمند', supplierName: 'دنیای دیجیتال', phone: '09301304646', website: 'https://donyaedigitall.ir' },
  { row: 7, productName: 'مینی شیکر شارژی', productCategory: 'لوازم خانگی هوشمند', supplierName: 'مارتین موبایل', phone: '09923221191', website: 'https://martinmobaile.ir' },
  { row: 8, productName: 'مینی شیکر شارژی', productCategory: 'لوازم خانگی هوشمند', supplierName: 'مهریانا', phone: '09134919236', website: 'https://mehrianashop.ir' },
  { row: 9, productName: 'مینی شیکر شارژی', productCategory: 'لوازم خانگی هوشمند', supplierName: 'شاپینوشاپ', phone: '09303073730', website: 'https://shopynoo.ir' },
  { row: 10, productName: 'مینی شیکر شارژی', productCategory: 'لوازم خانگی هوشمند', supplierName: 'ذاکر گجت', phone: '09382461841', website: 'https://zakergadget.ir/' },

  // ویدئو پروژکتور پرتابل
  { row: 1, productName: 'ویدئو پروژکتور پرتابل', productCategory: 'کالای دیجیتال', supplierName: 'شاینی شاپ', phone: '09173656637', website: 'https://shinyshope.ir/' },
  { row: 2, productName: 'ویدئو پروژکتور پرتابل', productCategory: 'کالای دیجیتال', supplierName: 'دراگونا', phone: '09179150876', website: 'https://dragona.ir' },
  { row: 3, productName: 'ویدئو پروژکتور پرتابل', productCategory: 'کالای دیجیتال', supplierName: 'ترندیا', phone: '09397496121', website: 'https://Trendiya.ir' },
  { row: 4, productName: 'ویدئو پروژکتور پرتابل', productCategory: 'کالای دیجیتال', supplierName: 'بوف سان', phone: '09128892055', website: 'https://buffsun.com/' },
  { row: 5, productName: 'ویدئو پروژکتور پرتابل', productCategory: 'کالای دیجیتال', supplierName: 'گجت لند امیر', phone: '09935760772', website: 'https://amirgadget.ir/' },
  { row: 6, productName: 'ویدئو پروژکتور پرتابل', productCategory: 'کالای دیجیتال', supplierName: 'موجی تک', phone: '09931639549', website: 'https://mojiitech.ir/' },
  { row: 7, productName: 'ویدئو پروژکتور پرتابل', productCategory: 'کالای دیجیتال', supplierName: 'ذاکر گجت', phone: '09382461841', website: 'https://zakergadget.ir/' },
  { row: 8, productName: 'ویدئو پروژکتور پرتابل', productCategory: 'کالای دیجیتال', supplierName: 'گری کالا', phone: '09308182869', website: 'https://greykala.com/' },
  { row: 9, productName: 'ویدئو پروژکتور پرتابل', productCategory: 'کالای دیجیتال', supplierName: 'تکوجت', phone: '09935468272' },

  // دوربین اکشن ورزشی
  { row: 1, productName: 'دوربین اکشن ورزشی', productCategory: 'کالای دیجیتال', supplierName: 'موجی تک', phone: '09931639549', website: 'https://mojiitech.ir' },
  { row: 2, productName: 'دوربین اکشن ورزشی', productCategory: 'کالای دیجیتال', supplierName: 'آداکس گجت', phone: '09121016566' },
  { row: 3, productName: 'دوربین اکشن ورزشی', productCategory: 'کالای دیجیتال', supplierName: 'دارما مارکت', phone: '09367573438' },

  // ماساژور برقی سر
  { row: 1, productName: 'ماساژور برقی سر', productCategory: 'زیبایی و سلامت', supplierName: 'تکنو وان', phone: '09058559883', website: 'https://technoonee.ir/' },
  { row: 2, productName: 'ماساژور برقی سر', productCategory: 'زیبایی و سلامت', supplierName: 'دی گجت', phone: '09901165597', website: 'https://dubaigajet.ir/' },
  { row: 3, productName: 'ماساژور برقی سر', productCategory: 'زیبایی و سلامت', supplierName: 'زد اج استور', phone: '09924796698', website: 'https://zh-store.ir/' },
  { row: 4, productName: 'ماساژور برقی سر', productCategory: 'زیبایی و سلامت', supplierName: 'مارکتینو', phone: '09901134110', website: 'https://marketinow.com' },
  { row: 5, productName: 'ماساژور برقی سر', productCategory: 'زیبایی و سلامت', supplierName: 'دکتر گالری (ماه چوب 10)', phone: '09126101047', website: 'https://drgallery.ir/' },

  // ماساژور با EMS
  { row: 1, productName: 'ماساژور با EMS', productCategory: 'زیبایی و سلامت', supplierName: 'یوتا کالا', phone: '09999217674' },
  { row: 2, productName: 'ماساژور با EMS', productCategory: 'زیبایی و سلامت', supplierName: 'دکتر گالری', phone: '09126101047', website: 'https://drgallery.ir/' },

  // جارو رباتیک
  { row: 1, productName: 'جارو رباتیک هوشمند', productCategory: 'لوازم خانگی هوشمند', supplierName: 'می روبوت', phone: '09122385215', website: 'https://mi-robot.ir/' },
  { row: 2, productName: 'جارو رباتیک هوشمند', productCategory: 'لوازم خانگی هوشمند', supplierName: 'حامی تل', phone: '02166760460', website: 'https://hamitell.com/' },
  { row: 3, productName: 'جارو رباتیک هوشمند', productCategory: 'لوازم خانگی هوشمند', supplierName: 'موبوسود پلاس', phone: '02166340721', website: 'https://mobosoodplus.com/' },

  // جاروعصایی
  { row: 1, productName: 'جاروعصایی شارژی', productCategory: 'لوازم خانگی هوشمند', supplierName: 'بهزادی شاپ', phone: '09386008638', website: 'https://behzadishop.com' },
  { row: 2, productName: 'جاروعصایی شارژی', productCategory: 'لوازم خانگی هوشمند', supplierName: 'گالری اکبری', phone: '09387672036', website: 'https://galleryy-akbaari.ir' },

  // آینه نشکن
  { row: 1, productName: 'آینه نشکن دکوراتیو', productCategory: 'لوازم خانگی هوشمند', supplierName: 'هرمس مارکت', phone: '09220662165' },
  { row: 2, productName: 'آینه نشکن دکوراتیو', productCategory: 'لوازم خانگی هوشمند', supplierName: 'علی آوا', phone: '09222957903', website: 'https://aliava.ir' },

  // چراغ خواب سیلیکونی
  { row: 1, productName: 'چراغ خواب سیلیکونی', productCategory: 'لوازم خانگی هوشمند', supplierName: 'کیت هوم', phone: '09190969528' },
  { row: 2, productName: 'چراغ خواب سیلیکونی', productCategory: 'لوازم خانگی هوشمند', supplierName: 'فسقلی دات آی آر', phone: '09122904317' },

  // گردنبند ست آمیتیست
  { row: 1, productName: 'گردنبند ست آمیتیست', productCategory: 'مد و پوشاک', supplierName: 'گالری آمونیت', phone: '09335205984' },

  // آینه پلکسی
  { row: 1, productName: 'آینه پلکسی مدرن', productCategory: 'لوازم خانگی هوشمند', supplierName: 'آماتیس دکور', phone: '09305189744', website: 'https://amatisdecor.ir/' },
  { row: 2, productName: 'آینه پلکسی مدرن', productCategory: 'لوازم خانگی هوشمند', supplierName: 'مبلمون سرا', phone: '09124780957' },

  // دستگاه جوانساز پوست
  { row: 1, productName: 'دستگاه جوانساز پوست', productCategory: 'زیبایی و سلامت', supplierName: 'دالی شاپ', phone: '09121963117', website: 'https://daali.ir' },

  // میکرودرم
  { row: 1, productName: 'دستگاه میکرودرم پاکسازی', productCategory: 'زیبایی و سلامت', supplierName: 'بازار همراه', phone: '02155002741', website: 'https://bazar-hamrah.ir/' },
  { row: 2, productName: 'دستگاه میکرودرم پاکسازی', productCategory: 'زیبایی و سلامت', supplierName: 'ارزان بابا احمد', phone: '09396179505', website: 'https://arzanibabaahmad.com' },
  { row: 3, productName: 'دستگاه میکرودرم پاکسازی', productCategory: 'زیبایی و سلامت', supplierName: 'گلوی گلوی کالا', phone: '09393493894', website: 'https://golehgolehkala.ir' },
  { row: 4, productName: 'دستگاه میکرودرم پاکسازی', productCategory: 'زیبایی و سلامت', supplierName: 'لوازم خانگی رادمهر', phone: '09388692009', website: 'https://radmehrhom.ir' },
  { row: 5, productName: 'دستگاه میکرودرم پاکسازی', productCategory: 'زیبایی و سلامت', supplierName: 'پیندو', phone: '021-61930200', website: 'https://www.pindo.ir' },
  { row: 6, productName: 'دستگاه میکرودرم پاکسازی', productCategory: 'زیبایی و سلامت', supplierName: 'کیان گیفت', phone: '09051826083', website: 'https://www.kiyangift.com/' },

  // میکرودرم واصف و بیوتی آندیا
  { row: 1, productName: 'میکرودرم مکنده جوش سرسیاه', productCategory: 'زیبایی و سلامت', supplierName: 'دالی شاپ', phone: '09121963117', website: 'https://daali.ir' },
  { row: 2, productName: 'میکرودرم مکنده جوش سرسیاه', productCategory: 'زیبایی و سلامت', supplierName: 'واصف', phone: '0911449515' },
  { row: 3, productName: 'میکرودرم مکنده جوش سرسیاه', productCategory: 'زیبایی و سلامت', supplierName: 'بیوتی آندیا', phone: '09175923238' },
  { row: 4, productName: 'میکرودرم مکنده جوش سرسیاه', productCategory: 'زیبایی و سلامت', supplierName: 'دکتر گالری', phone: '09126101047', website: 'https://drgallery.ir/' },
  { row: 5, productName: 'میکرودرم مکنده جوش سرسیاه', productCategory: 'زیبایی و سلامت', supplierName: 'گجت یار', phone: '0913-7298373', website: 'https://gadgetiar.ir' },

  // شیشه پاک کن مغناطیسی
  { row: 1, productName: 'شیشه پاک کن مغناطیسی', productCategory: 'لوازم خانگی هوشمند', supplierName: 'مارتین موبایل', phone: '09923221191', website: 'https://mehrianashop.ir/' },
  { row: 2, productName: 'شیشه پاک کن مغناطیسی', productCategory: 'لوازم خانگی هوشمند', supplierName: 'استور مگاهرتز', phone: '02186097038', website: 'https://storemhz.ir/shop/' },
  { row: 3, productName: 'شیشه پاک کن مغناطیسی', productCategory: 'لوازم خانگی هوشمند', supplierName: 'همانند پلاس', phone: '09123461237' },

  // موزن بینی و ابرو
  { row: 1, productName: 'موزن بینی و ابرو', productCategory: 'زیبایی و سلامت', supplierName: 'بازار اژدها', phone: '09363955379', website: 'https://dragon-market.ir/' },
  { row: 2, productName: 'موزن بینی و ابرو', productCategory: 'زیبایی و سلامت', supplierName: 'فیلیپس بازار', phone: '09179824818', website: 'https://philipsbazar.ir' },
  { row: 3, productName: 'موزن بینی و ابرو', productCategory: 'زیبایی و سلامت', supplierName: 'مارکتینو', phone: '09901134110', website: 'https://marketinow.com' },

  // شاتر عکاسی بلوتوثی تسلس
  { row: 1, productName: 'شاتر عکاسی بلوتوثی تسلس', productCategory: 'کالای دیجیتال', supplierName: 'دبی تجارت', phone: '09170777618', website: 'https://dubaitejarat.com' },
  { row: 2, productName: 'شاتر عکاسی بلوتوثی تسلس', productCategory: 'کالای دیجیتال', supplierName: 'تکنوتاج', phone: '09134393786' },
  { row: 3, productName: 'شاتر عکاسی بلوتوثی تسلس', productCategory: 'کالای دیجیتال', supplierName: 'کیان سما', phone: '09134393786', website: 'https://kiansama.com/' },

  // مینی پرینتر حرارتی
  { row: 1, productName: 'مینی پرینتر حرارتی', productCategory: 'کالای دیجیتال', supplierName: 'گریش دی شاپ', phone: '09221890543', website: 'https://mslime.ir' },
  { row: 2, productName: 'مینی پرینتر حرارتی', productCategory: 'کالای دیجیتال', supplierName: 'ام اسلایم استور', phone: '09330683330', website: 'https://donyaedigitall.ir/' },
  { row: 3, productName: 'مینی پرینتر حرارتی', productCategory: 'کالای دیجیتال', supplierName: 'دنیای دیجیتال', phone: '09301304646' },

  // اسپیکر بلوتوثی جی لامپ
  { row: 1, productName: 'اسپیکر بلوتوثی جی لامپ (G-Lamp)', productCategory: 'کالای دیجیتال', supplierName: 'کارتریج کالا', phone: '09366263372', website: 'https://www.cartridgekala.ir/' },

  // چراغ خواب فضانوردی
  { row: 1, productName: 'چراغ خواب پروژکتور فضانورد', productCategory: 'لوازم خانگی هوشمند', supplierName: 'ترندیا', phone: '09397496121', website: 'https://www.trendiya.ir' },
  { row: 2, productName: 'چراغ خواب پروژکتور فضانورد', productCategory: 'لوازم خانگی هوشمند', supplierName: 'گجت لند امیر', phone: '09935760772', website: 'https://amirgadget.ir/' },
  { row: 3, productName: 'چراغ خواب پروژکتور فضانورد', productCategory: 'لوازم خانگی هوشمند', supplierName: 'ذاکر گجت', phone: '09382461841', website: 'https://zakergadget.ir/' },

  // چراغ خواب سیلیکونی پاندا
  { row: 1, productName: 'چراغ خواب سیلیکونی پاندا', productCategory: 'لوازم خانگی هوشمند', supplierName: 'دکو تیکو', phone: '09303528067', website: 'https://decotico.ir' },

  // چراغ خواب اسکای لایت
  { row: 1, productName: 'چراغ خواب اسکای لایت کهکشانی', productCategory: 'لوازم خانگی هوشمند', supplierName: 'مبلمان نارنجی', phone: '09124780957', website: 'https://narenjico.ir/' },
  { row: 2, productName: 'چراغ خواب اسکای لایت کهکشانی', productCategory: 'لوازم خانگی هوشمند', supplierName: 'ترندیا', phone: '09397496121', website: 'https://www.trendiya.ir/' },
  { row: 3, productName: 'چراغ خواب اسکای لایت کهکشانی', productCategory: 'لوازم خانگی هوشمند', supplierName: 'شیردال', phone: '09005844727', website: 'https://sheirdal.com/' },

  // پرزگیر لباس
  { row: 1, productName: 'پرزگیر شارژی لباس و پارچه', productCategory: 'لوازم خانگی هوشمند', supplierName: 'میا کالا', phone: '0913-6000-552', website: 'https://miyakala.com' },
  { row: 2, productName: 'پرزگیر شارژی لباس و پارچه', productCategory: 'لوازم خانگی هوشمند', supplierName: 'جاست شیائومی', phone: '09120504881', website: 'https://justxiaomi.com/' },

  // اتو صورت
  { row: 1, productName: 'اتو صورت التراسونیک درما اف', productCategory: 'زیبایی و سلامت', supplierName: 'پریا بیوتی کالکشن', phone: '09938062573', website: 'https://paryabeautycollection.ir' },

  // دستگاه جوانساز صورت ESM
  { row: 1, productName: 'دستگاه جوانساز صورت ESM', productCategory: 'زیبایی و سلامت', supplierName: 'چی گجت', phone: '09221758356', website: 'https://chigadget.ir/' },
  { row: 2, productName: 'دستگاه جوانساز صورت ESM', productCategory: 'زیبایی و سلامت', supplierName: 'رایان مدیکا', phone: '09393636885', website: 'https://rayanmedica.com/' },

  // ادویه ساب GRINDER
  { row: 1, productName: 'ادویه ساب برقی اتوماتیک Grinder', productCategory: 'لوازم خانگی هوشمند', supplierName: 'می روبوت', phone: '02152380912', website: 'https://mi-robot.ir/' },
  { row: 2, productName: 'ادویه ساب برقی اتوماتیک Grinder', productCategory: 'لوازم خانگی هوشمند', supplierName: 'بایت استور', phone: '09211853417', website: 'https://bytestore.ir/' },

  // هولدر گویی
  { row: 1, productName: 'هولدر مغناطیسی گویی خودرو', productCategory: 'کالای دیجیتال', supplierName: 'ژاک مارکت', phone: '09180180096', website: 'https://zhakmarket.com/' },
  { row: 2, productName: 'هولدر مغناطیسی گویی خودرو', productCategory: 'کالای دیجیتال', supplierName: 'بازار اژدها', phone: '09363955379', website: 'https://dragon-market.ir/' },
  { row: 3, productName: 'هولدر مغناطیسی گویی خودرو', productCategory: 'کالای دیجیتال', supplierName: 'باریو', phone: '09184427092', website: 'https://baryo.ir' },
  { row: 4, productName: 'هولدر مغناطیسی گویی خودرو', productCategory: 'کالای دیجیتال', supplierName: 'بلوکالا', phone: '02182805177', website: 'https://blukalaa.com' },
  { row: 5, productName: 'هولدر مغناطیسی گویی خودرو', productCategory: 'کالای دیجیتال', supplierName: 'تلکس وان', phone: '09179693185', website: 'https://www.tellx1.com/' },
  { row: 6, productName: 'هولدر مغناطیسی گویی خودرو', productCategory: 'کالای دیجیتال', supplierName: 'آریاکالام', phone: '09172981073', website: 'https://www.ariyakalam.ir/' },
  { row: 7, productName: 'هولدر مغناطیسی گویی خودرو', productCategory: 'کالای دیجیتال', supplierName: 'بایت استور', phone: '09211853417', website: 'https://bytestore.ir' },

  // دستگاه بخور سرد شیائومی
  { row: 1, productName: 'دستگاه بخور سرد اولتراسونیک شیائومی', productCategory: 'لوازم خانگی هوشمند', supplierName: 'فونوتل', phone: '09177990355', website: 'https://fonootell.com' },
  { row: 2, productName: 'دستگاه بخور سرد اولتراسونیک شیائومی', productCategory: 'لوازم خانگی هوشمند', supplierName: 'موبوسود', phone: '02166340720', website: 'https://mobosood.com' },
  { row: 3, productName: 'دستگاه بخور سرد اولتراسونیک شیائومی', productCategory: 'لوازم خانگی هوشمند', supplierName: 'بایت استور', phone: '09211853417', website: 'https://bytestore.ir/' },

  // مینی پرسو
  { row: 1, productName: 'قهوه‌ساز پرتابل همراه مینی‌پرسو', productCategory: 'سفر و کمپینگ', supplierName: 'مان اسپرسو', phone: '09130759864', website: 'https://monespresso.ir' },
  { row: 2, productName: 'قهوه‌ساز پرتابل همراه مینی‌پرسو', productCategory: 'سفر و کمپینگ', supplierName: 'بلوکالا', phone: '02182805177', website: 'https://blukalaa.com/' },

  // تشک بادی سفری کد 1001
  { row: 1, productName: 'تشک بادی سفری و کمپینگ خودرو کد 1001', productCategory: 'سفر و کمپینگ', supplierName: 'خانه چادر 2', phone: '09305944546', website: 'https://khanechador2.ir/' },
  { row: 2, productName: 'تشک بادی سفری و کمپینگ خودرو کد 1001', productCategory: 'سفر و کمپینگ', supplierName: 'گجت یار', phone: '0913-7298373', website: 'https://gadgetiar.ir/' },
  { row: 3, productName: 'تشک بادی سفری و کمپینگ خودرو کد 1001', productCategory: 'سفر و کمپینگ', supplierName: 'کوله راه', phone: '09395684494', website: 'https://kulerah.ir/' },

  // دوش سفری
  { row: 1, productName: 'دوش سفری پرتابل کمپینگ ۱۲ ولت', productCategory: 'سفر و کمپینگ', supplierName: 'زد اج استور', phone: '09924796698', website: 'https://zh-store.ir/' },

  // بخاری سفری
  { row: 1, productName: 'بخاری سفری و مسافرتی کپسولی', productCategory: 'سفر و کمپینگ', supplierName: 'گجت یار', phone: '0913-7298373', website: 'https://gadgetiar.ir/' },
  { row: 2, productName: 'بخاری سفری و مسافرتی کپسولی', productCategory: 'سفر و کمپینگ', supplierName: 'شیراز اسپرت آی ار', phone: '09364774650', website: 'https://shirazsportss.ir/' },

  // آباژور رومیزی
  { row: 1, productName: 'آباژور رومیزی لمسی کریستالی RGB', productCategory: 'لوازم خانگی هوشمند', supplierName: 'شاینی شاپ', phone: '09173656637', website: 'https://shinyshope.ir/' },

  // دسته بازی تسکو مدل TG 140W
  { row: 1, productName: 'دسته بازی بی‌سیم تسکو مدل TG 140W', productCategory: 'کالای دیجیتال', supplierName: 'خوب تک', phone: '01732334141', website: 'https://khoobtek.ir/' },
  { row: 2, productName: 'دسته بازی بی‌سیم تسکو مدل TG 140W', productCategory: 'کالای دیجیتال', supplierName: 'ویمارینو', phone: '09127947980', website: 'https://wemarino.ir/' },
  { row: 3, productName: 'دسته بازی بی‌سیم تسکو مدل TG 140W', productCategory: 'کالای دیجیتال', supplierName: 'تکنو وان', phone: '09058559883', website: 'https://technoonee.ir/' }
];
