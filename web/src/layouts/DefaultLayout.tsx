import { Navbar } from "@/components/navbar.tsx";

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
      <footer className="w-full flex items-center justify-center pt-16 pb-4">
        Created by Yurii Yevtushenko
      </footer>
    </div>
  );
}
