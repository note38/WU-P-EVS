import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function ThankYouPage() {
  return (
    <div className="container max-w-md mx-auto flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <div className="mb-6 rounded-full bg-green-100 p-3">
        <CheckCircle className="h-12 w-12 text-green-600" />
      </div>
      <h1 className="text-3xl font-bold mb-2">Thank You!</h1>
      <p className="text-muted-foreground mb-8">
        Your vote has been successfully submitted. Your participation in this
        election is greatly appreciated.
      </p>
      <p className="text-muted-foreground mb-8">
        You have been automatically signed out for security purposes.
      </p>
      <Link href="/">
        <Button>Return to Homepage</Button>
      </Link>
    </div>
  );
}
