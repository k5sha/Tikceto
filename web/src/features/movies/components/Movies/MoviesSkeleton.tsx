import DefaultLayout from "@/layouts/DefaultLayout";
import Skeleton from "react-loading-skeleton";

const getRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const MoviesSkeleton = () => {
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
};

export default MoviesSkeleton;