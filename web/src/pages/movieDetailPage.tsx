import { Tooltip } from "@heroui/tooltip";
import { Button } from "@heroui/button";
import { CheckCircle, Edit, LogIn, Plus, Trash, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import { ChangeEvent, useEffect, useState } from "react";

import "react-loading-skeleton/dist/skeleton.css";
import { useDisclosure } from "@heroui/modal";

import DefaultLayout from "@/layouts/default";
import { useAuth } from "@/context/authContext.tsx";
import { siteConfig } from "@/config/site.ts";
import DeleteMovieModal from "@/components/modals/deleteMovieModal.tsx";
import EditMovieModal from "@/components/modals/editMovieModal.tsx";
import AddSessionModal from "@/components/modals/addSessionModal.tsx";
import DeleteSessionModal from "@/components/modals/deleteSessionModal.tsx";

const fetchMovieDetails = async (movieSlug: string | undefined) => {
  if(!movieSlug) {
    return;
  }
  try {
    const { data } = await axios.get(
      `${siteConfig.server_api}/movies/${movieSlug}`,
    );

    return data.data;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    throw error;
  }
};

const fetchSessions = async (movieSlug: string | undefined) => {
  if (!movieSlug) {
    return;
  }
  try {
    const { data } = await axios.get(
      `${siteConfig.server_api}/sessions/movie/${movieSlug}`,
    );

    return data.data;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    throw error;
  }
};

const fetchSeats = async (sessionId: number) => {
  try {
    const { data } = await axios.get(
      `${siteConfig.server_api}/seats/session/${sessionId}`,
    );

    return data.data;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    throw error;
  }
};

const createPayment = async (
  sessionId: number,
  seatId: number,
  fetchWithAuth: any,
) => {
  try {
    const data = await fetchWithAuth("/payments/create", {
      method: "POST",
      body: JSON.stringify({
        session_id: sessionId,
        seat_id: seatId,
      }),
    });

    return data.data;
  } catch (error) {
    throw error;
  }
};

export default function MovieDetailPage() {
  const { movieSlug } = useParams<{ movieSlug: string }>();
  const navigate = useNavigate();
  const { user, fetchWithAuth, isAdmin } = useAuth();

  const { isOpen: isEditModalOpen, onOpenChange: onOpenEditModal } =
    useDisclosure();
  const { isOpen: isDeleteModalOpen, onOpenChange: onOpenDeleteModal } =
    useDisclosure();
  const { isOpen: isAddSessionModalOpen, onOpenChange: onOpenAddSessionModal } =
    useDisclosure();
  const {
    isOpen: isDeleteSessionModalOpen,
    onOpenChange: onOpenSessionDeleteModal,
  } = useDisclosure();

  const {
    data: movie,
    isLoading: movieLoading,
    isError: movieError,
    error: movieErrorDetail,
    refetch: movieRefetch,
  } = useQuery({
    queryKey: ["movie", movieSlug],
    queryFn: () => fetchMovieDetails(movieSlug),
  });

  const {
    data: sessions,
    isError: sessionsError,
    error: sessionsErrorDetail,
    refetch: sessionsRefetch,
  } = useQuery({
    queryKey: ["sessions", movieSlug],
    queryFn: () => fetchSessions(movie.id),
    enabled: !movieLoading && movie != null && movie.id != null,
  });

  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);

  const {
    data: seats,
    isError: seatsError,
    error: seatsErrorDetail,
  } = useQuery({
    queryKey: ["seats", selectedSession],
    queryFn: () => fetchSeats(Number(selectedSession)),
    enabled: !!selectedSession,
  });

  const sessionsArray = Array.isArray(sessions) ? sessions : [];

  useEffect(() => {
    if (sessionsArray && sessionsArray.length > 0) {
      setSelectedSession(sessionsArray[0].id);
    }
  }, [sessionsArray]);

  const handleSessionSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    const sessionId = Number(e.target.value);

    if (sessionId !== selectedSession) {
      setSelectedSession(sessionId);
    }
  };

  const handleSeatSelect = (seatId: number) => {
    setSelectedSeat(seatId);
  };

  const handlePurchase = async () => {
    if (!user) {
      alert("Ви повинні бути зареєстровані для покупки квитка.");

      return;
    }

    if (!selectedSeat || !selectedSession) {
      alert("Будь ласка, виберіть місце для покупки.");

      return;
    }

    try {
      const paymentData = await createPayment(
        selectedSession,
        selectedSeat,
        fetchWithAuth,
      );

      window.location.href = paymentData.url; // Перенаправляємо на LiqPay для оплати
    } catch (error) {
      alert("Сталася помилка при створенні платежу.");
    }
  };

  const getPriceColor = (price: number) => {
    if (price <= 100) return "bg-green-400";
    if (price <= 200) return "bg-yellow-400";

    return "bg-red-200";
  };

  if (movieLoading) {
    return (
      <DefaultLayout>
        <div className="flex justify-center items-center h-screen">
          <Skeleton height={1200} width={720} />
        </div>
      </DefaultLayout>
    );
  }

  if (movieError || sessionsError || seatsError) {
    const errorMessage =
      movieErrorDetail?.message ||
      sessionsErrorDetail?.message ||
      seatsErrorDetail?.message ||
      "Щось пішло не так, спробуйте ще раз.";

    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-screen flex-col">
          <p className="text-lg text-red-600">{errorMessage}</p>
          <Button
            className="mt-4"
            color="primary"
            onPress={() => navigate(`/movie/${movieSlug}`)}
          >
            Спробувати ще раз
          </Button>
        </div>
      </DefaultLayout>
    );
  }

  if (movie == null) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-3/4 flex-col">
          <p className="text-lg text-primary-600">
            Схоже це застаріла сторінка
          </p>
        </div>
      </DefaultLayout>
    );
  }

  const rows = seats
    ? seats.reduce((acc: any, seat: any) => {
        if (!acc[seat.row]) acc[seat.row] = [];
        acc[seat.row].push(seat);

        return acc;
      }, {})
    : {};

  return (
    <DefaultLayout>
      <div className="w-full px-6 py-8 space-y-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 ">
            <div className="w-full md:w-1/3 flex flex-col items-center">
              <img
                alt={movie.title}
                className="w-full md:w-auto h-96 object-cover rounded-lg shadow-md"
                src={movie.poster_url || "/path/to/fallback-image.jpg"}
              />
            </div>

            <div className="w-full md:w-2/3 space-y-4">
              <h1 className="text-3xl font-bold text-gray-900">
                {movie.title}
              </h1>
              <p className="text-gray-500 text-lg">
                {new Date(movie.release_date).toLocaleDateString("uk-UA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="text-gray-700">{movie.description}</p>
              <div className="flex gap-4">
                <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm">
                  <strong>Тривалість:</strong> {movie.duration} хв
                </div>
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm">
                  <strong>Жанр:</strong> {movie.genre || "Не вказано"}
                </div>
              </div>
            </div>
          </div>
        </div>
        {isAdmin && (
          <>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <Button
                color="secondary"
                startContent={<Plus />}
                variant="bordered"
                onPress={onOpenAddSessionModal}
              >
                Додати сесію
              </Button>
              <Button
                color="warning"
                startContent={<Edit />}
                variant="bordered"
                onPress={onOpenEditModal}
              >
                Редагувати фільм
              </Button>
              <Button
                color="danger"
                startContent={<Trash />}
                variant="bordered"
                onPress={onOpenDeleteModal}
              >
                Видалити фільм
              </Button>
              <Button
                color="danger"
                disabled={!(selectedSession && selectedSession > 0)}
                startContent={<Trash />}
                variant="bordered"
                onPress={onOpenSessionDeleteModal}
              >
                Видалити сеанс
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="md:w-2/3 ml-6">
        <h2 className="text-2xl font-semibold">Сеанси:</h2>
        <select
          className="w-full p-3 border rounded-md bg-white mt-2"
          value={selectedSession || ""}
          onChange={handleSessionSelect}
        >
          <option value="">Виберіть сеанс</option>
          {sessionsArray?.map((session: any) => (
            <option key={session.id} value={session.id}>
              {new Date(session.start_time).toLocaleString()} -{" "}
              {session.room.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-gray-900 text-white p-6 mt-6">
        <h2 className="text-center text-3xl font-bold">Оберіть місце</h2>
        <div className="flex justify-center mt-6">
          <div className="bg-gray-800 p-4 rounded-lg inline-block">
            {Object.keys(rows).map((rowKey) => (
              <div key={rowKey} className="flex justify-center gap-x-2 mt-2">
                {rows[rowKey].map((seat: any) => (
                  <Tooltip
                    key={seat.id}
                    content={
                      <div className="px-1 py-2">
                        <div className="text-tiny ">
                          {seat.row} ряд, {seat.seat_number} місце
                        </div>
                        { seat.status != "reserved" ?
                            (<div className="text-small font-bold text-center">
                          {seat.price} ₴
                        </div>)
                            : (
                                <div className="text-small font-bold text-center">
                                  Зарезервовано
                                </div>
                            )
                        }
                      </div>
                    }
                  >
                    <button
                      className={`w-12 h-12 flex items-center justify-center rounded-md ${
                        seat.status === "reserved"
                          ? "bg-gray-600 cursor-not-allowed"
                          : selectedSeat === seat.id
                            ? "bg-blue-500 border-4 border-white"
                            : getPriceColor(seat.price)
                      }`}
                      disabled={seat.status === "reserved"}
                      onClick={() => handleSeatSelect(seat.id)}
                    >
                      <Users />
                    </button>
                  </Tooltip>
                ))}
              </div>
            ))}
          </div>
        </div>

        {user ? (
          selectedSeat && (
            <div className="flex justify-center mt-6">
              <Button color="primary" size="lg" onPress={handlePurchase}>
                <CheckCircle className="mr-2" /> Придбати квиток
              </Button>
            </div>
          )
        ) : (
          <div className="flex justify-center mt-6">
            <Button
              color="secondary"
              size="lg"
              onPress={() => navigate("/login")}
            >
              <LogIn className="mr-2" /> Увійти для покупки
            </Button>
          </div>
        )}
      </div>

      <DeleteMovieModal
        isOpen={isDeleteModalOpen}
        movieId={movie.id}
        navigate={navigate}
        onOpenChange={onOpenDeleteModal}
      />
      <EditMovieModal
        isOpen={isEditModalOpen}
        movie={movie}
        refetch={movieRefetch}
        navigate={navigate}
        onOpenChange={onOpenEditModal}
      />
      <AddSessionModal
        isOpen={isAddSessionModalOpen}
        movieId={movie.id}
        refetch={sessionsRefetch}
        onOpenChange={onOpenAddSessionModal}
      />
      <DeleteSessionModal
        isOpen={isDeleteSessionModalOpen}
        refetch={sessionsRefetch}
        sessionId={selectedSession || 0}
        onOpenChange={onOpenSessionDeleteModal}
      />
    </DefaultLayout>
  );
}
