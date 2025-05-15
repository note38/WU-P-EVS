"use server";

import { revalidateTag } from "next/cache";

// Server action to handle revalidation - can be called from client components
export async function refreshVotersData() {
  revalidateTag("voters");
  revalidateTag("departments");
  revalidateTag("years");
}
