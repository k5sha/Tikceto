import { X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SmallPromoBanner() {
  const [visible, setVisible] = useState(true);

  const scrollToTickets = () => {
    const element = document.getElementById("tickets-section");

    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-r from-blue-800 via-blue-700 to-teal-700 text-white rounded-xl p-6 mb-6 overflow-hidden shadow-lg"
          exit={{ opacity: 0, y: -30 }}
          initial={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.4 }}
        >
          <button
            aria-label="Закрити банер"
            className="absolute top-3 right-3 text-gray-300 hover:text-white transition"
            onClick={() => setVisible(false)}
          >
            <X size={20} />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold">
                🎁 Акція: <span className="text-yellow-400">-50%</span> на
                квитки у будні!
              </h2>
              <p className="text-sm text-gray-300 mt-1 max-w-md">
                Тільки до кінця місяця — не проґав шанс побачити улюблені фільми
                дешевше.
              </p>
            </div>

            <button
              className="bg-yellow-400 text-gray-900 font-semibold px-6 py-2 rounded-md shadow-md hover:scale-105 transition-transform duration-300"
              onClick={scrollToTickets}
            >
              Купити квитки
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
