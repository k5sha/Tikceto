import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { Calendar, Clock, Ticket } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import DefaultLayout from "@/layouts/default";

// Function to fetch movies
const fetchMovies = async () => {
  try {
    const { data } = await axios.get("http://localhost:8080/v1/movies");

    return data;
  } catch (error) {
    throw new Error("Error fetching movies");
  }
};

export default function MoviesPage() {
  const {
    data: movies,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["movies"],
    queryFn: fetchMovies,
  });

  if (isLoading) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-screen">
          <p className="text-lg text-gray-700">Завантаження...</p>
        </div>
      </DefaultLayout>
    );
  }

  if (isError) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-screen">
          <p className="text-lg text-red-600">
            Помилка завантаження фільмів: {error.message}
          </p>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-4xl font-bold text-center mb-10 text-gray-900">
          🎬 Зараз у прокаті
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 items-baseline">
          {movies.data.map((movie: any) => {
            const releaseDate = new Date(movie.release_date).toLocaleDateString(
              "uk-UA",
              {
                year: "numeric",
                month: "long",
                day: "numeric",
              },
            );

            return (
              <div
                key={movie.id}
                className="bg-white border rounded-xl shadow-lg overflow-hidden transition-transform transform hover:scale-105"
              >
                <img
                  alt={movie.title}
                  className="w-full h-72 md:h-full lg:h-96 object-cover"
                  src={movie.poster_url}
                />

                <div className="p-5">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                    {movie.title}
                  </h2>
                  <p className="text-gray-600 mb-4">{movie.description}</p>

                  <div className="flex items-center gap-3 text-gray-700 mb-4">
                    <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                      <Clock size={16} /> {movie.duration} хвилин
                    </span>
                    <span className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                      <Calendar size={16} /> {releaseDate}
                    </span>
                  </div>

                  <Link href={`/movie/${movie.id}`}>
                    <Button
                      className="w-full flex items-center justify-center gap-2"
                      color="primary"
                      variant="solid"
                    >
                      <Ticket size={18} />
                      Купити квиток
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DefaultLayout>
  );
}
