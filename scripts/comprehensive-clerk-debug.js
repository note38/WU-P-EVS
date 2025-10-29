/**
 * Comprehensive Debug Script for Clerk Authentication Issues
 *
 * This script provides detailed diagnostics for Clerk authentication problems,
 * particularly when the factor one page (email code input) is not showing.
 *
 * To use this script:
 * 1. Open your browser's developer console
 * 2. Navigate to your sign-in page
 * 3. Paste this entire script and press Enter
 * 4. Check the console output for diagnostic information
 */

(function () {
  console.log("🔍 Starting Comprehensive Clerk Authentication Debug...");

  // Helper function to get computed styles
  function getStyleInfo(element, property) {
    if (!element) return "Element not found";
    try {
      const style = window.getComputedStyle(element);
      return style.getPropertyValue(property);
    } catch (e) {
      return "Error getting style: " + e.message;
    }
  }

  // Helper function to check element visibility
  function checkVisibility(element) {
    if (!element)
      return { exists: false, visible: false, reason: "Element not found" };

    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    const isVisible =
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0" &&
      rect.width > 0 &&
      rect.height > 0;

    return {
      exists: true,
      visible: isVisible,
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      width: rect.width,
      height: rect.height,
    };
  }

  // Main debug function
  function debugClerk() {
    console.log("=== Comprehensive Clerk Authentication Debug Report ===\n");

    // Check if Clerk is loaded
    if (typeof window.Clerk === "undefined") {
      console.warn("⚠️  Clerk is not loaded on this page");
      return;
    }

    console.log("✅ Clerk is loaded");

    // Check current page type
    const startPage = document.querySelector(
      '.cl-signIn-start, [class*="signIn-start"]'
    );
    const factorOnePage = document.querySelector(
      '.cl-signIn-factorOne, [class*="factorOne"]'
    );

    console.log("📄 Page Analysis:");
    console.log("   - Start page (email input):", !!startPage);
    console.log("   - Factor one page (code input):", !!factorOnePage);

    if (startPage) {
      console.log("\n📧 Start Page Analysis:");
      debugStartPage(startPage);
    }

    if (factorOnePage) {
      console.log("\n🔢 Factor One Page Analysis:");
      debugFactorOnePage(factorOnePage);
    }

    // Check for any hidden elements
    checkForHiddenElements();

    // Check for errors
    checkForErrors();
  }

  function debugStartPage(startPage) {
    const emailInput = startPage.querySelector('input[name="identifier"]');
    const continueButton = startPage.querySelector(".cl-formButtonPrimary");
    const socialButtons = startPage.querySelectorAll(
      ".cl-socialButtonsBlockButton"
    );
    const alternativeMethods = startPage.querySelector(
      ".cl-alternativeMethods"
    );

    console.log("   - Email input:", checkVisibility(emailInput));
    console.log("   - Continue button:", checkVisibility(continueButton));
    console.log("   - Social buttons count:", socialButtons.length);
    console.log("   - Alternative methods:", !!alternativeMethods);

    if (emailInput) {
      console.log("   - Email input type:", emailInput.type);
      console.log("   - Email input placeholder:", emailInput.placeholder);
    }

    if (continueButton) {
      console.log(
        "   - Continue button text:",
        continueButton.textContent || continueButton.innerText
      );
    }
  }

  function debugFactorOnePage(factorOnePage) {
    const formField = factorOnePage.querySelector(".cl-formField");
    const codeInput = factorOnePage.querySelector(
      '.cl-formFieldInput[name="code"]'
    );
    const continueButton = factorOnePage.querySelector(".cl-formButtonPrimary");
    const resendLink = factorOnePage.querySelector(".cl-footerActionLink");
    const alternativeMethods = factorOnePage.querySelector(
      ".cl-alternativeMethods"
    );
    const formLabel = factorOnePage.querySelector(".cl-formFieldLabel");

    console.log("   - Form field:", checkVisibility(formField));
    console.log("   - Code input:", checkVisibility(codeInput));
    console.log("   - Continue button:", checkVisibility(continueButton));
    console.log("   - Resend link:", checkVisibility(resendLink));
    console.log("   - Alternative methods:", !!alternativeMethods);
    console.log("   - Form label:", checkVisibility(formLabel));

    if (formField) {
      console.log("   - Form field class:", formField.className);
    }

    if (codeInput) {
      console.log("   - Code input type:", codeInput.type);
      console.log("   - Code input placeholder:", codeInput.placeholder);
      console.log("   - Code input max length:", codeInput.maxLength);
    }

    if (formLabel) {
      console.log(
        "   - Form label text:",
        formLabel.textContent || formLabel.innerText
      );
    }

    if (continueButton) {
      console.log(
        "   - Continue button text:",
        continueButton.textContent || continueButton.innerText
      );
    }

    if (resendLink) {
      console.log(
        "   - Resend link text:",
        resendLink.textContent || resendLink.innerText
      );
    }

    // Check all children
    console.log(
      "   - Total children in factor one page:",
      factorOnePage.children.length
    );
    Array.from(factorOnePage.children).forEach((child, index) => {
      console.log(`     ${index + 1}. ${child.tagName} - ${child.className}`);
    });
  }

  function checkForHiddenElements() {
    const hiddenElements = document.querySelectorAll(
      '[style*="display: none"], .hidden, [style*="visibility: hidden"]'
    );
    if (hiddenElements.length > 0) {
      console.log("\n🙈 Hidden Elements Found:");
      hiddenElements.forEach((el, index) => {
        console.log(
          `   ${index + 1}. ${el.tagName} with class: ${el.className}`
        );
      });
    }
  }

  function checkForErrors() {
    const errorElements = document.querySelectorAll(
      '.cl-error, .cl-formFieldErrorText, [class*="error"]'
    );
    if (errorElements.length > 0) {
      console.log("\n❌ Error Elements Found:");
      errorElements.forEach((el, index) => {
        console.log(`   ${index + 1}. ${el.textContent || el.innerText}`);
      });
    }
  }

  // Run debug after a delay to ensure elements are loaded
  console.log("⏳ Waiting for Clerk components to load...");
  setTimeout(debugClerk, 3000);

  // Also run after a longer delay
  setTimeout(() => {
    console.log("\n=== Second Check (5 seconds) ===");
    debugClerk();
  }, 5000);

  // Instructions for user
  console.log("\n📋 Instructions:");
  console.log(
    '1. Enter an email and click "Continue" to reach the factor one page'
  );
  console.log(
    "2. Run this script again on the factor one page for more detailed analysis"
  );
  console.log('3. Look for any elements marked as "not visible" in the report');
  console.log(
    "4. Check if any critical elements have display: none or visibility: hidden"
  );
})();
