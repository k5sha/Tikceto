import { Button } from "@heroui/button";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

interface SelectedSeatInfoProps {
  selectedSeat: number;
  seats: any[];
  handlePurchase: () => void;
}

const SelectedSeatInfo = ({ selectedSeat, seats, handlePurchase }: SelectedSeatInfoProps) => {
  const selectedSeatData = seats.find((seat) => seat.id === selectedSeat);

  if (!selectedSeatData) return null;

  return (
    <motion.div
      key={selectedSeat}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="mx-auto max-w-md w-full px-4 sm:px-6 lg:px-8 py-6 bg-white rounded-2xl shadow-lg"
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{
        duration: 0.3,
        ease: "easeOut",
      }}
    >
      <h2 className="text-center text-xl sm:text-2xl font-semibold text-gray-800">
        Обрана ціна:
      </h2>
      <p className="text-center text-3xl sm:text-4xl font-bold text-green-600 mt-2">
        {selectedSeatData.price} ₴
      </p>

      <div className="mt-6 flex justify-center">
        <Button
          className="w-full sm:w-auto px-6 py-3 text-base sm:text-lg font-medium rounded-xl shadow-md hover:scale-105 transition-transform"
          color="primary"
          size="lg"
          onPress={handlePurchase}
        >
          <CheckCircle className="mr-2 w-5 h-5" />
          Придбати квиток
        </Button>
      </div>
    </motion.div>
  );
};

export default SelectedSeatInfo;
