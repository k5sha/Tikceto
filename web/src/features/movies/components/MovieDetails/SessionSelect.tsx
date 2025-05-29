import React from "react";
import { motion } from "framer-motion";

import { Session } from "../../types/MovieTypes";

interface SessionSelectProps {
  selectedSession: number | string | null;
  sessionsArray: Session[];
  isSessionsLoading: boolean;
  sessionsError: any;
  handleSessionSelect: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const SessionSelect: React.FC<SessionSelectProps> = ({
  selectedSession,
  sessionsArray,
  isSessionsLoading,
  sessionsError,
  handleSessionSelect,
}) => {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="mt-6"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <label className="block mb-1 font-bold text-lg" htmlFor="session-select">
        Оберіть сеанс:
      </label>
      <select
        className="w-full px-4 py-2 rounded-lg border bg-white text-black"
        id="session-select"
        value={selectedSession ?? ""}
        onChange={handleSessionSelect}
      >
        <option disabled value="">
          -- Виберіть сеанс --
        </option>

        {isSessionsLoading ? (
          <option disabled>Завантаження сеансів...</option>
        ) : sessionsError ? (
          <option disabled>Помилка при завантаженні</option>
        ) : sessionsArray.length === 0 ? (
          <option disabled>Немає доступних сеансів</option>
        ) : (
          sessionsArray.map((session) => (
            <option key={session.id} value={session.id}>
              {new Date(session.start_time).toLocaleString()} -{" "}
              {session.room.name}
            </option>
          ))
        )}
      </select>
    </motion.div>
  );
};
