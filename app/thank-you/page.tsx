"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { useCustomSignOut } from "@/hooks/use-clerk-auth";
import { useRouter } from "next/navigation";

export default function ThankYouPage() {
  const { handleSignOut } = useCustomSignOut();
  const router = useRouter();

  const handleReturnHome = async () => {
    // Sign out the user
    await handleSignOut();
    // Redirect to home page
    router.push("/");
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Thank You For Voting!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your vote has been recorded successfully. Thank you for
            participating in this election.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={handleReturnHome}>Return to Home</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
