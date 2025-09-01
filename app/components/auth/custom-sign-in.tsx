"use client";

import { SignIn } from "@clerk/nextjs";

export default function CustomSignIn() {
  return (
    <>
      <style jsx global>{`
        .cl-card,
        .cl-signIn-start,
        .cl-card.cl-signIn-start {
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
        }
      `}</style>
      <div className="w-full max-w-md shadow-lg animate-fadeIn rounded-xl border bg-card text-card-foreground card-gradient">
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
            Wesleyan University Philippines - Enhanced Voting System
          </div>
        </div>
        <div className="">
          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "!shadow-none !border-none !bg-transparent !p-0 !m-0 !rounded-none !w-full [&]:!bg-transparent [&]:!border-0 [&]:!shadow-none [&]:!p-0 [&]:!m-0",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton:
                  "w-full flex items-center justify-center gap-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#23272f] py-2.5 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#23272f]/80 transition-colors disabled:opacity-50 mx-auto",
                socialButtonsBlockButtonText: "text-center",
                socialButtonsProviderIcon: "mx-auto",
                formButtonPrimary:
                  "w-full mt-6 rounded-lg bg-green-500 text-white py-2 text-sm font-semibold hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50",
                formFieldInput:
                  "w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#23272f] text-slate-900 dark:text-slate-100 focus:border-green-500 focus:ring-green-500 transition px-3 py-2 text-center",
                formFieldLabel:
                  "text-sm font-medium text-gray-900 dark:text-gray-100 text-center",
                formField: "",
                formFieldRow: "",
                identityPreview: "hidden",
                dividerLine: "bg-gray-200 dark:bg-gray-700",
                dividerText: "text-gray-500 dark:text-gray-400",
                footerAction: "text-center",
                footerActionLink:
                  "text-green-600 hover:text-green-500 font-medium",
                main: "space-y-4 text-center",
                socialButtonsBlock: "flex flex-col items-center space-y-2",
                header: "hidden",
                footer: "hidden",
                footerActionText: "hidden",
                footerPages: "hidden",
                footer__poweredByClerk: "hidden",
                poweredByClerk: "hidden",
                footerText: "hidden",
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
              },
            }}
            redirectUrl="/api/auth/validate-session"
            afterSignInUrl="/api/auth/validate-session"
          />
        </div>
      </div>
    </>
  );
}
