import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script";

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
        <Providers>
          {children}
          <Toaster />
        </Providers>

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
                      console.log('Event timing not supported');
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
