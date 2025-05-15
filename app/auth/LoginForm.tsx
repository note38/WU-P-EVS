"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, User, UserCheck } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PuffLoader } from "react-spinners";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState("admin"); // Default to admin
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setFormError("Please enter both email and password");
      return;
    }

    setFormError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        userType, // Pass the user type to the authentication handler
        redirect: false,
      });

      if (result?.error) {
        // Handle specific error messages
        if (result.error.includes("active election")) {
          setFormError("Voter login is disabled during active elections");
        } else if (result.error.includes("already cast your vote")) {
          setFormError("You have already cast your vote in this election");
        } else if (result.error.includes("No active election")) {
          setFormError("There is no active election available for voting");
        } else if (result.error.includes("not associated with any election")) {
          setFormError("You are not currently registered for any election");
        } else {
          setFormError(
            "Invalid credentials. Please check your email and password."
          );
        }
        setIsLoading(false);
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

        // Redirect based on user role and type
        if (session.user.userType === "admin") {
          router.push("/admin_dashboard");
        } else if (session.user.userType === "voter") {
          router.push("/ballot");
        } else {
          setFormError("Invalid user type");
        }
      } catch (sessionError) {
        console.error("Session error:", sessionError);
        setFormError("Failed to get user session. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setFormError("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg animate-fadeIn">
      <CardHeader className="space-y-4">
        <div className="flex justify-center mb-2">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <img
              src="/wup-logo.png"
              alt="WUP Logo"
              className="w-16 h-16 text-primary"
            />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-center">
          WU-P EVS
        </CardTitle>
        <CardDescription className="text-center">
          Wesleyan University Philippines - Enhanced Voting System
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="admin" onValueChange={setUserType} className="mb-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <User size={16} />
              Admin
            </TabsTrigger>
            <TabsTrigger value="voter" className="flex items-center gap-2">
              <UserCheck size={16} />
              Voter
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <Button variant="link" className="p-0 h-auto text-xs" type="button">
              Forgot password?
            </Button>
          </div>

          <Button type="submit" className="w-full mt-6" disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <PuffLoader color="#ffffff" size={24} />
                <span>Logging in...</span>
              </div>
            ) : (
              `Sign in as ${userType === "admin" ? "Admin" : "Voter"}`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
