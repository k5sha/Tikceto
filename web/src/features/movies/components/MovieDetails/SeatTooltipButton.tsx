import { Tooltip } from "@heroui/react";
import { Users } from "lucide-react";


interface SeatTooltipButtonProps {
  seat: any;
  selectedSeat: number | null;
  handleSeatSelect: (id: number) => void;
  isAdmin: boolean;
  onOpenEditTicketModal: () => void;
  setSelectedTicket: React.Dispatch<React.SetStateAction<any>>;
  selectedSession: number | null;
  getPriceColor: (price: number) => string;
}

const SeatTooltipButton = ({
  seat,
  selectedSeat,
  handleSeatSelect,
  isAdmin,
  onOpenEditTicketModal,
  setSelectedTicket,
  selectedSession,
  getPriceColor,
}: SeatTooltipButtonProps) => {
  return (
    <Tooltip
      key={seat.id}
      content={
        <div className="px-1 py-2">
          <div className="text-tiny">
            {seat.row} ряд, {seat.seat_number} місце
          </div>
          {seat.status !== "reserved" ? (
            <div className="text-small font-bold text-center">{seat.price} ₴</div>
          ) : (
            <div className="text-small font-bold text-center">Зарезервовано</div>
          )}
        </div>
      }
    >
      <button
        className={`transition-all duration-300 transform w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-md ${
          seat.status === "reserved"
            ? "bg-gray-600 cursor-not-allowed"
            : selectedSeat === seat.id
            ? "bg-blue-500 border-4 border-white scale-110"
            : getPriceColor(seat.price)
        }`}
        disabled={seat.status === "reserved" && !isAdmin}
        onClick={() => {
          if (isAdmin && seat.status === "reserved") {
            setSelectedTicket({
              seatId: seat.id,
              sessionId: selectedSession || 0,
            });
            onOpenEditTicketModal();
            return
          }
          handleSeatSelect(seat.id);
        }}
      >
        <Users />
      </button>
    </Tooltip>
  );
};

export default SeatTooltipButton;
