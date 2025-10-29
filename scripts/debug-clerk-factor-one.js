/**
 * Debug Script for Clerk Factor One Page
 *
 * This script helps diagnose issues with the Clerk factor one page
 * where the email code input is not showing properly.
 *
 * To use this script:
 * 1. Open your browser's developer console
 * 2. Navigate to your sign-in page
 * 3. Enter an email and click continue to reach the factor one page
 * 4. Paste this entire script and press Enter
 * 5. Check the console output for diagnostic information
 */

(function () {
  console.log("🔍 Starting Clerk Factor One Page Debug...");

  // Wait for Clerk components to load
  setTimeout(() => {
    console.log("=== Clerk Factor One Page Debug Report ===");

    // Check if we're on the factor one page
    const factorOne = document.querySelector(
      '.cl-signIn-factorOne, [class*="factorOne"]'
    );
    const startPage = document.querySelector(
      '.cl-signIn-start, [class*="signIn-start"]'
    );

    console.log("📄 Current page type:");
    console.log("   - Start page (email input):", !!startPage);
    console.log("   - Factor one page (code input):", !!factorOne);

    if (!factorOne) {
      console.log(
        "⚠️  Not on factor one page. Enter an email and click continue first."
      );
      return;
    }

    // Check for required elements on factor one page
    const formField = document.querySelector(
      ".cl-signIn-factorOne .cl-formField"
    );
    const codeInput = document.querySelector(
      '.cl-signIn-factorOne .cl-formFieldInput[name="code"]'
    );
    const continueButton = document.querySelector(
      ".cl-signIn-factorOne .cl-formButtonPrimary"
    );
    const resendLink = document.querySelector(
      ".cl-signIn-factorOne .cl-footerActionLink"
    );
    const alternativeMethods = document.querySelector(
      ".cl-signIn-factorOne .cl-alternativeMethods"
    );

    console.log("\n🔍 Factor One Elements:");
    console.log("   - Form field:", !!formField);
    console.log("   - Code input:", !!codeInput);
    console.log("   - Continue button:", !!continueButton);
    console.log("   - Resend link:", !!resendLink);
    console.log("   - Alternative methods:", !!alternativeMethods);

    // Check visibility and display properties
    if (formField) {
      const formFieldStyle = window.getComputedStyle(formField);
      console.log("   - Form field display:", formFieldStyle.display);
      console.log("   - Form field visibility:", formFieldStyle.visibility);
    }

    if (codeInput) {
      const codeInputStyle = window.getComputedStyle(codeInput);
      console.log("   - Code input display:", codeInputStyle.display);
      console.log("   - Code input visibility:", codeInputStyle.visibility);
      console.log("   - Code input type:", codeInput.type);
    }

    if (continueButton) {
      const buttonStyle = window.getComputedStyle(continueButton);
      console.log("   - Button display:", buttonStyle.display);
      console.log("   - Button visibility:", buttonStyle.visibility);
      console.log(
        "   - Button text:",
        continueButton.textContent || continueButton.innerText
      );
    }

    // Check if elements are hidden by CSS
    const hiddenElements = document.querySelectorAll(
      '.cl-signIn-factorOne [style*="display: none"], .cl-signIn-factorOne .hidden'
    );
    if (hiddenElements.length > 0) {
      console.log("\n🙈 Hidden elements found:");
      hiddenElements.forEach((el, index) => {
        console.log(
          `   ${index + 1}. ${el.tagName} with class: ${el.className}`
        );
      });
    }

    // Check for overlay or blocking elements
    const allFactorOneChildren = document.querySelectorAll(
      ".cl-signIn-factorOne *"
    );
    console.log(
      "\n📋 Total elements in factor one page:",
      allFactorOneChildren.length
    );

    // Try to force visibility
    console.log("\n🔧 Attempting to force visibility...");

    const elementsToCheck = [
      { element: factorOne, name: "Factor One Container" },
      { element: formField, name: "Form Field" },
      { element: codeInput, name: "Code Input" },
      { element: continueButton, name: "Continue Button" },
      { element: resendLink, name: "Resend Link" },
    ];

    elementsToCheck.forEach(({ element, name }) => {
      if (element) {
        const originalDisplay = element.style.display;
        const originalVisibility = element.style.visibility;

        element.style.display = "block";
        element.style.visibility = "visible";

        console.log(
          `   - Forced ${name} to be visible (was: display=${originalDisplay}, visibility=${originalVisibility})`
        );
      }
    });

    console.log(
      "\n✅ Debug complete. If elements are now visible, the issue is with CSS styling."
    );
    console.log(
      "If elements are still not visible, the issue may be with Clerk configuration."
    );
  }, 2000); // Wait 2 seconds for components to load

  // Additional check after 5 seconds
  setTimeout(() => {
    console.log("\n=== Additional Debug Check ===");

    // Check for any error messages in the console
    const errorElements = document.querySelectorAll(
      ".cl-signIn-factorOne .cl-formFieldErrorText, .cl-error"
    );
    if (errorElements.length > 0) {
      console.log("❌ Error messages found:");
      errorElements.forEach((el, index) => {
        console.log(`   ${index + 1}. ${el.textContent || el.innerText}`);
      });
    }

    // Check if the page has loaded completely
    console.log("📄 Page load status:", document.readyState);
  }, 5000);
})();
