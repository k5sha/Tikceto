import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/landing.tsx";
import MoviesPage from "@/pages/movies.tsx";
import ActivationPage from "@/pages/activation.tsx";
import Login from "@/pages/login.tsx";
import Register from "@/pages/register.tsx";
import PurchaseComplete from "@/pages/purchaseComplete.tsx";
import MyTickets from "@/pages/myTickets.tsx";
import MovieDetailPage from "@/pages/movieDetailPage.tsx";

function App() {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/landing" />
      <Route element={<PurchaseComplete />} path="payment/complete/:orderID" />
      <Route element={<MyTickets />} path="/my/tickets/" />
      <Route element={<MoviesPage />} path="/" />
      <Route element={<MovieDetailPage />} path="/movie/:movieSlug" />
      <Route element={<Login />} path="/login" />
      <Route element={<Register />} path="/register" />
      <Route element={<ActivationPage />} path="/confirm/:token" />
    </Routes>
  );
}

export default App;
