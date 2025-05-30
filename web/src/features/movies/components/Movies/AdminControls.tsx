import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { Film, MapPlus, ShieldCheck, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface AdminControlsProps {
  onOpenAddMovie: () => void;
  onOpenAddRoom: () => void;
}

export default function AdminControls({
  onOpenAddMovie,
  onOpenAddRoom,
}: AdminControlsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl mb-10 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-6 py-4 text-left hover:bg-zinc-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-blue-600" size={22} />
          <h2 className="text-lg font-semibold text-gray-800">Адмін панель</h2>
        </div>
        <ChevronDown
          size={20}
          className={`text-gray-600 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="admin-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <Divider className="my-0" />
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  color="primary"
                  onPress={onOpenAddMovie}
                  className="w-full justify-center gap-2"
                >
                  <Film />
                  Додати фільм
                </Button>
                <Button
                  color="primary"
                  onPress={onOpenAddRoom}
                  className="w-full justify-center gap-2"
                >
                  <MapPlus />
                  Додати зал
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
