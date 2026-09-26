# اصلاح نمایش تمام‌صفحهٔ CogniCode

علت مشخص در سورس: `info.path` در XcodeGen فایل Info.plist را تولید و بازنویسی می‌کرد؛ تنظیمات لانچ دستی در `info.properties` تعریف نشده بودند. اکنون `INFOPLIST_FILE` مستقیماً به فایل موجود اشاره می‌کند. نسبت تصویر native ارسالی نیز با پنجرهٔ سازگاری ۳۲۰×۴۸۰ مطابقت دارد؛ اثبات نهایی روی گوشی نیازمند نصب خروجی جدید است.

اصلاحات همراه:
- ارتفاع صفحه با باز و بسته شدن کیبورد تغییر می‌کند؛ ارتفاع ثابت متناقض حذف شد.
- transform روی ریشهٔ صفحه حذف شد تا پنل‌های fixed به viewport متصل بمانند.
- تزریق تکراری viewport پیش از آماده‌شدن document.head حذف شد؛ متادیتای index.html مرجع است.
- هم‌پوشانی کیبورد در مختصات خود WebView محاسبه می‌شود.
- CI تغییر ناخواستهٔ plist بعد از XcodeGen و نقص منابع در app کامپایل‌شده را بررسی می‌کند.

بررسی انجام‌شده در ویندوز: اعتبار plist، نحو app.js و هندسهٔ صفحه/کیبورد در مرورگر Chromium برای 375×812، 393×852، 430×932 و 440×956 موفق بودند. این آزمون‌ها جای اجرای WKWebView و بررسی safe area روی iOS را نمی‌گیرند. Xcode و شبیه‌ساز در این محیط در دسترس نبودند؛ IPA ساخته نشده است.

## بازبینی دوم با SwiftUI Expert

تنظیمات `INFOPLIST_FILE`، منبع لانچ، اندازه‌گیری WebView توسط SwiftUI و مالکیت فاصله‌های امن/کیبورد بررسی شدند. ریشه عمداً safe area کیبورد را نادیده می‌گیرد، زیرا محتوای وب آن را مدیریت می‌کند؛ کوچک‌کردن هم‌زمان قاب SwiftUI و صفحهٔ وب باعث کاهش دوبرابری فضا می‌شود.

دو ایراد دیگر اصلاح شدند:
- نام مدل‌های ناشناخته دارای علامت نقل‌قول (مانند `6.9"`) در JavaScript تزریقی خطای نحوی ایجاد می‌کرد. داده‌ها اکنون با JSONSerialization منتقل می‌شوند و نسخهٔ سیستم‌عامل واقعی گزارش می‌شود.
- پیام‌گیرهای WebKit هنگام dismantle حذف می‌شوند تا چرخهٔ نگهداری Coordinator/WebView شکسته شود. رصدگر کیبورد نیز به همان Coordinator تعلق دارد و همراه آن پاک‌سازی می‌شود.

آزمون اسکریپت دستگاه: شش حالت شامل نام‌های نقل‌قول‌دار و تزریق قبل/بعد از آماده‌شدن DOM موفق بود. آزمون هندسهٔ وب به صفحهٔ کوتاه 375×667 و حالت بدون کلاس‌های native هم گسترش یافت. این آزمون اخیر هنوز callback کیبورد native را شبیه‌سازی می‌کند، نه رفتار واقعی Safari.

دکمه‌های برنامه HTML هستند و از قبل جلوهٔ شیشه‌ای CSS دارند. افزودن دکمهٔ موازی SwiftUI ضروری تشخیص داده نشد؛ Liquid Glass بومی اضافه نشده است. استفاده از WKWebView برای پشتیبانی iOS 18 و پل‌های موجود حفظ شد.

وضعیت نهایی: اصلاح علت محتمل letterboxing در سورس تأیید شد؛ ساخت Xcode، اجرای WKWebView، safe area واقعی، تغییر تم و پاک‌سازی حافظه روی دستگاه هنوز آزموده نشده‌اند. خروجی IPA در این محیط تولید نشده است.

## اجرای گردش کار ساخت

