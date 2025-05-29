import SeatRow from "./SeatRow";

interface SeatMapProps {
  rows: Record<string, any[]>;
  selectedSeat: number | null;
  handleSeatSelect: (id: number) => void;
  isAdmin: boolean;
  onOpenEditTicketModal: () => void;
  setSelectedTicket: React.Dispatch<React.SetStateAction<any>>;
  selectedSession: number | null;
  getPriceColor: (price: number) => string;
}

const SeatMap = ({
  rows,
  selectedSeat,
  handleSeatSelect,
  isAdmin,
  onOpenEditTicketModal,
  setSelectedTicket,
  selectedSession,
  getPriceColor,
}: SeatMapProps) => {
  return (
    <div className="relative mt-6">
      <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-gray-900 to-transparent pointer-events-none z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-gray-900 to-transparent pointer-events-none z-10" />

      <div className="overflow-x-auto flex px-2">
        <div className="inline-block bg-gray-800 p-4 rounded-lg shadow-xl min-w-max mx-auto">
          {Object.keys(rows).map((rowKey) => (
            <SeatRow
              key={rowKey}
              rowKey={rowKey}
              seatsInRow={rows[rowKey]}
              selectedSeat={selectedSeat}
              handleSeatSelect={handleSeatSelect}
              isAdmin={isAdmin}
              onOpenEditTicketModal={onOpenEditTicketModal}
              setSelectedTicket={setSelectedTicket}
              selectedSession={selectedSession}
              getPriceColor={getPriceColor}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SeatMap;
