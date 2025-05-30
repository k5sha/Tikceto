import { Button } from "@heroui/button";
import { motion } from "framer-motion";

export default function PromoBanner() {
  const movie = {
    title: "Борат",
    description:
      "Комедійний фільм про казахського журналіста, який подорожує Америкою та потрапляє у безліч курйозних ситуацій.",
    imageUrl:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1470&q=80",
    slug: "borat-one",
  };

  return (
    <motion.div
      className="relative rounded-xl overflow-hidden mb-10 shadow-lg cursor-pointer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      onClick={() => {
        window.location.href = `/movie/${movie.slug}`;
      }}
    >
      <img
        src={movie.imageUrl}
        alt={movie.title}
        className="w-full h-64 sm:h-96 object-cover brightness-75"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>

      <div className="absolute bottom-5 left-5 text-white max-w-xl">
        <h2 className="text-3xl font-extrabold mb-2">{movie.title}</h2>
        <p className="mb-4 text-lg">{movie.description}</p>
        <Button color="primary" variant="solid">
          Дізнатися більше
        </Button>
      </div>
    </motion.div>
  );
}
