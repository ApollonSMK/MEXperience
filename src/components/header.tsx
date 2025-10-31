import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mountain } from "lucide-react";

export function Header() {
  return (
    <header className="px-4 lg:px-6 h-14 flex items-center bg-background">
      <div className="grid grid-cols-3 items-center w-full">
        <Link
          href="#"
          className="flex items-center justify-start"
          prefetch={false}
        >
          <Mountain className="h-6 w-6" />
          <span className="sr-only">Template Genesis</span>
        </Link>
        <nav className="hidden lg:flex gap-4 sm:gap-6 justify-self-center">
          <Link
            href="#"
            className="text-sm font-medium hover:underline underline-offset-4"
            prefetch={false}
          >
            Features
          </Link>
          <Link
            href="#"
            className="text-sm font-medium hover:underline underline-offset-4"
            prefetch={false}
          >
            Pricing
          </Link>
          <Link
            href="#"
            className="text-sm font-medium hover:underline underline-offset-4"
            prefetch={false}
          >
            About
          </Link>
          <Link
            href="#"
            className="text-sm font-medium hover:underline underline-offset-4"
            prefetch={false}
          >
            Contact
          </Link>
        </nav>
        <div className="flex items-center justify-self-end">
          <Button>Login</Button>
        </div>
      </div>
    </header>
  );
}
