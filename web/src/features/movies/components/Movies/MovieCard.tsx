import { Calendar, Clock, Ticket, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { Movie } from "../../types/MovieTypes";

interface MovieCardProps {
  movie: Movie;
  index: number;
}

export default function MovieCard({ movie, index }: MovieCardProps) {
  const releaseDate = new Date(movie.release_date).toLocaleDateString("uk-UA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: "easeOut",
      }}
      whileHover={{ y: -5 }}
      className="group relative bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100
                 w-full max-w-[368px] mx-auto flex flex-col"
    >
      <Link
        key={movie.id}
        href={`/movie/${movie.slug}`}
        className="flex flex-col h-full"
      >
        <div className="relative overflow-hidden bg-gray-100 w-full aspect-[2/3] max-h-[414px] sm:max-h-[552px]">
          <img
            alt={movie.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            src={
              movie.poster_url?.trim()
                ? movie.poster_url
                : "https://via.placeholder.com/400x600"
            }
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute top-2 right-2 bg-yellow-400 text-gray-900 flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold">
            <Star fill="currentColor" size={16} />
            {movie.rating?.toFixed(1) ?? "4.0"}
          </div>
        </div>

        <div className="p-4 sm:p-6 flex flex-col gap-4 flex-grow">
          <div className="flex justify-between items-start gap-3">
            <h2 className="text-lg sm:text-3xl font-bold text-gray-900 line-clamp-2 leading-snug">
              {movie.title}
            </h2>
            <span className="bg-gray-100 text-gray-800 text-sm sm:text-base font-medium px-3 py-1.5 rounded whitespace-nowrap flex-shrink-0">
              {movie.age_rating ?? "12"}+
            </span>
          </div>

          <p className="text-gray-800 text-sm sm:text-base leading-relaxed line-clamp-3">
            {movie.description}
          </p>

          <div className="mt-auto pt-3">
            <div className="flex flex-wrap items-center gap-3 text-sm sm:text-base">
              <span className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-medium">
                <Clock size={16} />
                {movie.duration} хв
              </span>
              <span className="flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full font-medium">
                <Calendar size={16} />
                {releaseDate}
              </span>
            </div>

            <Button
              className="mt-5 w-full flex items-center justify-center gap-4 group-hover:bg-primary-600 transition-colors py-3 text-base"
              color="primary"
              variant="solid"
            >
              <Ticket size={18} />
              Купити квиток
            </Button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
