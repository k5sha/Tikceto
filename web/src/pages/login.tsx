import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Mail, Lock } from "lucide-react";

import AuthLayout from "@/layouts/auth.tsx";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:8080/v1/authentication/token",
        {
          email,
          password,
        },
      );
      const token = response.data;

      localStorage.setItem("token", token);
      navigate("/movies");
    } catch (err) {
      setError("Invalid email or password.");
    }
  };

  return (
    <AuthLayout>
      <h2 className="text-2xl font-semibold text-center mb-6">Вхід</h2>
      <form onSubmit={handleLogin}>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <div className="mb-4">
          <label className="block text-gray-700 font-medium" htmlFor="email">
            Емейл
          </label>
          <div className="relative">
            <input
              required
              className="w-full p-3 pl-10 mt-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              id="email"
              name="email"
              placeholder="Введіть ваш емейл"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1.5 h-5 w-5 text-gray-500" />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-medium" htmlFor="password">
            Пароль
          </label>
          <div className="relative">
            <input
              required
              className="w-full p-3 pl-10 mt-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              id="password"
              name="password"
              placeholder="Введіть ваш пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1.5 h-5 w-5 text-gray-500" />
          </div>
        </div>

        <button
          className="w-full bg-blue-500 text-white font-semibold p-3 rounded-lg hover:bg-blue-600 transition duration-200"
          type="submit"
        >
          Увійти
        </button>
      </form>

      <div className="flex justify-center text-sm text-gray-600 mt-4">
        <span>
          Ще не зареєстровані?{" "}
          <a className="text-blue-500 hover:underline" href="/register">
            Зареєструйтесь тут
          </a>
        </span>
      </div>
    </AuthLayout>
  );
};

export default Login;
