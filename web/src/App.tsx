import { Route, Routes } from "react-router-dom";

import MoviesPage from "@/features/movies/pages/Movies";
import ActivationPage from "@/features/activation/pages/Activation";
import PurchaseComplete from "@/features/tickets/pages/PurchaseComplete";
import MyTickets from "@/features/tickets/pages/MyTickets";
import MovieDetailPage from "@/features/movies/pages/MovieDetailPage";
import NotFoundPage from "@/features/notFound/pages/NotFoundPage";
import Login from "@/features/auth/pages/Login";
import Register from "@/features/auth/pages/Register";

function App() {
  return (
    <Routes>
      <Route element={<PurchaseComplete />} path="payment/complete/:orderID" />
      <Route element={<MyTickets />} path="/my/tickets/" />
      <Route element={<MoviesPage />} path="/" />
      <Route element={<MovieDetailPage />} path="/movie/:movieSlug" />
      <Route element={<Login />} path="/login" />
      <Route element={<Register />} path="/register" />
      <Route element={<ActivationPage />} path="/confirm/:token" />
      <Route element={<NotFoundPage />} path="*" />
    </Routes>
  );
}

export default App;
