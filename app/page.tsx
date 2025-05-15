import { getVoterSession } from "@/action/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  // Check if user is already logged in as a voter
  const session = await getVoterSession();

  if (session) {
    // Redirect to ballot if already logged in
    redirect("/ballot");
  } else {
    // Redirect to login page if not logged in
    redirect("/login");
  }
}
