import { useDisclosure } from "@heroui/modal";
import { useQuery } from "@tanstack/react-query";
import "react-loading-skeleton/dist/skeleton.css";

import { motion } from "framer-motion";

import AdminControls from "../components/Movies/AdminControls";
import PromoBanner from "../components/Movies/PromoBanner";
import SmallPromoBanner from "../components/Movies/SmallPromoBanner";
import MovieCard from "../components/Movies/MovieCard";
import MoviesSkeleton from "../components/Movies/MoviesSkeleton";
import MoviesError from "../components/Movies/MoviesError";
import { fetchMovies } from "../api/movies";

import DefaultLayout from "@/layouts/DefaultLayout";
import { useAuth } from "@/context/authContext.tsx";
import AddMovieModal from "@/features/movies/components/modals/AddMovieModal";
import AddRoomModal from "@/features/movies/components/modals/AddRoomModal";

export default function MoviesPage() {
  const {
    data: movies,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["movies"],
    queryFn: fetchMovies,
  });

  const { isAdmin } = useAuth();
  const { isOpen: isAddMovieOpen, onOpenChange: onOpenAddMovie } =
    useDisclosure();
  const { isOpen: isAddRoomOpen, onOpenChange: onOpenAddRoom } =
    useDisclosure();

  if (isLoading) {
    return <MoviesSkeleton />;
  }

  if (isError) {
    return <MoviesError error={error} refetch={refetch} />;
  }

  return (
    <DefaultLayout>
      <motion.div
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto px-4 py-6"
        initial={{ opacity: 0 }}
        transition={{ delay: 0.1, duration: 1 }}
      >
        <PromoBanner />
        <SmallPromoBanner />
        {isAdmin && (
          <AdminControls
            onOpenAddMovie={onOpenAddMovie}
            onOpenAddRoom={onOpenAddRoom}
          />
        )}

        <div>
          {movies.data && movies.data.length > 0 ? (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 items-baseline"
              id="tickets-section"
            >
              {movies!.data.map((movie: any, index: number) => {
                return <MovieCard key={movie.id} index={index} movie={movie} />;
              })}
            </div>
          ) : (
            <h1 className="text-xl font-semibold text-primary-400 text-center">
              Схоже немає жодного фільму
            </h1>
          )}
        </div>
      </motion.div>
      <AddMovieModal
        isOpen={isAddMovieOpen}
        refetch={refetch}
        onOpenChange={onOpenAddMovie}
      />
      <AddRoomModal isOpen={isAddRoomOpen} onOpenChange={onOpenAddRoom} />
    </DefaultLayout>
  );
}
