import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script";
import { ClerkProvider } from "@clerk/nextjs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "WUP Voting System",
  description: "Electronic voting system for AWUP",
  icons: {
    icon: "/wup-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* DNS prefetch for external domains */}
        <link rel="dns-prefetch" href="//ui-avatars.com" />
        <link rel="preconnect" href="https://ui-avatars.com" crossOrigin="" />
        {/* Performance optimizations */}
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#ffffff" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ClerkProvider
          appearance={{
            cssLayerName: "clerk",
            baseTheme: undefined, // Will use automatic dark mode detection
            elements: {
              // Global styling for all Clerk components - removed shadow
              card: "bg-white dark:bg-[#1a1f29] rounded-xl border border-slate-200 dark:border-slate-700 !shadow-none flex items-center justify-center",
              rootBox: "shadow-none flex items-center justify-center w-full",
              headerTitle: "text-slate-900 dark:text-slate-100",
              headerSubtitle: "text-slate-600 dark:text-slate-400",
              formButtonPrimary:
                "mt-4 w-full rounded-lg bg-green-500 text-white py-2.5 text-sm font-semibold hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50",
              formFieldInput:
                "w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#23272f] text-slate-900 dark:text-slate-100 focus:border-green-500 focus:ring-green-500 transition px-3 py-2",
              formFieldLabel: "text-slate-700 dark:text-slate-300",
              socialButtonsBlockButton:
                "my-2 w-full flex items-center justify-center gap-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#23272f] py-2.5 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#23272f]/80 transition-colors disabled:opacity-50",
              footerAction: "text-slate-600 dark:text-slate-400",
              footerActionLink:
                "text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300",
              // Specific styling for factor-one page - removed shadow and added more specific rules
              signInFactorOne:
                "bg-white dark:bg-[#1a1f29] !shadow-none !border-none !p-0 flex flex-col items-center justify-center w-full",
              signInFactorOneTitle: "text-slate-900 dark:text-slate-100",
              signInFactorOneSubtitle: "text-slate-600 dark:text-slate-400",
              otpCodeFieldInput:
                "w-12 h-12 text-center text-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#23272f] text-slate-900 dark:text-slate-100 rounded-lg focus:border-green-500 focus:ring-green-500",
              footer: "text-slate-600 dark:text-slate-400",
              // Fix for "Didn't receive a code? Resend" text in dark mode
              formResendCodeLink:
                "text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300",
              formHelperText: "text-slate-600 dark:text-slate-400",
              // Style the OTP input container
              otpCodeField: "justify-center gap-2",
              // Ensure no shadow on any Clerk component
              main: "flex flex-col items-center justify-center w-full",
            },
            variables: {
              colorPrimary: "#10b981",
              colorText: "rgb(15 23 42)", // slate-900
              colorTextSecondary: "rgb(100 116 139)", // slate-500
              colorBackground: "transparent",
              colorInputBackground: "rgb(255 255 255)",
              colorInputText: "rgb(15 23 42)",
            },
          }}
        >
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </ClerkProvider>
        {/* Enhanced Web Vitals monitoring with INP focus */}
        <Script
          id="web-vitals"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                let inpValue = 0;
                let lcpValue = 0;
                let clsValue = 0;
                
                function observeINP() {
                  let interactions = [];
                  let observer;

                  function reportINP() {
                    if (interactions.length === 0) return;
                    const longestInteraction = Math.max(...interactions);
                    inpValue = longestInteraction;
                    
                    // Log to console for debugging
                    console.log('Current INP:', longestInteraction + 'ms');
                    
                    // Send to analytics if needed
                    if (typeof gtag !== 'undefined') {
                      gtag('event', 'web_vitals', {
                        event_category: 'INP',
                        value: Math.round(longestInteraction),
                        non_interaction: true,
                      });
                    }
                  }

                  // PerformanceObserver for event timing
                  if ('PerformanceObserver' in window) {
                    observer = new PerformanceObserver((list) => {
                      for (const entry of list.getEntries()) {
                        if (entry.entryType === 'event') {
                          interactions.push(entry.duration);
                          reportINP();
                        }
                      }
                    });
                    
                    try {
                      observer.observe({type: 'event', buffered: true});
                    } catch (e) {
                      // Fallback for browsers that don't support event timing
                    }
                  }

                  // Report final INP on page visibility change
                  document.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'hidden') {
                      reportINP();
                    }
                  });
                }

                // Initialize INP monitoring
                observeINP();

                // Web Vitals library alternative for core metrics
                function getCLS(onReport) {
                  let clsValue = 0;
                  let clsEntries = [];
                  
                  const observer = new PerformanceObserver((entryList) => {
                    for (const entry of entryList.getEntries()) {
                      if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                        clsEntries.push(entry);
                      }
                    }
                    onReport({name: 'CLS', value: clsValue});
                  });
                  
                  observer.observe({type: 'layout-shift', buffered: true});
                }

                function getLCP(onReport) {
                  const observer = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    lcpValue = lastEntry.startTime;
                    onReport({name: 'LCP', value: lastEntry.startTime});
                  });
                  
                  observer.observe({type: 'largest-contentful-paint', buffered: true});
                }

                // Report metrics
                function reportMetric(metric) {
                  console.log(metric.name + ':', Math.round(metric.value) + 'ms');
                }

                // Initialize all metrics
                getCLS(reportMetric);
                getLCP(reportMetric);
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}