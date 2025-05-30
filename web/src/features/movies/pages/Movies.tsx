import { Button } from "@heroui/button";
import { useDisclosure } from "@heroui/modal";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import { motion } from "framer-motion";

import AdminControls from "../components/Movies/AdminControls";
import PromoBanner from "../components/Movies/PromoBanner";
import SmallPromoBanner from "../components/Movies/SmallPromoBanner";
import MovieCard from "../components/Movies/MovieCard";

import DefaultLayout from "@/layouts/DefaultLayout";
import { siteConfig } from "@/config/site.ts";
import { useAuth } from "@/context/authContext.tsx";
import AddMovieModal from "@/features/movies/components/modals/AddMovieModal";
import AddRoomModal from "@/features/movies/components/modals/AddRoomModal";

const fetchMovies = async () => {
  const { data } = await axios.get(`${siteConfig.server_api}/movies`);

  return data;
};

const getRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

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
    return (
      <DefaultLayout>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 items-baseline">
          {Array(6)
            .fill(0)
            .map((_, index) => (
              <div
                key={index}
                className="bg-gray-100 border rounded-xl shadow-lg overflow-hidden animate-pulse"
              >
                <Skeleton
                  className="w-full rounded-t-xl bottom-1"
                  height={getRandomInt(200, 250)}
                />
                <div className="p-5">
                  <Skeleton
                    className="mb-3"
                    height={24}
                    width={getRandomInt(150, 300)}
                  />
                  <Skeleton
                    className="mb-4"
                    count={3}
                    height={getRandomInt(20, 40)}
                  />
                  <Skeleton
                    className="mt-4"
                    height={40}
                    width={getRandomInt(100, 150)}
                  />
                </div>
              </div>
            ))}
        </div>
      </DefaultLayout>
    );
  }

  if (isError) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-3/4 flex-col">
          <p className="text-lg text-red-600">
            Помилка завантаження фільмів: {error.message}
          </p>
          <Button className="mt-4" color="primary" onPress={() => refetch()}>
            Спробувати ще раз
          </Button>
        </div>
      </DefaultLayout>
    );
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
