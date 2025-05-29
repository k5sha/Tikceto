import { motion } from "framer-motion";
import SeatTooltipButton from "./SeatTooltipButton";

interface SeatRowProps {
  rowKey: string;
  seatsInRow: any[];
  selectedSeat: number | null;
  handleSeatSelect: (id: number) => void;
  isAdmin: boolean;
  onOpenEditTicketModal: () => void;
  setSelectedTicket: React.Dispatch<React.SetStateAction<any>>;
  selectedSession: number | null;
  getPriceColor: (price: number) => string;
}

const SeatRow = ({
  rowKey,
  seatsInRow,
  selectedSeat,
  handleSeatSelect,
  isAdmin,
  onOpenEditTicketModal,
  setSelectedTicket,
  selectedSession,
  getPriceColor,
}: SeatRowProps) => {
  return (
    <motion.div
      key={rowKey}
      className="flex justify-center gap-x-2 mt-2"
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.05 }}
    >
      {seatsInRow.map((seat) => (
        <SeatTooltipButton
          key={seat.id}
          seat={seat}
          selectedSeat={selectedSeat}
          handleSeatSelect={handleSeatSelect}
          isAdmin={isAdmin}
          onOpenEditTicketModal={onOpenEditTicketModal}
          setSelectedTicket={setSelectedTicket}
          selectedSession={selectedSession}
          getPriceColor={getPriceColor}
        />
      ))}
    </motion.div>
  );
};

export default SeatRow;