فایل‌های اصلاح‌شده را در مخزن GitHub خود قرار دهید. در Actions، گردش کار `Build CogniCode IPA` را با `Run workflow` اجرا کنید. پس از موفقیت، artifact به نام `CogniCode-ipa` حاوی `CogniCode-unsigned.ipa` است. این خروجی بدون امضاست و برای نصب به روش امضای مورد استفادهٔ شما نیاز دارد. برای خروجی امضاشده، گواهی و provisioning profile مناسب لازم است.

## بررسی روی آیفون

پس از نصب خروجی جدید، تمام‌صفحه‌بودن، فاصله از ناچ و نشانگر خانه، دسترسی به نوار ابزار هنگام بازشدن کیبورد و بازگشت ارتفاع پس از بستن آن را بررسی کنید. همچنین تنظیمات، تغییر تم و انتخاب تصویر را امتحان کنید. با سه بار لمس برند، ابعاد viewport در ابزار تشخیص موجود نمایش داده می‌شود؛ در آیفون‌های جدید نباید ۳۲۰×۴۸۰ باشد.

اگر نمایش قدیمی باقی ماند، ابتدا مطمئن شوید IPA جدید را نصب کرده‌اید. پیش از هر حذف و نصب مجدد، از داده‌ها و تنظیمات محلی برنامه پشتیبان بگیرید.

## تغییر رفتار کیبورد — ۲۰۲۶/۰۹/۲۵

طبق درخواست جدید، کیبورد باید روی صفحه ظاهر شود و چیدمان اصلی ثابت بماند. این تصمیم جایگزین رفتار کاهش ارتفاع صفحه در توضیحات قبلی است. وابستگی bottom صفحه به ارتفاع کیبورد، انیمیشن آن، مخفی‌کردن نوار اجرا و تغییر فاصلهٔ نوار پایین حذف شدند. callback کیبورد فقط وضعیت بازبودن را برای بستن با سوایپ نگه می‌دارد. فایل‌های وب با native/Web همگام شدند.

آزمون هندسه اکنون ثابت‌ماندن قاب صفحه، ادیتور و نوار پایین را در چرخه‌های بازشدن، تغییر ارتفاع و بسته‌شدن کیبورد بررسی می‌کند. این آزمون callback را در مرورگر شبیه‌سازی می‌کند؛ اسکرول خودکار WKWebView هنگام فوکوس و رفتار واقعی کیبورد باید روی آیفون بررسی شوند. در این محیط ویندوز IPA ساخته نشده است.

## GradientWave and analysis activity (2026-09-26)

The supplied React component's MiniGl/simplex-noise engine is adapted in
`gradient-wave.js`. This project is plain JavaScript (including WKWebView), so
React, shadcn and Tailwind are not runtime dependencies. `sonar.js` manages
its theme, visibility, reduced-motion and WebGL context lifecycle. Four
palette entries avoid the original vec4 overflow; the mesh covers the whole
viewport. The backing buffer uses CSS-pixel resolution and bounded mesh
segments to limit GPU cost on high-DPR iPhones. requestAnimationFrame follows
the browser's available cadence, without a hard 60 fps cap or frame-based speed.
Actual 120 Hz delivery remains controlled by WebKit/iOS, power and thermal state.

Native Live Activities now have an embedded WidgetKit extension, a shared
attributes type, and the actual app logo. Compact leading shows the logo and
trailing shows the waveform while analysis runs; completion/error use distinct
symbols. Stale activities ask the user to reopen the app. Activities from the
previous session are ended on the next analysis after relaunch.

PWA has no ActivityKit API. Its accessible in-app status capsule provides the
logo and animated bars (static with Reduce Motion). The native app also retains
this in-app feedback when Live Activities are disabled or not visible. Apple's
Live Activity animation limits do not permit promising a continuously running
Now Playing equalizer; the native waveform is a status symbol with a transition
when state changes, not an audio playback session.

Validation on Windows: Node syntax checks, device-script tests (6 cases),
check-layout.cjs (6 viewport configurations), check-gradient.cjs for web and
native bundles (WebGL, themes, reduced motion, start/completion/dismissal,
context loss/recovery). Screenshots: wave-light.png and wave-dark.png.
Run tools/sync-native.ps1 before building. The IPA verifier now requires the
embedded extension and its assets. The unsigned CI IPA must be signed together
with its extension before installation. Xcode compilation, physical Dynamic
Island presentation and ProMotion frame pacing still require a Mac/iPhone.
