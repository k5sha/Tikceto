import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import MoviesPage from "@/pages/movies.tsx";

function App() {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
        <Route element={<MoviesPage />} path="/movies" />
    </Routes>
  );
}

export default App;
