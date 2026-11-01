import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto mt-24 max-w-sm px-4 text-center">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-muted-foreground">
        The page you're looking for doesn't exist.
      </p>
      <Link href="/" className={`${buttonVariants()} mt-6`}>
        Back to my tasks
      </Link>
    </main>
  );
}