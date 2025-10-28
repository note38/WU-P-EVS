/**
 * Debug Script for Clerk Authentication Flow
 *
 * This script helps diagnose issues with the Clerk authentication flow,
 * particularly the "Use another method" button issue.
 *
 * To use this script:
 * 1. Open your browser's developer console
 * 2. Navigate to your sign-in page
 * 3. Paste this entire script and press Enter
 * 4. Check the console output for diagnostic information
 */

(function () {
  console.log("🔍 Starting Clerk Authentication Flow Debug...");

  // Wait for Clerk components to load
  setTimeout(() => {
    console.log("=== Clerk Authentication Debug Report ===");

    // Check for email input
    const emailInput = document.querySelector('input[name="identifier"]');
    console.log("📧 Email input found:", !!emailInput);

    // Check for alternative methods button
    const alternativeMethods = document.querySelector(
      '.cl-alternativeMethods, [class*="alternativeMethods"]'
    );
    console.log("🔄 Alternative methods button found:", !!alternativeMethods);

    // Check for social buttons
    const socialButtons = document.querySelectorAll(
      '.cl-socialButtonsBlockButton, [class*="socialButtons"]'
    );
    console.log("👥 Social buttons found:", socialButtons.length);

    // Check for password input
    const passwordInput = document.querySelector('input[type="password"]');
    console.log("🔑 Password input found:", !!passwordInput);

    // Check current visible strategy
    const factorOne = document.querySelector(
      '.cl-signIn-factorOne, [class*="factorOne"]'
    );
    const startPage = document.querySelector(
      '.cl-signIn-start, [class*="signIn-start"]'
    );

    console.log("📄 Current page type:");
    console.log("   - Start page (email input):", !!startPage);
    console.log("   - Factor one page (code input):", !!factorOne);

    // Focus on email input if present
    if (emailInput) {
      emailInput.focus();
      console.log("🎯 Focused on email input");
    }

    // Summary
    console.log("\n📋 Summary:");
    if (alternativeMethods) {
      console.log(
        '⚠️  Alternative methods are visible - this might be causing the "Use another method" button'
      );
    } else {
      console.log(
        "✅ No alternative methods visible - should show direct email code input"
      );
    }

    if (socialButtons.length > 0) {
      console.log(
        "⚠️  Social buttons detected - these will appear at the top as configured"
      );
    }

    if (passwordInput && !factorOne) {
      console.log(
        "⚠️  Password input detected on start page - might interfere with email code flow"
      );
    }

    // Additional checks for proper styling
    const hiddenElements = document.querySelectorAll(
      '[style*="display: none"], .hidden'
    );
    console.log("🙈 Hidden elements count:", hiddenElements.length);

    // Check for required elements visibility
    const continueButton = document.querySelector(".cl-formButtonPrimary");
    console.log("▶️  Continue button found:", !!continueButton);

    if (factorOne) {
      const codeInput = document.querySelector(
        '.cl-formFieldInput[name="code"]'
      );
      const resendLink = document.querySelector(".cl-footerActionLink");
      console.log("🔢 Code input found:", !!codeInput);
      console.log("🔁 Resend link found:", !!resendLink);
    }

    console.log("\n🔧 Recommendations:");
    if (alternativeMethods) {
      console.log(
        "   1. Check your Clerk Dashboard settings to ensure only email code is enabled"
      );
      console.log(
        "   2. Verify your custom sign-in component CSS is properly hiding alternative methods"
      );
    }

    if (!emailInput && !factorOne) {
      console.log("   1. Clerk components may not have loaded properly");
      console.log("   2. Check for JavaScript errors in the console");
    }

    console.log(
      "\n✅ Debug complete. If issues persist, check the Clerk Dashboard configuration."
    );
  }, 1000); // Wait 1 second for components to load

  // Additional check after 3 seconds
  setTimeout(() => {
    console.log("\n=== Additional Debug Check ===");

    // Check if any alternative method elements are still visible
    const altMethodElements = document.querySelectorAll(
      '[class*="alternative"], [class*="Alternative"]'
    );
    if (altMethodElements.length > 0) {
      console.log("🔍 Found alternative method elements:");
      altMethodElements.forEach((el, index) => {
        console.log(`   ${index + 1}. ${el.className || el.tagName}`);
      });
      console.log("💡 These elements might need additional CSS hiding rules");
    }

    // Check for any visible "Use another method" text
    const useAnotherMethodText = Array.from(
      document.querySelectorAll("*")
    ).filter(
      (el) => el.textContent && el.textContent.includes("Use another method")
    );

    if (useAnotherMethodText.length > 0) {
      console.log('⚠️  Found "Use another method" text in elements:');
      useAnotherMethodText.forEach((el, index) => {
        console.log(
          `   ${index + 1}. ${el.tagName} with class: ${el.className}`
        );
      });
    }
  }, 3000);
})();
