import CustomSignIn from "@/app/components/auth/custom-sign-in";
import BackgroundPaths from "@/components/ui/backgound-paths";

export default function SignInPage() {
  return (
    <div className="relative flex items-center justify-center min-h-screen w-full">
      <div className="absolute inset-0 z-0">
        <BackgroundPaths />
      </div>
      <div className="container max-w-md px-4 z-10">
        <CustomSignIn />
      </div>
    </div>
  );
}
