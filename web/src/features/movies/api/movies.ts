import axios from "axios";

import { siteConfig } from "@/config/site.ts";

export const fetchMovies = async () => {
  try {
    const { data } = await axios.get(`${siteConfig.server_api}/movies`);

    return data;
  } catch (error: any) {
    if (error.response?.status === 404) return null;
    throw error;
  }
};

export const fetchMovieDetails = async (movieSlug?: string) => {
  if (!movieSlug) return;
  try {
    const { data } = await axios.get(
      `${siteConfig.server_api}/movies/${movieSlug}`,
    );

    return data.data;
  } catch (error: any) {
    if (error.response?.status === 404) return null;
    throw error;
  }
};

export const fetchSessions = async (movieSlug?: string) => {
  if (!movieSlug) return;
  try {
    const { data } = await axios.get(
      `${siteConfig.server_api}/sessions/movie/${movieSlug}`,
    );

    return data.data;
  } catch (error: any) {
    if (error.response?.status === 404) return null;
    throw error;
  }
};

export const fetchSeats = async (sessionId: number) => {
  try {
    const { data } = await axios.get(
      `${siteConfig.server_api}/seats/session/${sessionId}`,
    );

    return data.data;
  } catch (error: any) {
    if (error.response?.status === 404) return null;
    throw error;
  }
};

export const createPayment = async (
  sessionId: number,
  seatId: number,
  fetchWithAuth: any,
) => {
  try {
    const data = await fetchWithAuth("/payments/create", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, seat_id: seatId }),
    });

    return data.data;
  } catch (error) {
    throw error;
  }
};
