# როგორ შევამოწმოთ Open Graph Tags

## 1. Browser DevTools
1. გახსენი პრაქტიკის გვერდი (მაგ: https://www.legal.ge/ka/practices/some-practice)
2. Right Click → "View Page Source"
3. CTRL+F → მოძებნე `og:image`
4. შეამოწმე:
   ```html
   <meta property="og:image" content="https://FULL_URL_HERE/image.jpg" />
   <meta property="og:url" content="https://www.legal.ge/ka/practices/slug" />
   <meta property="og:title" content="Practice Title" />
   <meta property="og:description" content="Description here" />
   ```

## 2. Facebook Sharing Debugger
🔗 https://developers.facebook.com/tools/debug/

1. ჩასვი შენი გვერდის URL
2. დააჭირე "Debug"
3. ნახე რა ინფორმაცია მოდის
4. თუ არაფერი ან ძველი - დააჭირე "Scrape Again"

## 3. LinkedIn Post Inspector
🔗 https://www.linkedin.com/post-inspector/

LinkedIn-ისთვის იგივე

## 4. Twitter Card Validator
🔗 https://cards-dev.twitter.com/validator

Twitter-ისთვის

---

## ✅ რა უნდა ჩანდეს:

**სურათი:** აბსოლუტური URL (https://...)
**Title:** პრაქტიკის სათაური
**Description:** პრაქტიკის აღწერა
**URL:** https://www.legal.ge/ka/practices/slug

---

## ⚠️ პრობლემები:

### თუ სურათი არ ჩანს:
1. შეამოწმე `og_image_url` database-ში აბსოლუტურია თუ არა
2. შეამოწმე სურათი ხელმისაწვდომია თუ არა (გახსენი URL ცალკე ტაბში)
3. Facebook Cache გაწმინდე (Scrape Again)

### თუ title/description არ ჩანს:
1. შეამოწმე `og_title`, `og_description` database-ში არსებობს თუ არა
2. fallback-ები მუშაობს თუ არა (`meta_title`, `title`)

### თუ არაფერი არ ჩანს:
1. Page Source-ში meta tags რენდერდება თუ არა
2. თუ არა - Next.js metadata generation-ს პრობლემაა
3. თუ კი - Facebook cache-ის პრობლემაა (Scrape Again)
