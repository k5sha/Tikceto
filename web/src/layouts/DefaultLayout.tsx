import Navbar from "../components/Navbar.tsx";
import Footer from "../components/Footer.tsx";
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
      <Footer />
    </div>
  );
}
