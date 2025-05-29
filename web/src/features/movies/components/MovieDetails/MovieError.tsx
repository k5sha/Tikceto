import { Button } from "@heroui/button";

import DefaultLayout from "@/layouts/DefaultLayout";

interface MovieErrorProps {
  errorMessage: string;
  movieSlug?: string;
  navigate: (movieSlug: string) => void;
}
const MovieError: React.FC<MovieErrorProps> = ({
  errorMessage,
  movieSlug,
  navigate,
}) => {
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
};

export default MovieError;
