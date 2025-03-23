import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh]">
      <h1 className="text-2xl font-bold mb-4">Election Not Found</h1>
      <p className="text-gray-500 mb-6">
        The election you're looking for doesn't exist or has been removed.
      </p>
      <Button asChild>
        <Link href="/admin/elections">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Elections
        </Link>
      </Button>
    </div>
  );
}
