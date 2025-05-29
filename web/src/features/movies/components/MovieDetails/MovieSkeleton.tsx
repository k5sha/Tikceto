import DefaultLayout from "@/layouts/DefaultLayout";
import { motion } from "framer-motion";
import Skeleton from "react-loading-skeleton";

const MovieSkeleton = () => {
  return (
    <DefaultLayout>
      <div className="flex justify-center items-center h-3/4">
        <motion.div
          animate={{ opacity: 1 }}
          className="w-full max-w-4xl p-6 space-y-6"
          initial={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            <Skeleton
              className="rounded-lg shadow-md"
              height={400}
              width={300}
            />

            <div className="w-full md:w-2/3 space-y-4">
              <Skeleton className="rounded-md" height={40} width={250} />
              <Skeleton className="rounded-md" height={20} width={200} />
              <Skeleton className="rounded-md" count={4} height={15} />

              <div className="flex gap-4">
                <Skeleton className="rounded-full" height={30} width={160} />
                <Skeleton className="rounded-full" height={30} width={160} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </DefaultLayout>
  );
};

export default MovieSkeleton;
