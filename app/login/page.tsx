import LoginForm from "@/app/auth/LoginForm";
import BackgroundPaths from "@/components/ui/backgound-paths";

export default function LoginPage() {
  return (
    <div className="relative flex items-center justify-center min-h-screen w-full">
      <div className="absolute inset-0 z-0">
        <BackgroundPaths />
      </div>
      <div className="container max-w-md px-4 z-10">
        <LoginForm />
      </div>
    </div>
  );
}
