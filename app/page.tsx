"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser, useClerk } from "@clerk/nextjs";
import { checkUserRole } from "@/action/auth";
import HomePage from "./home/page";

export default function Home() {
  return <HomePage />;
}
