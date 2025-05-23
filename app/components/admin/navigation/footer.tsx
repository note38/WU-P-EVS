"use client";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-card">
      <div className="mx-auto w-full max-w-7xl px-3 py-4 md:py-2">
        <div className="flex flex-col items-center justify-between gap-4 lg:flex-row">
          {/* Copyright Text */}
          <div className="text-center text-sm text-muted-foreground lg:text-right">
            <p>
              © {currentYear} WUP EVS. All rights reserved.
              <br className="hidden lg:inline" /> {/* Break on desktop */}
              <span className="lg:ml-2">
                Built with transparency and integrity.
              </span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
