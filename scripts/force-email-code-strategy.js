/**
 * Force Email Code Strategy for Clerk Authentication
 *
 * This script attempts to force Clerk to use the email code strategy
 * by programmatically setting the sign-in strategy.
 *
 * To use this script:
 * 1. Open your browser's developer console
 * 2. Navigate to your sign-in page
 * 3. Paste this entire script and press Enter
 */

(function () {
  console.log("🔧 Attempting to force email code strategy...");

  // Function to force email code strategy
  function forceEmailCodeStrategy() {
    try {
      // Check if Clerk is available
      if (typeof window.Clerk === "undefined") {
        console.log("⚠️  Clerk is not available on this page");
        return;
      }

      console.log("✅ Clerk is available");

      // Try to set the sign-in strategy to email code
      if (window.Clerk.client && window.Clerk.client.signIn) {
        console.log("🔐 Setting sign-in strategy to email_code");

        // This is the key part - setting the strategy
        window.Clerk.client.signIn.setPreferredSignInStrategy("email_code");

        console.log("✅ Email code strategy set successfully");
      } else {
        console.log("⚠️  Clerk sign-in object not available yet");
      }

      // Also try to modify the sign-in component if it exists
      const signInElements = document.querySelectorAll(
        '[class*="signIn"], [class*="SignIn"]'
      );
      console.log(
        `🔍 Found ${signInElements.length} potential sign-in elements`
      );

      // Try to force show the email code input
      const codeInputs = document.querySelectorAll('input[name="code"]');
      codeInputs.forEach((input, index) => {
        console.log(`🔢 Code input ${index + 1}:`, input);
        input.style.display = "block";
        input.style.visibility = "visible";
      });

      // Try to force show the continue button
      const buttons = document.querySelectorAll(".cl-formButtonPrimary");
      buttons.forEach((button, index) => {
        console.log(
          `🔘 Continue button ${index + 1}:`,
          button.textContent || button.innerText
        );
        button.style.display = "block";
        button.style.visibility = "visible";
      });

      // Try to force show the resend link
      const resendLinks = document.querySelectorAll(".cl-footerActionLink");
      resendLinks.forEach((link, index) => {
        console.log(
          `🔄 Resend link ${index + 1}:`,
          link.textContent || link.innerText
        );
        link.style.display = "block";
        link.style.visibility = "visible";
      });
    } catch (error) {
      console.error("❌ Error forcing email code strategy:", error);
    }
  }

  // Run immediately
  forceEmailCodeStrategy();

  // Run after a delay to catch late-loading elements
  setTimeout(forceEmailCodeStrategy, 2000);

  // Run after a longer delay
  setTimeout(forceEmailCodeStrategy, 5000);

  console.log("✅ Force email code strategy script executed");
  console.log("📋 Check the console for any errors or success messages");
})();
