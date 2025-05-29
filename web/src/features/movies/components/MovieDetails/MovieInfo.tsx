import React from "react";
import { motion } from "framer-motion";

import { Movie } from "../../types/MovieTypes";

interface MovieDetailsProps {
  movie: Movie;
}

export const MovieDetails: React.FC<MovieDetailsProps> = ({ movie }) => {
  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="bg-white shadow-md rounded-lg p-6"
      initial={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 ">
        <motion.div
          className="w-full md:w-1/3 flex flex-col items-center"
          transition={{ duration: 0.6 }}
          whileHover={{ scale: 1.05 }}
        >
          <img
            alt={movie.title}
            className="w-full md:w-auto h-96 object-cover rounded-lg shadow-md"
            src={
              movie.poster_url ||
              "https://www.mangobeds.com/images/image-fallback.jpg"
            }
          />
        </motion.div>

        <motion.div
          animate={{ opacity: 1 }}
          className="w-full md:w-2/3 space-y-4"
          initial={{ opacity: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-gray-900">{movie.title}</h1>
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
        </motion.div>
      </div>
    </motion.div>
  );
};
