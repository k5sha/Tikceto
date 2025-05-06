import { Link } from "@heroui/link";
import { ReactNode } from "react";
import { ChevronLeft } from 'lucide-react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
      <Link className="" href="/">
        <ChevronLeft size={32}/>
      </Link>
        <div className="text-center py-4">
          <Link className="font-bold text-3xl text-inherit" href="/">
            Ticketo
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
