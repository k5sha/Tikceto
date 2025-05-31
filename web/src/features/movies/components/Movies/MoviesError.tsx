import { Button } from "@heroui/button";

import DefaultLayout from "@/layouts/DefaultLayout";

interface MoviesErrorProps {
  error: Error;
  refetch: () => void;
}
const MoviesError: React.FC<MoviesErrorProps> = ({ error, refetch }) => {
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
};

export default MoviesError;
