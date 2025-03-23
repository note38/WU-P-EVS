"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PuffLoader } from "react-spinners";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid credentials");
        return;
      }

      // Refresh the page to update the session
      router.refresh();

      try {
        // Get the updated session to check the user's role
        const response = await fetch("/api/auth/session");
        if (!response.ok) {
          throw new Error("Failed to fetch session");
        }

        const session = await response.json();

        if (!session?.user) {
          throw new Error("No user session found");
        }

        // Redirect based on user role
        switch (session.user.role) {
          case "ADMIN":
            router.push("/admin_dashboard");
            break;
          case "VOTER":
            router.push("/user_dashboard");
            break;
          case "CANDIDATE":
            router.push("/candidate_dashboard");
            break;
          default:
            setError("Invalid user role");
            break;
        }
      } catch (sessionError) {
        console.error("Session error:", sessionError);
        setError("Failed to get user session. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md border border-red-200">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={isLoading}
              className="bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={isLoading}
              className="bg-white"
            />
          </div>
        </CardContent>
        <CardFooter>
          {isLoading ? (
            <div className="w-full flex flex-col items-center justify-center space-y-2">
              <PuffLoader color="#002aff" size={40} />
              <span className="text-gray-600">Logging in...</span>
            </div>
          ) : (
            <Button type="submit" className="w-full">
              Log in
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
