export interface Movie {
  title: string;
  poster_url?: string;
  release_date: string;
  description: string;
  duration: number;
  genre?: string;
}

export interface Session {
  id: number | string;
  start_time: string;
  room: {
    name: string;
  };
}