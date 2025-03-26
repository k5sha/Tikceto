import { useState } from "react";
import axios from "axios";

import AuthLayout from "@/layouts/auth.tsx";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Викликаємо API для створення нового користувача
      await axios.post("http://localhost:8080/v1/authentication/user", {
        email,
        password,
        username,
      });

      // Виводимо повідомлення про успішну реєстрацію
      setSuccessMessage(
        "Реєстрацію успішно завершено! Будь ласка, перевірте свою електронну пошту, щоб підтвердити обліковий запис.",
      );
    } catch (err) {
      // Обробка помилок
      setError("Сталася помилка під час реєстрації.");
    }
  };

  return (
    <AuthLayout>
      <h2 className="text-2xl font-semibold text-center mb-6">Реєстрація</h2>
      <form onSubmit={handleRegister}>
        {error && (
          <span className="mb-4 text-red-500 text-center">{error}</span>
        )}

        {successMessage && (
          <span className="mb-4 text-green-500 text-center">
            {successMessage}
          </span>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 font-medium" htmlFor="username">
            Нікнейм
          </label>
          <input
            required
            className="w-full p-3 mt-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            id="username"
            name="username"
            placeholder="Введіть ваш нікнейм"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium" htmlFor="email">
            Емейл
          </label>
          <input
            required
            className="w-full p-3 mt-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            id="email"
            name="email"
            placeholder="Введіть ваш емейл"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-medium" htmlFor="password">
            Пароль
          </label>
          <input
            required
            className="w-full p-3 mt-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            id="password"
            name="password"
            placeholder="Введіть ваш пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
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
