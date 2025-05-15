import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ThankYouPage() {
  return (
    <main className="container mx-auto py-16 px-4 text-center">
      <h1 className="text-4xl font-bold mb-4">Thank You!</h1>
      <p className="text-xl mb-8">Your vote has been recorded successfully.</p>
      <Link href="/">
        <Button>Return Home</Button>
      </Link>
    </main>
  );
}
