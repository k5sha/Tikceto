import { useState } from "react";
import axios from "axios";
import { User, Mail, Lock, CheckCircle, AlertCircle } from "lucide-react";

import AuthLayout from "@/layouts/auth.tsx";
import {siteConfig} from "@/config/site.ts";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${siteConfig.server_api}/authentication/user`, {
        email,
        password,
        username,
      });
      setError(null);
      setSuccessMessage(
        "Реєстрацію успішно завершено! Будь ласка, перевірте свою електронну пошту, щоб підтвердити обліковий запис.",
      );
    } catch (err) {
      setError("Сталася помилка під час реєстрації.");
    }
  };

  return (
    <AuthLayout>
      <h2 className="text-2xl font-semibold text-center mb-6">Реєстрація</h2>
      <form onSubmit={handleRegister}>
        {error && (
          <span className="mb-4 text-red-500 text-center">
            <AlertCircle className="inline mr-2" /> {error}
          </span>
        )}

        {successMessage && (
          <span className="mb-4 text-green-500 text-center">
            <CheckCircle className="inline mr-2" /> {successMessage}
          </span>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 font-medium" htmlFor="username">
            Нікнейм
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1.5 h-5 w-5 text-gray-500" />
            <input
              required
              className="w-full p-3 pl-10 mt-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              id="username"
              name="username"
              placeholder="Введіть ваш нікнейм"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium" htmlFor="email">
            Емейл
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1.5 h-5 w-5 text-gray-500" />
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
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-medium" htmlFor="password">
            Пароль
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1.5 h-5 w-5 text-gray-500" />
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
          </div>
        </div>

        <button
          className="w-full bg-blue-500 text-white font-semibold p-3 rounded-lg hover:bg-blue-600 transition duration-200"
          type="submit"
        >
          Зареєструватися
        </button>
      </form>

      <div className="flex justify-center text-sm text-gray-600 mt-4">
        <span>
          Уже є обліковий запис?{" "}
          <a className="text-blue-500 hover:underline" href="/login">
            Увійти
          </a>
        </span>
      </div>
    </AuthLayout>
  );
};

export default Register;
