import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { ChangeEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import "react-loading-skeleton/dist/skeleton.css";
import { useDisclosure } from "@heroui/modal";
import { AnimatePresence, motion } from "framer-motion";

import AdminControls from "../components/MovieDetails/AdminControls";
import LegendOfMap from "../components/MovieDetails/LegendOfMap";
import LoginPrompt from "../components/MovieDetails/LoginPrompt";
import { MovieDetails } from "../components/MovieDetails/MovieInfo";
import SeatMap from "../components/MovieDetails/SeatMap";
import SelectedSeatInfo from "../components/MovieDetails/SelectedSeatInfo";
import { SessionSelect } from "../components/MovieDetails/SessionSelect";
import MovieSkeleton from "../components/MovieDetails/MovieSkeleton";
import MovieError from "../components/MovieDetails/MovieError";

import DefaultLayout from "@/layouts/DefaultLayout";
import { useAuth } from "@/context/authContext.tsx";
import DeleteMovieModal from "@/features/movies/components/modals/DeleteMovieModal";
import EditMovieModal from "@/features/movies/components/modals/EditMovieModal";
import AddSessionModal from "@/features/movies/components/modals/AddSessionModal";
import DeleteSessionModal from "@/features/movies/components/modals/DeleteSessionModal";
import EditTicketModal from "@/features/movies/components/modals/EditTicketModal";
import NotFoundPage from "@/features/notFound/pages/NotFoundPage";
import { createPayment, fetchMovieDetails, fetchSeats, fetchSessions } from "../api/movies";

export default function MovieDetailPage() {
  const { movieSlug } = useParams<{ movieSlug: string }>();
  const navigate = useNavigate();
  const { user, fetchWithAuth, isAdmin } = useAuth();
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<{
    seatId: number;
    sessionId: number;
  } | null>(null);

  const { isOpen: isEditTicketModalOpen, onOpenChange: onOpenEditTicketModal } =
    useDisclosure();
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
    const sessionId = Number(e.target.value);

    if (sessionId !== selectedSession) {
      setSelectedSeat(null);
      setSelectedSession(sessionId);
    }
  };

  const handleSeatSelect = (seatId: number) => {
    setSelectedSeat(seatId);
  };

  const handlePurchase = async () => {
    if (!selectedSession || !selectedSeat) return;
    try {
      const { url } = await createPayment(
        selectedSession,
        selectedSeat,
        fetchWithAuth,
      );

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
    return <MovieSkeleton />;
  }

  if (movieError || sessionsError || seatsError) {
    const errorMessage =
      movieErrorDetail?.message ||
      sessionsErrorDetail?.message ||
      seatsErrorDetail?.message ||
      "Щось пішло не так, спробуйте ще раз.";

    return (
      <MovieError
        errorMessage={errorMessage}
        movieSlug={movieSlug}
        navigate={navigate}
      />
    );
  }

  if (movie == null) {
    return <NotFoundPage />;
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
        <MovieDetails movie={movie} />
        {isAdmin && (
          <AdminControls
            selectedSession={selectedSession}
            onOpenAddSessionModal={onOpenAddSessionModal}
            onOpenDeleteModal={onOpenDeleteModal}
            onOpenEditModal={onOpenEditModal}
            onOpenSessionDeleteModal={onOpenSessionDeleteModal}
          />
        )}
      </div>

      <SessionSelect
        handleSessionSelect={handleSessionSelect}
        isSessionsLoading={isSessionsLoading}
        selectedSession={selectedSession}
        sessionsArray={sessionsArray}
        sessionsError={sessionsError}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedSession}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="bg-gray-900 text-white p-6 mt-6 rounded-lg shadow-lg transform"
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{
            delay: 0.1,
            duration: 0.3,
            ease: "easeOut",
          }}
        >
          <h2 className="text-center text-3xl font-bold mb-4">Оберіть місце</h2>

          {isSeatsLoading ? (
            <div className="text-center text-gray-400 animate-pulse">
              Завантаження місць...
            </div>
          ) : seatsError ? (
            <div className="text-red-500">Не вдалося завантажити місця.</div>
          ) : seats && selectedSession ? (
            <>
              <div className="mt-8 mb-4 flex justify-center">
                <div className="w-full max-w-md h-8 bg-gray-300 rounded-b-full shadow-inner flex items-center justify-center text-gray-900 font-semibold text-sm">
                  ЕКРАН
                </div>
              </div>

              <SeatMap
                getPriceColor={getPriceColor}
                handleSeatSelect={handleSeatSelect}
                isAdmin={isAdmin}
                rows={rows}
                selectedSeat={selectedSeat}
                selectedSession={selectedSession}
                setSelectedTicket={setSelectedTicket}
                onOpenEditTicketModal={onOpenEditTicketModal}
              />

              <div className="flex justify-center gap-6 my-4 text-sm flex-wrap">
                <LegendOfMap />
              </div>

              {user ? (
                selectedSeat && !isSeatsLoading ? (
                  <SelectedSeatInfo
                    handlePurchase={handlePurchase}
                    seats={seats}
                    selectedSeat={selectedSeat}
                  />
                ) : null
              ) : (
                <LoginPrompt />
              )}
            </>
          ) : (
            <div className="text-center text-gray-400">
              Оберіть сеанс, щоб переглянути місця.
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <DeleteMovieModal
        isOpen={isDeleteModalOpen}
        movieId={movie.id}
        navigate={navigate}
        onOpenChange={onOpenDeleteModal}
      />
      <EditMovieModal
        isOpen={isEditModalOpen}
        movie={movie}
        navigate={navigate}
        refetch={movieRefetch}
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
        refetch={seatRefetch}
        seatId={selectedTicket?.seatId || 0}
        sessionId={selectedTicket?.sessionId || 0}
        onOpenChange={onOpenEditTicketModal}
      />
    </DefaultLayout>
  );
}
