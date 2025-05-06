import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Loader2, Calendar, Clock, QrCode } from "lucide-react"; // Іконки для статусів
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";

import DefaultLayout from "@/layouts/default.tsx";
import { useAuth } from "@/context/authContext.tsx";
import { siteConfig } from "@/config/site.ts";
import { StatusBadge, TicketStatus } from "@/components/ticketStatus.tsx";

const API_URL = "/tickets/my";

interface Movie {
  id: number;
  title: string;
  poster_url: string;
}

interface Room {
  id: number;
  name: string;
}

interface Seat {
  id: number;
  row: number;
  seat_number: number;
}

interface Session {
  id: number;
  start_time: string;
  movie: Movie;
  room: Room;
}

interface Ticket {
  id: number;
  price: number;
  session: Session;
  seat: Seat;
  status: TicketStatus;
  created_at: string;
}

const MyTickets = () => {
  const { fetchWithAuth } = useAuth();
  const [showQRCode, setShowQRCode] = useState<number | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["myTickets"],
    queryFn: async () => {
      const response = await fetchWithAuth<{ data: Ticket[] }>(API_URL);

      if (response == null) {
        return [];
      }

      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (isError || !data || data.length === 0) {
    return (
      <DefaultLayout>
        <div className="flex flex-col justify-center items-center h-3/4 text-center mt-10">
          <p className="text-gray-500 text-lg">У вас поки немає квитків.</p>
          <Link
            className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            to="/"
          >
            Повернутися на головну
          </Link>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto p-4"
        exit={{ opacity: 0, y: -20 }}
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-semibold mb-4">Мої квитки</h1>
        <div className="grid gap-4 md:grid-cols-1 md:gap-6">
          {data.map((ticket, index) => (
            <motion.div
              key={ticket.id}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 border rounded-lg shadow-md flex items-center gap-4 flex-col md:flex-row"
              initial={{ opacity: 0, y: 20 }}
              transition={{
                duration: 0.4,
                delay: index * 0.1,
              }}
            >
              <img
                alt={ticket.session.movie.title}
                className="w-16 h-24 object-cover rounded-md"
                src={ticket.session.movie.poster_url}
              />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-center md:text-left">
                  {ticket.session.movie.title}
                </h2>
                <p className="text-gray-600 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  {new Date(ticket.session.start_time).toLocaleString("uk-UA", {
                    dateStyle: "long",
                    timeStyle: "short",
                  })}
                </p>
                <p className="text-gray-600 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  {ticket.session.room.name}, Ряд {ticket.seat.row}, Місце{" "}
                  {ticket.seat.seat_number}
                </p>
              </div>
              <div className="text-right">
                <span className="text-lg text-center font-semibold">
                  {ticket.price} грн
                </span>
                <div className="mt-2 flex items-center">
                  <StatusBadge status={ticket.status} />
                </div>
                {ticket.status === "confirmed" && (
                  <div className="md:invisible mt-4 flex justify-center">
                    <button
                      className="text-gray-500"
                      onClick={() =>
                        setShowQRCode(
                          showQRCode === ticket.id ? null : ticket.id,
                        )
                      }
                    >
                      <QrCode className="w-8 h-8" />
                    </button>
                  </div>
                )}
              </div>
              {showQRCode === ticket.id && (
                <div className="py-4 text-center">
                  <QRCodeSVG
                    size={256}
                    value={`${siteConfig.server_api}/validate/${ticket.id}`}
                  />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </DefaultLayout>
  );
};

export default MyTickets;
