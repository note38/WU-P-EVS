"use client";

import { SignIn } from "@clerk/nextjs";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function CustomSignIn() {
  const searchParams = useSearchParams();

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

  // Determine redirect URL based on environment and query parameters
  const getRedirectUrl = () => {
    // First check if there's a redirect_url parameter
    const redirectParam = searchParams.get("redirect_url");
    if (redirectParam) {
      try {
        // Handle relative URLs directly
        if (redirectParam.startsWith("/")) {
          console.log(
            "🔧 Using relative redirect URL from parameter:",
            redirectParam
          );
          return redirectParam;
        }

        // Handle absolute URLs by checking if they're on the same origin
        const url = new URL(
          decodeURIComponent(redirectParam),
          typeof window !== "undefined"
            ? window.location.origin
            : "http://localhost:3000"
        );
        if (
          typeof window !== "undefined" &&
          url.origin === window.location.origin
        ) {
          console.log("🔧 Using redirect URL from parameter:", url.pathname);
          return url.pathname;
        }
        // If it's pointing to a different domain, we should ignore it for security
        console.log("⚠️ Ignoring external redirect URL:", redirectParam);
      } catch (e) {
        console.error("Error parsing redirect URL parameter:", e);
      }
    }

    // Fallback to default redirect
    return "/dashboard-redirect";
  };

  const redirectUrl = getRedirectUrl();

  return (
    <>
      <style jsx global>{`
        /* Remove all box shadows from Clerk components */
        [class*="cl-"] {
          box-shadow: none !important;
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
            WU-P DVS
          </div>
          <div className="text-sm text-muted-foreground text-center">
            Wesleyan University-Philippines
            <br />
            Develop Voting System
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
                  "w-full rounded-lg bg-green-500 text-white py-2 text-sm font-semibold hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 flex items-center justify-center text-center",
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
                backLink:
                  "text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300 font-medium",
                alternativeMethodsBlockButton:
                  "w-full rounded-lg bg-green-500 text-white py-2 text-sm font-semibold hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 flex items-center justify-center text-center",
                // This specifically targets the 6-digit code input field
                formFieldInputCode:
                  "block visible opacity-100 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#23272f] text-slate-900 dark:text-slate-100 focus:border-green-500 focus:ring-green-500 transition px-3 py-2 text-center text-[1.25rem] tracking-[0.5rem]",
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
                // Specific factor-one elements - CRITICAL FIX
                signInFactorOne:
                  "block visible opacity-100 w-full flex flex-col items-center justify-center",
                "cl-signIn-factorOne":
                  "block visible opacity-100 w-full flex flex-col items-center justify-center",
                "cl-signIn-factorOne .cl-card":
                  "block visible opacity-100 flex items-center justify-center",
                "cl-signIn-factorOne .cl-main":
                  "block visible opacity-100 flex flex-col items-center justify-center w-full",
                "cl-signIn-factorOne .cl-formField":
                  "block visible opacity-100 w-full text-center",
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
                termsPageUrl: undefined,
                privacyPageUrl: undefined,
                helpPageUrl: undefined,
                socialButtonsPlacement: "top",
              },
            }}
            signUpUrl="/sign-up"
            // Use the newer Clerk redirect props instead of deprecated ones
            fallbackRedirectUrl="/dashboard-redirect"
            forceRedirectUrl="/dashboard-redirect"
          />
        </div>
      </div>
    </>
  );
}
