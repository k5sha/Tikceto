export interface Movie {
  id: string | number;
  slug: string;
  title: string;
  description: string;
  poster_url?: string;
  duration: number;
  release_date: string;
  genre?: string;
  rating?: number;
  age_rating?: number;
}

export interface Session {
  id: number | string;
  start_time: string;
  room: {
    name: string;
  };
}