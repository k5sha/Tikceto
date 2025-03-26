import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import MoviesPage from "@/pages/movies.tsx";
import ActivationPage from "@/pages/activation.tsx";
import Login from "@/pages/login.tsx";
import Register from "@/pages/register.tsx";

function App() {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      <Route element={<MoviesPage />} path="/movies" />
      <Route element={<Login />} path="/login" />
      <Route element={<Register />} path="/register" />
      <Route element={<ActivationPage />} path="/confirm/:token" />
    </Routes>
  );
}

export default App;
