# ⚠️ URGENT: Reset Your Supabase Keys

## რა მოხდა:
თქვენი Supabase keys გამჟღავნდა საჯარო ჩეთში.

## დაუყოვნებლივი ნაბიჯები:

### 1. Reset API Keys (ახლავე!)

1. გადადი: https://supabase.com/dashboard
2. შენი project: `rfjdguztkvatiefezlqr`
3. Settings → API
4. "Reset" ღილაკი anon და service_role keys-ზე
5. დაადასტურე reset

### 2. შექმენი ახალი .env.local ფაილი

```env
# .env.local (არასოდეს commit-ში!)
NEXT_PUBLIC_SUPABASE_URL=https://rfjdguztkvatiefezlqr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<შენი-ახალი-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<შენი-ახალი-service-role-key>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. არასოდეს გააზიარო:
- ❌ Chat/Email-ში
- ❌ GitHub-ში (commit)
- ❌ Slack/Discord-ში
- ❌ Screenshot-ებში

## უსაფრთხო გზები:

### როგორ გავაზიარო keys (თუ საჭიროა):

1. **Environment Variables:**
   - Vercel Dashboard → Settings → Environment Variables
   - Direct input (არა copy-paste ჩეთიდან)

2. **Team Members:**
   - Supabase Dashboard → Settings → Team → Invite
   - ისინი თავად მიიღებენ keys-ს

3. **Password Manager:**
   - 1Password, Bitwarden - encrypted sharing

---

## ✅ Checklist:

- [ ] Supabase keys reset-ილია
- [ ] ახალი keys .env.local-ში
- [ ] .env.local .gitignore-შია
- [ ] ძველი keys აღარ მუშაობს

---

**Keys reset-ის შემდეგ, ყველაფერი კვლავ ნორმალურად იმუშავებს!**
