# Shopify Email OTP Verification (Custom Code Method)

Ye setup 3 hisso me hai: **Backend** (OTP bhejna/verify karna), **Frontend Widget**
(cart page par form), aur **Theme me integration**.

## Part 1 — Backend Deploy Karna (Vercel — free hai)

1. [vercel.com](https://vercel.com) par free account banayen (GitHub se login kar sakte hain).
2. Ye `api/send-otp.js` aur `api/verify-otp.js` files ek naye GitHub repo me daal den
   (ya Vercel CLI se seedha deploy karen: `vercel deploy`).
3. Vercel project settings me ye **Environment Variables** add karen:
   - `RESEND_API_KEY` — [resend.com](https://resend.com) par free account bana kar milega
   - `FROM_EMAIL` — jaise `verify@yourdomain.com` (Resend me domain verify karna hoga;
     testing ke liye Resend ka free `onboarding@resend.dev` bhi chal jata hai)
   - `UPSTASH_REDIS_REST_URL` aur `UPSTASH_REDIS_REST_TOKEN` — [upstash.com](https://upstash.com)
     par free Redis database bana kar "REST API" tab se ye do values milengi
4. Deploy hone ke baad aapko ek URL milega jaisa: `https://your-project.vercel.app`
   Ye API endpoints honge:
   - `https://your-project.vercel.app/api/send-otp`
   - `https://your-project.vercel.app/api/verify-otp`

## Part 2 — Widget Ko Theme Me Add Karna

1. Shopify Admin → Online Store → Themes → **Edit Code** kholen.
2. `widget.js` file ka content copy karen, `API_BASE` line me apna Vercel URL daal den:
   ```js
   const API_BASE = 'https://your-project.vercel.app/api';
   ```
3. Is script ko ek naye Assets file me save karen: `assets/otp-verify.js`
4. Cart page ke template (`sections/main-cart-footer.liquid` ya jahan
   "Checkout" button hai) me, checkout button se pehlay ye HTML add karen:

   ```html
   <div id="otp-verify-box">
     <div id="otp-step-email">
       <input type="email" id="otp-email-input" placeholder="Apna email likhen" />
       <button id="otp-send-btn" type="button">Code Bhejen</button>
       <p id="otp-email-error" style="color:red;display:none;"></p>
     </div>
     <div id="otp-step-code" style="display:none;">
       <input type="text" id="otp-code-input" placeholder="6-digit code" maxlength="6" />
       <button id="otp-verify-btn" type="button">Verify aur Checkout</button>
       <p id="otp-code-error" style="color:red;display:none;"></p>
       <button id="otp-resend-btn" type="button">Code dobara bhejen</button>
     </div>
   </div>

   <script src="{{ 'otp-verify.js' | asset_url }}" defer></script>
   ```

5. Asal "Checkout" button ko hide kar den (ya us jagah ye widget dikhayen),
   taake customer pehlay verify kare.

## Part 3 — Test Karna

1. Apne dev store ka cart page kholen (kam az kam 1 product cart me daal ke).
2. Apna email dalen → "Code Bhejen" dabayen.
3. Apne inbox me 6-digit code check karen (Resend free tier se aata hai).
4. Code enter karen → "Verify aur Checkout" dabayen.
5. Checkout page khulna chahiye, email field already filled honi chahiye.

## Important Notes

- **`?checkout[email]=` tareeqa**: widget.js checkout URL me email ko query
  parameter ke tor par bhejta hai, jo classic Shopify checkout email field
  pre-fill kar deta hai. Agar aapke store ka checkout (naya Shopify
  Checkout Extensibility) is parameter ko ignore kare, to iski jagah
  Shopify **Storefront API** ka `cartEmailUpdate` mutation use karna
  parega — is case me bata den, main wo version bhi bana dunga.
- **Rate limiting**: abhi is code me koi limit nahi hai ke ek email par kitni
  baar OTP bheja ja sakta hai. Live pe jane se pehlay isay add karna zaroori
  hai (warna koi bhi email par spam bhej sakta hai) — Upstash Redis me hi
  ek counter rakh kar ye asaan se ho sakta hai.
- **CORS**: `send-otp.js` aur `verify-otp.js` me `Access-Control-Allow-Origin: '*'`
  hai jo abhi testing ke liye theek hai. Live store par jaake isay apne store
  ke exact domain se replace kar den (security ke liye).
