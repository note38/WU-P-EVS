// lib/resend.ts
import { Resend } from "resend";

// Check if Resend API key is available
const apiKey = process.env.RESEND_API_KEY;

if (!apiKey || apiKey === "re_placeholder_key_here") {
  console.warn(
    "⚠️ Resend API key not configured. Email functionality will be disabled."
  );
}

const resend =
  apiKey && apiKey !== "re_placeholder_key_here" ? new Resend(apiKey) : null;

export { resend };
