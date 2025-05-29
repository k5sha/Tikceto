import { Navbar } from "@/components/Navbar";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col h-screen">
      <Navbar />
      <main className="container mx-auto max-w-7xl px-6 flex-grow pt-12">
        {children}
      </main>
      <footer className="w-full flex flex-col items-center justify-center py-6 text-gray-400 text-sm select-none border-t border-gray-100 bg-white">
        <p className="text-sm sm:text-base font-light">
          Created with <span className="text-red-500">♥</span> by Yurii
          Yevtushenko
        </p>
        <p className="mt-1 text-xs sm:text-sm text-gray-400">
          &copy; {new Date().getFullYear()} All rights reserved.
        </p>
      </footer>
    </div>
  );
}
