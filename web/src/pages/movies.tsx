import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { Divider } from "@heroui/divider";
import { useDisclosure } from "@heroui/modal";
import {Calendar, Clock, Film, MapPlus, Ticket} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import DefaultLayout from "@/layouts/default";
import { siteConfig } from "@/config/site.ts";
import { useAuth } from "@/context/authContext.tsx";
import AddMovieModal from "@/components/modals/addMovieModal.tsx";
import AddRoomModal from "@/components/modals/addRoomModal.tsx";

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
  const { isOpen: isAddMovieOpen, onOpenChange: onOpenAddMovie } = useDisclosure();
  const { isOpen: isAddRoomOpen, onOpenChange: onOpenAddRoom } = useDisclosure();
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
                  height={getRandomInt(250, 300)}
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
      <div className="max-w-7xl mx-auto px-4 py-6">
        {isAdmin && (
          <>
            <h1 className="text-lg font-medium text-gray-900">Адмін панель</h1>
            <Divider className="my-4" />
            <div className="flex flex-row gap-8">
              <Button color="primary" onPress={() => onOpenAddMovie()}>
                <Film />
                Додати фільм
              </Button>
              <Button color="primary" onPress={() => onOpenAddRoom()}>
                <MapPlus />
                Додати зал
              </Button>
            </div>
          </>
        )}

        <h1 className="text-4xl font-bold text-center mb-10 text-gray-900">
          🎬 Зараз у прокаті
        </h1>

        <div>
          {movies.data && movies.data.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 items-baseline">
              {movies!.data.map((movie: any) => {
                const releaseDate = new Date(
                  movie.release_date,
                ).toLocaleDateString("uk-UA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });

                return (
                  <Link key={movie.id} href={`/movie/${movie.slug}`}>
                    <div className="bg-white border rounded-xl shadow-lg overflow-hidden transition-transform transform hover:scale-105 cursor-pointer">
                      <img
                        alt={movie.title}
                        className="w-full h-72 md:h-full lg:h-96 object-cover"
                        src={movie.poster_url || "/path/to/fallback-image.jpg"}
                      />

                      <div className="p-5">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                          {movie.title}
                        </h2>
                        <p className="text-gray-600 mb-4">
                          {movie.description.length > 150
                            ? movie.description.substring(0, 150) + "..."
                            : movie.description}
                        </p>

                        <div className="flex items-center gap-3 text-gray-700 mb-4">
                          <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                            <Clock size={16} /> {movie.duration} хвилин
                          </span>
                          <span className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                            <Calendar size={16} /> {releaseDate}
                          </span>
                        </div>

                        <Button
                          className="w-1/2 flex items-center justify-center gap-2"
                          color="primary"
                          variant="solid"
                        >
                          <Ticket size={18} />
                          Купити квиток
                        </Button>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <h1 className="text-xl font-semibold text-primary-400 text-center">
              Схоже немає жодного фільму
            </h1>
          )}
        </div>
      </div>
      <AddMovieModal
        isOpen={isAddMovieOpen}
        refetch={refetch}
        onOpenChange={onOpenAddMovie}
      />
      <AddRoomModal
          isOpen={isAddRoomOpen}
          onOpenChange={onOpenAddRoom}
      />
    </DefaultLayout>
  );
}
