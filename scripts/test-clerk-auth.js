/**
 * Test Script for Clerk Authentication Strategies
 * 
 * This script helps verify that only email code authentication is being used.
 * Run this script in your browser console on the sign-in page to check
 * which authentication elements are present.
 */

(function() {
  console.log('🔍 Checking Clerk authentication elements...');
  
  // Wait for Clerk components to load
  setTimeout(() => {
    // Check for email input
    const emailInput = document.querySelector('input[name="identifier"]');
    console.log('📧 Email input found:', !!emailInput);
    
    // Check for alternative methods button
    const alternativeMethods = document.querySelector('.cl-alternativeMethods, [class*="alternativeMethods"]');
    console.log('🔄 Alternative methods button found:', !!alternativeMethods);
    
    // Check for social buttons
    const socialButtons = document.querySelectorAll('.cl-socialButtonsBlockButton, [class*="socialButtons"]');
    console.log('👥 Social buttons found:', socialButtons.length);
    
    // Check for password input
    const passwordInput = document.querySelector('input[type="password"]');
    console.log('🔑 Password input found:', !!passwordInput);
    
    // Check current visible strategy
    const factorOne = document.querySelector('.cl-signIn-factorOne, [class*="factorOne"]');
    const startPage = document.querySelector('.cl-signIn-start, [class*="signIn-start"]');
    
    console.log('📄 Current page type:');
    console.log('   - Start page (email input):', !!startPage);
    console.log('   - Factor one page (code input):', !!factorOne);
    
    // Focus on email input if present
    if (emailInput) {
      emailInput.focus();
      console.log('🎯 Focused on email input');
    }
    
    // Summary
    console.log('\n📋 Summary:');
    if (alternativeMethods) {
      console.log('⚠️  Alternative methods are visible - this might be causing the "Use another method" button');
    } else {
      console.log('✅ No alternative methods visible - should show direct email code input');
    }
    
    if (socialButtons.length > 0) {
      console.log('⚠️  Social buttons detected - these will appear at the top as configured');
    }
    
    if (passwordInput && !factorOne) {
      console.log('⚠️  Password input detected on start page - might interfere with email code flow');
    }
    
    // Additional checks for proper styling
    const hiddenElements = document.querySelectorAll('[style*="display: none"], .hidden');
    console.log('🚫 Hidden elements (should include alternative methods):', hiddenElements.length);
    
  }, 1000);
  
  // Additional check after 3 seconds to ensure all elements have loaded
  setTimeout(() => {
    console.log('\n🔄 Second check after 3 seconds:');
    
    // Check if alternative methods are properly hidden
    const alternativeMethods = document.querySelector('.cl-alternativeMethods');
    if (alternativeMethods) {
      const computedStyle = window.getComputedStyle(alternativeMethods);
      console.log('🔄 Alternative methods display style:', computedStyle.display);
      if (computedStyle.display !== 'none') {
        console.log('⚠️  Alternative methods are still visible - CSS might not be applied correctly');
      }
    }
    
    // Check social buttons positioning
    const socialButtonsContainer = document.querySelector('.cl-socialButtons');
    if (socialButtonsContainer) {
      const order = window.getComputedStyle(socialButtonsContainer).order;
      console.log('🔄 Social buttons order:', order);
      if (order !== '-1') {
        console.log('⚠️  Social buttons might not be at the top - CSS order not applied');
      }
    }
  }, 3000);
})();