"use client";

import { SignIn } from "@clerk/nextjs";
import { useEffect } from "react";

export default function CustomSignIn() {
  // Force focus on the email input when component mounts
  useEffect(() => {
    const focusEmailInput = () => {
      // Wait a bit for the component to render
      setTimeout(() => {
        const emailInput = document.querySelector('input[name="identifier"]');
        if (emailInput && emailInput instanceof HTMLInputElement) {
          emailInput.focus();
        }
      }, 100);
    };

    focusEmailInput();

    // Also try again after a longer delay in case of slower renders
    const fallbackFocus = setTimeout(focusEmailInput, 500);

    return () => {
      clearTimeout(fallbackFocus);
    };
  }, []);

  return (
    <>
      <style jsx global>{`
        /* Remove all box shadows from Clerk components */
        [class*="cl-"] {
          box-shadow: none !important;
        }

        /* Even more specific rule to remove shadows */
        div[class*="cl-signIn-factorOne"] {
          box-shadow: none !important;
          border: none !important;
          background: transparent !important;
        }

        div[class*="cl-signIn-factorOne"] div {
          box-shadow: none !important;
        }

        .cl-card,
        .cl-signIn-start,
        .cl-card.cl-signIn-start,
        .cl-signIn-factorOne,
        .cl-card.cl-signIn-factorOne {
          background: transparent !important;
          background-color: transparent !important;
          border: none !important;
          border-width: 0 !important;
          box-shadow: none !important;
          padding: 0 !important;
          margin: 0 !important;
          border-radius: 0 !important;
          backdrop-filter: none !important;
          outline: none !important;
          min-height: auto !important;
          height: auto !important;
          width: 100% !important;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          padding-bottom: 1rem !important;
        }

        .cl-rootBox {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          margin: 0 !important;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
        }

        /* Additional specific styling for factor-one page */
        .cl-signIn-factorOne .cl-card {
          box-shadow: none !important;
          border: none !important;
          background: transparent !important;
        }

        /* Target the specific factor-one container */
        .cl-signIn-factorOne {
          box-shadow: none !important;
          border: none !important;
          background: transparent !important;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
        }

        /* Center the main content in factor-one */
        .cl-signIn-factorOne .cl-main {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
        }

        /* Factor-one specific styling */
        .cl-signIn-factorOne .cl-footerAction,
        .cl-signIn-factorOne .cl-footerActionText,
        .cl-signIn-factorOne .cl-footerActionLink {
          color: #6b7280 !important; /* Default gray */
        }

        /* Dark mode support for factor-one elements */
        @media (prefers-color-scheme: dark) {
          .cl-signIn-factorOne .cl-footerAction,
          .cl-signIn-factorOne .cl-footerActionText,
          .cl-signIn-factorOne .cl-footerActionLink {
            color: #9ca3af !important; /* Lighter gray for dark mode */
          }
        }

        /* Force dark mode styling when html has dark class */
        html.dark .cl-signIn-factorOne .cl-footerAction,
        html.dark .cl-signIn-factorOne .cl-footerActionText,
        html.dark .cl-signIn-factorOne .cl-footerActionLink {
          color: #9ca3af !important;
        }

        /* Additional factor-one styling for better visibility */
        .cl-signIn-factorOne .cl-footerActionLink:hover {
          color: #10b981 !important; /* Green hover color */
        }

        html.dark .cl-signIn-factorOne .cl-footerActionLink:hover {
          color: #34d399 !important; /* Lighter green for dark mode hover */
        }

        /* Ensure all factor-one text elements have proper contrast */
        .cl-signIn-factorOne .cl-formFieldLabel,
        .cl-signIn-factorOne .cl-formFieldHintText,
        .cl-signIn-factorOne .cl-formFieldErrorText {
          color: #374151 !important;
        }

        html.dark .cl-signIn-factorOne .cl-formFieldLabel,
        html.dark .cl-signIn-factorOne .cl-formFieldHintText,
        html.dark .cl-signIn-factorOne .cl-formFieldErrorText {
          color: #d1d5db !important;
        }

        /* Better styling for resend code button */
        .cl-signIn-factorOne .cl-footerActionLink {
          text-decoration: underline !important;
          text-underline-offset: 2px !important;
        }

        /* Explicit styling for social buttons to match input fields */
        .cl-signIn-factorOne .cl-socialButtonsBlockButton,
        .cl-signIn-factorOne .cl-formButtonPrimary,
        .cl-signIn-factorOne .cl-formFieldInput {
          height: 40px !important;
          min-height: 40px !important;
          padding: 8px 12px !important;
          border-radius: 0.5rem !important;
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
        }

        /* Ensure social buttons block takes full width */
        .cl-signIn-factorOne .cl-socialButtonsBlock {
          width: 100% !important;
          max-width: 100% !important;
        }

        /* Make sure the form field has consistent width */
        .cl-signIn-factorOne .cl-formField {
          width: 100% !important;
          max-width: 100% !important;
        }

        /* Ensure the main container has consistent width */
        .cl-signIn-factorOne .cl-main {
          width: 100% !important;
          max-width: 100% !important;
        }

        /* Remove any default margins or padding that might affect width */
        .cl-signIn-factorOne .cl-formFieldRow {
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        /* Ensure the card content has full width */
        .cl-signIn-factorOne .cl-cardBox {
          width: 100% !important;
          max-width: 100% !important;
        }

        /* Hide the "Use another method" button */
        .cl-signIn-factorOne .cl-alternativeMethods {
          display: none !important;
        }

        /* Hide alternative methods title */
        .cl-signIn-factorOne .cl-alternativeMethodsTitle {
          display: none !important;
        }

        /* Hide alternative methods block */
        .cl-signIn-factorOne .cl-alternativeMethodsBlock {
          display: none !important;
        }

        /* Reorder social buttons to appear at the top */
        .cl-signIn-start .cl-main {
          display: flex !important;
          flex-direction: column !important;
        }

        .cl-signIn-start .cl-socialButtons {
          order: -1 !important;
          margin-bottom: 1rem !important;
        }

        .cl-signIn-start .cl-socialButtonsBlockButton,
        .cl-signIn-start .cl-formButtonPrimary,
        .cl-signIn-start .cl-formFieldInput {
          height: 40px !important;
          min-height: 40px !important;
          padding: 8px 12px !important;
          border-radius: 0.5rem !important;
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
        }
      `}</style>
      <div
        className="w-full animate-fadeIn rounded-xl border bg-card text-card-foreground"
        style={{ boxShadow: "none" }}
      >
        <div className="flex flex-col space-y-1.5 p-6">
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <img
                src="/wup-logo.png"
                alt="WUP Logo"
                className="w-16 h-16 text-primary"
              />
            </div>
          </div>
          <div className="font-semibold leading-none tracking-tight text-2xl text-center">
            WU-P EVS
          </div>
          <div className="text-sm text-muted-foreground text-center">
            Wesleyan University-Philippines
            <br />
            Enhanced Voting System
          </div>
        </div>
        <div className="px-6 pb-6">
          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full flex items-center justify-center",
                card: "!shadow-none !border-none !bg-transparent !p-0 !m-0 !rounded-none !w-full [&]:!bg-transparent [&]:!border-0 [&]:!shadow-none [&]:!p-0 [&]:!m-0 flex items-center justify-center",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton:
                  "w-full flex items-center justify-center gap-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#23272f] py-2.5 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#23272f]/80 transition-colors disabled:opacity-50",
                socialButtonsBlockButtonText: "text-center",
                socialButtonsProviderIcon: "mx-auto",
                formButtonPrimary:
                  "w-full rounded-lg bg-green-500 text-white py-2 text-sm font-semibold hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50",
                formFieldInput:
                  "w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#23272f] text-slate-900 dark:text-slate-100 focus:border-green-500 focus:ring-green-500 transition px-3 py-2 text-center",
                formFieldLabel:
                  "text-sm font-medium text-gray-900 dark:text-gray-100 text-center",
                formField: "text-center w-full",
                formFieldRow: "text-center w-full",
                identityPreview: "hidden",
                dividerLine: "bg-gray-200 dark:bg-gray-700",
                dividerText: "text-gray-500 dark:text-gray-400",
                footerAction: "text-center text-gray-600 dark:text-gray-400",
                footerActionLink:
                  "text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300 font-medium",
                footerActionText: "text-gray-600 dark:text-gray-400",
                main: "space-y-4 text-center flex flex-col items-center justify-center w-full",
                socialButtonsBlock:
                  "flex flex-col items-center space-y-2 w-full",
                header: "hidden",
                footer: "hidden",
                footerPages: "hidden",
                footer__poweredByClerk: "hidden",
                poweredByClerk: "hidden",
                footerText: "hidden",
                // Specific factor-one elements
                signInFactorOne:
                  "!shadow-none !border-none !bg-transparent !p-0 flex flex-col items-center justify-center w-full",
                "cl-signIn-factorOne .cl-card":
                  "!shadow-none !border-none !p-0 flex items-center justify-center",
                "cl-signIn-factorOne .cl-main":
                  "flex flex-col items-center justify-center w-full",
                // Hide alternative methods
                alternativeMethods: "hidden",
                alternativeMethodsTitle: "hidden",
                alternativeMethodsBlock: "hidden",
                // Social buttons at the top
                socialButtons: "order-first mb-4",
              },
              variables: {
                colorPrimary: "#10b981",
                colorText: "#111827",
                colorTextSecondary: "#6b7280",
                colorBackground: "transparent",
                colorInputBackground: "#ffffff",
                colorInputText: "#111827",
                borderRadius: "0.5rem",
              },
              layout: {
                showOptionalFields: false,
                termsPageUrl: undefined,
                privacyPageUrl: undefined,
                helpPageUrl: undefined,
                socialButtonsPlacement: "top", // Place social buttons at the top
              },
            }}
            signUpUrl={undefined}
            forceRedirectUrl="/api/auth/validate-session?redirect=true"
            fallbackRedirectUrl="/api/auth/validate-session?redirect=true"
            redirectUrl="/api/auth/validate-session?redirect=true"
            afterSignInUrl="/api/auth/validate-session?redirect=true"
          />
        </div>
      </div>
    </>
  );
}
