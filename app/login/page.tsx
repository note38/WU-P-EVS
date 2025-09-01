"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Clerk sign-in page
    router.replace("/sign-in");
  }, [router]);

  return null;
}
