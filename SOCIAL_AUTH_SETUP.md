# სოციალური ავტორიზაციის კონფიგურაცია

## მიმოხილვა

პროექტში დამატებულია სოციალური ავტორიზაცია შემდეგი პროვაიდერებით:
- **Google**
- **Facebook**
- **Apple**

## Supabase კონფიგურაცია

### 1. Redirect URLs

Supabase Dashboard → Authentication → URL Configuration-ში დაამატეთ:

**Site URL:**
```
http://localhost:3000
https://yourdomain.com
```

**Redirect URLs:**
```
http://localhost:3000/auth/callback
https://yourdomain.com/auth/callback
```

### 2. Google OAuth Setup

#### Google Cloud Console-ში:
1. გადადით [Google Cloud Console](https://console.cloud.google.com/)
2. შექმენით ახალი პროექტი ან აირჩიეთ არსებული
3. გადადით **APIs & Services → Credentials**
4. დააჭირეთ **Create Credentials → OAuth 2.0 Client ID**
5. აირჩიეთ Application type: **Web application**
6. დაამატეთ **Authorized redirect URIs:**
   ```
   https://[YOUR-SUPABASE-PROJECT-REF].supabase.co/auth/v1/callback
   ```
7. დააკოპირეთ **Client ID** და **Client Secret**

#### Supabase Dashboard-ში:
1. გადადით **Authentication → Providers → Google**
2. ჩართეთ Google Provider
3. ჩასვით **Client ID** და **Client Secret**
4. დააჭირეთ **Save**

### 3. Facebook OAuth Setup

#### Facebook Developers-ში:
1. გადადით [Facebook Developers](https://developers.facebook.com/)
2. შექმენით ახალი აპლიკაცია
3. დაამატეთ **Facebook Login** პროდუქტი
4. გადადით **Settings → Basic**
5. დააკოპირეთ **App ID** და **App Secret**
6. გადადით **Facebook Login → Settings**
7. დაამატეთ **Valid OAuth Redirect URIs:**
   ```
   https://[YOUR-SUPABASE-PROJECT-REF].supabase.co/auth/v1/callback
   ```

#### Supabase Dashboard-ში:
1. გადადით **Authentication → Providers → Facebook**
2. ჩართეთ Facebook Provider
3. ჩასვით **App ID** (როგორც Client ID) და **App Secret** (როგორც Client Secret)
4. დააჭირეთ **Save**

### 4. Apple OAuth Setup

#### Apple Developer-ში:
1. გადადით [Apple Developer](https://developer.apple.com/)
2. შექმენით **Services ID** (Sign in with Apple)
3. კონფიგურირეთ **Return URLs:**
   ```
   https://[YOUR-SUPABASE-PROJECT-REF].supabase.co/auth/v1/callback
   ```
4. შექმენით **Private Key** და **Team ID**
5. გადმოწერეთ `.p8` ფაილი

#### Supabase Dashboard-ში:
1. გადადით **Authentication → Providers → Apple**
2. ჩართეთ Apple Provider
3. ჩასვით საჭირო მონაცემები:
   - Services ID
   - Team ID
   - Private Key (.p8 ფაილის შიგთავსი)
   - Key ID
4. დააჭირეთ **Save**

## როგორ მუშაობს

### Login Flow

1. მომხმარებელი აჭერს სოციალური ქსელის ღილაკს (მაგ. "Google-ით შესვლა")
2. `handleSocialLogin` ფუნქცია იძახებს `supabase.auth.signInWithOAuth()`
3. Supabase მომხმარებელს გადამისამართებს პროვაიდერის ავტორიზაციის გვერდზე
4. მომხმარებელი ავტორიზდება პროვაიდერთან
5. პროვაიდერი მომხმარებელს აბრუნებს `/auth/callback` მისამართზე
6. `/auth/callback` route აუთენტიფიკაციის კოდს ცვლის სესიაზე
7. მომხმარებელი გადამისამართდება შესაბამის გვერდზე (როლის მიხედვით)

### კოდი

**LoginForm.tsx & RegisterForm.tsx:**
```typescript
const handleSocialLogin = async (provider: 'google' | 'facebook' | 'apple') => {
  try {
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) throw error
  } catch (err) {
    setError((err as Error).message || 'ავტორიზაცია ვერ მოხერხდა')
    setLoading(false)
  }
}
```

**app/auth/callback/route.ts:**
```typescript
export async function GET(request: NextRequest) {
  const code = requestUrl.searchParams.get('code')
  
  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Check user role and redirect accordingly
      // SUPER_ADMIN/ADMIN → /ka/admin
      // Other users → /ka
    }
  }
}
```

## ფაილები რომლებიც შეიცვალა

1. **src/components/login/LoginForm.tsx**
   - დაემატა `handleSocialLogin` ფუნქცია
   - სოციალური ღილაკებს დაემატა `onClick` ივენთი
   - `icloud` შეიცვალა `apple`-ით

2. **src/components/register/RegisterForm.tsx**
   - დაემატა `handleSocialLogin` ფუნქცია
   - Google ღილაკს დაემატა `onClick` ივენთი
   - `icloud` შეიცვალა `apple`-ით

3. **src/app/auth/callback/route.ts** (ახალი ფაილი)
   - OAuth callback handler
   - სესიის შექმნა და როლის შემოწმება
   - redirect ლოგიკა

## ტესტირება

### ლოკალურად:
1. დარწმუნდით, რომ Supabase-ში კონფიგურირებული გაქვთ `http://localhost:3000/auth/callback`
2. გაუშვით აპლიკაცია: `npm run dev`
3. გადადით login ან register გვერდზე
4. დააჭირეთ სოციალური ქსელის ღილაკს
5. გაიარეთ ავტორიზაცია

### Production-ზე:
1. დაამატეთ production domain Supabase-ის redirect URLs-ში
2. განაახლეთ OAuth პროვაიდერების კონფიგურაცია (redirect URIs)
3. დაამატეთ production domain როგორც authorized domain

## გასათვალისწინებელი

- **პირველი შესვლა სოციალური ქსელით:** თუ მომხმარებელი პირველად შედის სოციალური ქსელით, Supabase ავტომატურად ქმნის ახალ auth user-ს და profile-ს
- **Email Verification:** სოციალური ქსელებით შესვლისას email ავტომატურად არის verified
- **Profile Creation:** Supabase-ის triggers უზრუნველყოფს profile-ის ავტომატურ შექმნას (თუ არსებობს)
- **Error Handling:** ყველა შეცდომა ნაჩვენებია UI-ში და კონსოლშიც

## დამატებითი რესურსები

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Setup Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Facebook OAuth Setup Guide](https://supabase.com/docs/guides/auth/social-login/auth-facebook)
- [Apple OAuth Setup Guide](https://supabase.com/docs/guides/auth/social-login/auth-apple)
