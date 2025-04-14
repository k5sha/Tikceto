import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Loader2,
  Calendar,
  Clock,
  QrCode,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BadgeEuro,
  Loader,
  HelpCircle,
} from "lucide-react"; // Іконки для статусів
import DefaultLayout from "@/layouts/default.tsx";
import { useAuth } from "@/context/authContext.tsx";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { siteConfig } from "@/config/site.ts";

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
  status: string;
  created_at: string;
}

const statusIcons: { [key: string]: JSX.Element } = {
  confirmed: <CheckCircle2 className="w-5 h-5 text-green-600" />,
  pending: <Loader className="w-5 h-5 text-indigo-500 animate-spin" />,
  failed: <XCircle className="w-5 h-5  text-red-600" />,
  reserved: <AlertCircle className="w-5 h-5 text-blue-600" />,
  available: <CheckCircle2 className="w-5 h-5  text-gray-500" />,
  unknown: <HelpCircle className="w-5 h-5 text-gray-800" />,
  refunded: <BadgeEuro className="w-5 h-5 text-teal-600" />,
  cancelled: <XCircle className="w-5 h-5  text-gray-600" />,
};

const statusLabels: { [key: string]: string } = {
  confirmed: "Підтверджено",
  pending: "Обробляється",
  failed: "Помилка оплати",
  reserved: "Зарезервовано",
  available: "Доступний",
  unknown: "Невідомо",
  refunded: "Відшкодовано",
  cancelled: "Скасовано",
};

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
        <div className="max-w-4xl mx-auto p-4">
          <h1 className="text-2xl font-semibold mb-4">Мої квитки</h1>
          <div className="grid gap-4 md:grid-cols-1 md:gap-6">
            {data.map((ticket) => (
                <div
                    key={ticket.id}
                    className="p-4 border rounded-lg shadow-md flex items-center gap-4 flex-col md:flex-row"
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
                      <div
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                              ticket.status === "confirmed"
                                  ? "bg-green-100 text-green-800"
                                  : ticket.status === "pending"
                                      ? "bg-indigo-100 text-indigo-800"
                                      : ticket.status === "failed"
                                          ? "bg-red-100 text-red-800"
                                          : ticket.status === "reserved"
                                              ? "bg-blue-100 text-blue-800"
                                              : ticket.status === "available"
                                                  ? "bg-gray-100 text-gray-800"
                                                      : ticket.status === "refunded"
                                                          ? "bg-teal-100 text-teal-800"
                                                          : ticket.status === "cancelled"
                                                              ? "bg-gray-200 text-gray-800"
                                                              : "bg-gray-100 text-gray-800"
                          }`}
                      >
                        {statusIcons[ticket.status] ?? statusIcons.unknown}
                        {statusLabels[ticket.status] || statusLabels.unknown}
                      </div>
                    </div>
                    {ticket.status === "confirmed" && (
                        <div className="md:invisible mt-4 flex justify-center">
                          <button
                              className="text-gray-500"
                              onClick={() =>
                                  setShowQRCode(showQRCode === ticket.id ? null : ticket.id)
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
                            value={`${siteConfig.server_api}/validate/${ticket.id}`}
                            size={256}
                        />
                      </div>
                  )}
                </div>
            ))}
          </div>
        </div>
      </DefaultLayout>
  );
};

export default MyTickets;
