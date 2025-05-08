import { Link } from "@heroui/link";
import { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <motion.div
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.6 }}
      >
        <Link className="" href="/">
          <ChevronLeft size={32} />
        </Link>
        <div className="text-center py-4">
          <Link className="font-bold text-3xl text-inherit" href="/">
            Ticketo
          </Link>
        </div>
        {children}
      </motion.div>
    </div>
  );
}
