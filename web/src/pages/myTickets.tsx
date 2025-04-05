import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Loader2, Calendar, Clock } from "lucide-react";

import DefaultLayout from "@/layouts/default.tsx";
import { useAuth } from "@/context/authContext.tsx";

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
  created_at: string;
}

const MyTickets = () => {
  const { fetchWithAuth } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["myTickets"],
    queryFn: async () => {
      const response = await fetchWithAuth<{ data: Ticket[] }>(API_URL);

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
      <div className="text-center mt-10">
        <p className="text-gray-500 text-lg">У вас поки немає квитків.</p>
        <Link
          className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          to="/"
        >
          Повернутися на головну
        </Link>
      </div>
    );
  }

  return (
    <DefaultLayout>
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-4">Мої квитки</h1>
        <div className="grid gap-4">
          {data.map((ticket) => (
            <div
              key={ticket.id}
              className="p-4 border rounded-lg shadow-md flex items-center gap-4"
            >
              <img
                alt={ticket.session.movie.title}
                className="w-16 h-24 object-cover rounded-md"
                src={ticket.session.movie.poster_url}
              />
              <div className="flex-1">
                <h2 className="text-lg font-semibold">
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
                <span className="text-lg font-semibold">
                  {ticket.price} грн
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DefaultLayout>
  );
};

export default MyTickets;
