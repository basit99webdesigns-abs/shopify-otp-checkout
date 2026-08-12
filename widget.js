/* widget.js
   Ye script apne Shopify theme ke cart page (cart-template.liquid ya
   sections/main-cart-footer.liquid) me <script src="..."></script> se
   include karen, ya seedha <script>...</script> tag ke andar paste kar den.

   Ye is HTML ko dhoondta hai (isay apne cart page pe add karen):

   <div id="otp-verify-box">
     <div id="otp-step-email">
       <input type="email" id="otp-email-input" placeholder="Apna email likhen" />
       <button id="otp-send-btn">Code Bhejen</button>
       <p id="otp-email-error" style="color:red;display:none;"></p>
     </div>
     <div id="otp-step-code" style="display:none;">
       <input type="text" id="otp-code-input" placeholder="6-digit code" maxlength="6" />
       <button id="otp-verify-btn">Verify aur Checkout</button>
       <p id="otp-code-error" style="color:red;display:none;"></p>
       <button id="otp-resend-btn" type="button">Code dobara bhejen</button>
     </div>
   </div>
*/

(function () {
  // Apna Vercel backend ka URL yahan daalen (deploy karne ke baad milega)
  const API_BASE = 'https://YOUR-PROJECT.vercel.app/api';

  const emailStep = document.getElementById('otp-step-email');
  const codeStep = document.getElementById('otp-step-code');
  const emailInput = document.getElementById('otp-email-input');
  const codeInput = document.getElementById('otp-code-input');
  const sendBtn = document.getElementById('otp-send-btn');
  const verifyBtn = document.getElementById('otp-verify-btn');
  const resendBtn = document.getElementById('otp-resend-btn');
  const emailError = document.getElementById('otp-email-error');
  const codeError = document.getElementById('otp-code-error');

  if (!emailStep || !codeStep) return; // widget iss page par nahi hai

  let verifiedEmail = null;

  function showError(el, message) {
    el.textContent = message;
    el.style.display = 'block';
  }

  function hideError(el) {
    el.style.display = 'none';
  }

  async function sendOtp() {
    const email = emailInput.value.trim();
    hideError(emailError);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError(emailError, 'Sahi email address likhen.');
      return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = 'Bhej rahe hain...';

    try {
      const response = await fetch(`${API_BASE}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        showError(emailError, data.error || 'Code bhejne me masla hua, dobara try karen.');
        return;
      }

      verifiedEmail = email;
      emailStep.style.display = 'none';
      codeStep.style.display = 'block';
    } catch (err) {
      showError(emailError, 'Network error, dobara try karen.');
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = 'Code Bhejen';
    }
  }

  async function verifyOtp() {
    const code = codeInput.value.trim();
    hideError(codeError);

    if (!code || code.length !== 6) {
      showError(codeError, '6-digit code likhen.');
      return;
    }

    verifyBtn.disabled = true;
    verifyBtn.textContent = 'Verify ho raha hai...';

    try {
      const response = await fetch(`${API_BASE}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifiedEmail, code }),
      });

      const data = await response.json();

      if (!data.verified) {
        showError(codeError, data.error || 'Code ghalat hai.');
        return;
      }

      // Verify ho gaya - ab checkout par redirect karen, email ke sath
      window.location.href = '/checkout?checkout[email]=' + encodeURIComponent(verifiedEmail);
    } catch (err) {
      showError(codeError, 'Network error, dobara try karen.');
    } finally {
      verifyBtn.disabled = false;
      verifyBtn.textContent = 'Verify aur Checkout';
    }
  }

  sendBtn.addEventListener('click', sendOtp);
  verifyBtn.addEventListener('click', verifyOtp);
  resendBtn.addEventListener('click', sendOtp);
})();
