import { Tooltip } from "@heroui/tooltip";
import { Button } from "@heroui/button";
import { CheckCircle, Edit, LogIn, Plus, Trash, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import { ChangeEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import "react-loading-skeleton/dist/skeleton.css";
import { useDisclosure } from "@heroui/modal";

import DefaultLayout from "@/layouts/default";
import { useAuth } from "@/context/authContext.tsx";
import { siteConfig } from "@/config/site.ts";
import DeleteMovieModal from "@/components/modals/deleteMovieModal.tsx";
import EditMovieModal from "@/components/modals/editMovieModal.tsx";
import AddSessionModal from "@/components/modals/addSessionModal.tsx";
import DeleteSessionModal from "@/components/modals/deleteSessionModal.tsx";
import EditTicketModal from "@/components/modals/editTicketModal.tsx";

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
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<{ seatId: number; sessionId: number } | null>(null);

  const { isOpen: isEditTicketModalOpen, onOpenChange: onOpenEditTicketModal } = useDisclosure();
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
    isLoading: isSessionsLoading,
    isError: sessionsError,
    error: sessionsErrorDetail,
    refetch: sessionsRefetch,
  } = useQuery({
    queryKey: ["sessions", movieSlug],
    queryFn: () => fetchSessions(movie.id),
    enabled: !movieLoading && movie != null && movie.id != null,
  });

  const {
    data: seats,
    isLoading: isSeatsLoading,
    isError: seatsError,
    error: seatsErrorDetail,
      refetch: seatRefetch,
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
    if (!selectedSession || !selectedSeat) return;
    try {
      const {url}  = await createPayment(selectedSession, selectedSeat, fetchWithAuth);
      window.location.href = url;
    } catch (err) {
      toast.error("Помилка при створенні платежу");
    }
  };

  const getPriceColor = (price: number) => {
    if (price <= 100) return "bg-green-400";
    if (price <= 200) return "bg-yellow-400";

    return "bg-red-400";
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

  // @ts-ignore
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
                      startContent={<Plus/>}
                      variant="bordered"
                      onPress={onOpenAddSessionModal}
                  >
                    Додати сеанс
                  </Button>
                  <Button
                      color="warning"
                      startContent={<Edit/>}
                      variant="bordered"
                      onPress={onOpenEditModal}
                  >
                    Редагувати фільм
                  </Button>
                  <Button
                      color="danger"
                      startContent={<Trash/>}
                      variant="bordered"
                      onPress={onOpenDeleteModal}
                  >
                    Видалити фільм
                  </Button>
                  <Button
                      color="danger"
                      disabled={!(selectedSession && selectedSession > 0)}
                      startContent={<Trash/>}
                      variant="bordered"
                      onPress={onOpenSessionDeleteModal}
                  >
                    Видалити сеанс
                  </Button>
                </div>
              </>
          )}
        </div>

        <div>
          <label htmlFor="session-select" className="block mb-1 text-white">
            Оберіть сеанс:
          </label>
          <select
              id="session-select"
              value={selectedSession ?? ""}
              onChange={
                  handleSessionSelect
              }
              className="w-full px-4 py-2 rounded-lg border bg-white text-black"
          >
            <option value="">-- Виберіть сеанс --</option>
            {isSessionsLoading ? (
                <option disabled>Завантаження сеансів...</option>
            ) : sessionsError ? (
                <option disabled>Помилка при завантаженні</option>
            ) : sessionsArray.length === 0 ? (
                <option disabled>Немає доступних сеансів</option>
            ) : (
                sessionsArray.map((session: any) => (
                    <option key={session.id} value={session.id}>
                      {new Date(session.start_time).toLocaleString()} -{" "}
                      {session.room.name}
                    </option>
                ))
            )}
          </select>
        </div>

        {isSeatsLoading && selectedSession ? (
            <div className="text-center text-white">Завантаження місць...</div>
        ) : seatsError ? (
            <div className="text-red-500">Не вдалося завантажити місця.</div>
        ) : seats && selectedSession && (
        <div className="bg-gray-900 text-white p-6 mt-6 rounded-lg shadow-lg">
          <h2 className="text-center text-3xl font-bold">Оберіть місце</h2>

          <div className="mt-8 mb-4 flex justify-center">
            <div
                className="w-full max-w-md h-8 bg-gray-300 rounded-b-full shadow-inner flex items-center justify-center text-gray-900 font-semibold text-sm">
              ЕКРАН
            </div>
          </div>


          <div className="relative mt-6">
            <div
                className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-gray-900 to-transparent pointer-events-none z-10"/>
            <div
                className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-gray-900 to-transparent pointer-events-none z-10"/>

            <div className="overflow-x-auto flex px-2">
              <div className="inline-block bg-gray-800 p-4 rounded-lg shadow-xl min-w-max mx-auto">
                {Object.keys(rows).map((rowKey) => (
                    <div key={rowKey} className="flex justify-center gap-x-2 mt-2">
                      {rows[rowKey].map((seat: any) => (
                          <Tooltip
                              key={seat.id}
                              content={
                                <div className="px-1 py-2">
                                  <div className="text-tiny">
                                    {seat.row} ряд, {seat.seat_number} місце
                                  </div>
                                  {seat.status !== "reserved" ? (
                                      <div className="text-small font-bold text-center">
                                        {seat.price} ₴
                                      </div>
                                  ) : (
                                      <div className="text-small font-bold text-center">
                                        Зарезервовано
                                      </div>
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
                                  handleSeatSelect(seat.id);
                                  if (isAdmin && seat.status === "reserved") {
                                    setSelectedTicket({ seatId: seat.id, sessionId: selectedSession || 0 });
                                    onOpenEditTicketModal();
                                  }
                                }}
                            >
                              <Users/>
                            </button>
                          </Tooltip>
                      ))}
                    </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-6 my-4 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gray-600 rounded"/>
              Зарезервовано
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 border-2 border-white rounded"/>
              Обране
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-green-400 rounded"/>
              {"<"} 100 грн
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-yellow-400 rounded"/>
              {"<"} 200 грн
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-red-400 rounded"/>
              vip-місця
            </div>
          </div>

          {user ? (
              selectedSeat && !isSeatsLoading && (
                  <div className="mx-auto max-w-md w-full px-4 sm:px-6 lg:px-8 py-6 bg-white rounded-2xl shadow-lg">
                    <h2 className="text-center text-xl sm:text-2xl font-semibold text-gray-800">
                      Обрана ціна:
                    </h2>
                    <p className="text-center text-3xl sm:text-4xl font-bold text-green-600 mt-2">
                      {seats.find( (item: { id: number; }) => item.id === selectedSeat).price}₴
                    </p>

                    <div className="mt-6 flex justify-center">
                      <Button
                          color="primary"
                          size="lg"
                          className="w-full sm:w-auto px-6 py-3 text-base sm:text-lg font-medium rounded-xl shadow-md hover:scale-105 transition-transform"
                          onPress={handlePurchase}
                      >
                        <CheckCircle className="mr-2 w-5 h-5"/>
                        Придбати квиток
                      </Button>
                    </div>
                  </div>
              )
          ) : (
              <div className="mx-auto max-w-md w-full px-4 sm:px-6 lg:px-8 mt-6">
                <div className="bg-white rounded-2xl shadow-lg py-6 px-4 text-center">
                  <p className="text-gray-700 text-lg mb-4">
                    Увійдіть, щоб придбати квиток
                  </p>
                  <Button
                      color="secondary"
                      size="lg"
                      className="w-full sm:w-auto px-6 py-3 text-base sm:text-lg font-medium rounded-xl shadow-md hover:scale-105 transition-transform"
                      onPress={() => navigate("/login")}
                  >
                    <LogIn className="mr-2 w-5 h-5"/>
                    Увійти
                  </Button>
                </div>
              </div>
          )}
        </div>
            )}

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
        <EditTicketModal
            isOpen={isEditTicketModalOpen}
            sessionId={selectedTicket?.sessionId || 0}
            seatId={selectedTicket?.seatId || 0}
            refetch={seatRefetch}
            onOpenChange={onOpenEditTicketModal}
        />

      </DefaultLayout>
  );
}
