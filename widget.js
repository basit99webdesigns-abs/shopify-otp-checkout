/* widget.js
   Include this script on your Shopify theme's cart drawer / cart page section
   using <script src="..."></script>.

   This script looks for the following HTML (add this to your cart drawer,
   right before the checkout button):

   <div id="otp-verify-box">
     <div id="otp-step-email">
       <input type="email" id="otp-email-input" placeholder="Enter your email" />
       <button id="otp-send-btn" type="button">Send Code</button>
       <p id="otp-email-error" style="color:red;display:none;"></p>
     </div>
     <div id="otp-step-code" style="display:none;">
       <input type="text" id="otp-code-input" placeholder="6-digit code" maxlength="6" />
       <button id="otp-verify-btn" type="button">Verify and Checkout</button>
       <p id="otp-code-error" style="color:red;display:none;"></p>
       <button id="otp-resend-btn" type="button">Resend code</button>
     </div>
   </div>

   IMPORTANT: this version uses event delegation (listeners attached to
   `document`, not to the buttons themselves). This is required because
   Shopify cart drawers often re-render their inner HTML every time the
   cart updates (add/remove item) - if listeners were attached directly to
   the buttons, those listeners would be destroyed on every re-render and
   the buttons would stop working after the first use.
*/

(function () {
  const API_BASE = 'https://shopify-otp-checkout-ruby.vercel.app/api';

  let verifiedEmail = null;

  function showError(el, message) {
    if (!el) return;
    el.textContent = message;
    el.style.display = 'block';
  }

  function hideError(el) {
    if (!el) return;
    el.style.display = 'none';
  }

  async function sendOtp() {
    const emailInput = document.getElementById('otp-email-input');
    const emailError = document.getElementById('otp-email-error');
    const emailStep = document.getElementById('otp-step-email');
    const codeStep = document.getElementById('otp-step-code');
    const sendBtn = document.getElementById('otp-send-btn');

    const email = emailInput.value.trim();
    hideError(emailError);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError(emailError, 'Please enter a valid email address.');
      return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';

    try {
      const response = await fetch(`${API_BASE}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        showError(emailError, data.error || 'Failed to send code, please try again.');
        return;
      }

      verifiedEmail = email;
      emailStep.style.display = 'none';
      codeStep.style.display = 'block';
    } catch (err) {
      showError(emailError, 'Network error, please try again.');
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send Code';
    }
  }

  async function verifyOtp() {
    const codeInput = document.getElementById('otp-code-input');
    const codeError = document.getElementById('otp-code-error');
    const verifyBtn = document.getElementById('otp-verify-btn');

    const code = codeInput.value.trim();
    hideError(codeError);

    if (!verifiedEmail) {
      showError(codeError, 'Please request a code first.');
      return;
    }

    if (!code || code.length !== 6) {
      showError(codeError, 'Please enter the 6-digit code.');
      return;
    }

    verifyBtn.disabled = true;
    verifyBtn.textContent = 'Verifying...';

    try {
      const response = await fetch(`${API_BASE}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifiedEmail, code }),
      });

      const data = await response.json();

      if (!data.verified) {
        showError(codeError, data.error || 'Incorrect code.');
        return;
      }

      // Verified - redirect to checkout with the email pre-filled
      window.location.href = '/checkout?checkout[email]=' + encodeURIComponent(verifiedEmail);
    } catch (err) {
      showError(codeError, 'Network error, please try again.');
    } finally {
      verifyBtn.disabled = false;
      verifyBtn.textContent = 'Verify and Checkout';
    }
  }

  // Event delegation: listen on document so this keeps working even if the
  // cart drawer's HTML gets replaced/re-rendered after cart updates.
  document.addEventListener('click', function (e) {
    if (e.target && e.target.id === 'otp-send-btn') {
      e.preventDefault();
      sendOtp();
    } else if (e.target && e.target.id === 'otp-verify-btn') {
      e.preventDefault();
      verifyOtp();
    } else if (e.target && e.target.id === 'otp-resend-btn') {
      e.preventDefault();
      sendOtp();
    }
  });
})();
