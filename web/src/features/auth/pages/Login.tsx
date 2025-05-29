import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Mail, Lock } from "lucide-react";

import AuthLayout from "@/layouts/AuthLayout.tsx";
import { useAuth } from "@/context/authContext";
import { siteConfig } from "@/config/site.ts";
import InputWithIcon from "@/components/InputWithIcon";

const validateForm = (email: string, password: string) => {
  const errors: string[] = [];

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) {
    errors.push("Емейл є обов'язковим.");
  } else if (!emailRegex.test(email)) {
    errors.push("Будь ласка, введіть правильний емейл.");
  }

  if (!password) {
    errors.push("Пароль є обов'язковим.");
  }

  return errors;
};

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessages([]);
    setError(null);
    setLoading(true);

    const validationErrors = validateForm(email, password);

    if (validationErrors.length > 0) {
      setErrorMessages(validationErrors);
      setLoading(false);

      return;
    }

    try {
      const response = await axios.post(
        `${siteConfig.server_api}/authentication/token`,
        { email, password },
      );

      const token = response.data.data;

      login(token);
      navigate("/");
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Невірний емейл або пароль. Спробуйте ще раз.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h2 className="text-2xl font-semibold text-center mb-6">Вхід</h2>
      <form className="space-y-4" onSubmit={handleLogin}>
        {errorMessages.length > 0 && (
          <div className="mb-4 text-red-500">
            {errorMessages.map((msg, index) => (
              <div key={index} className="flex items-center">
                <Mail className="mr-2" />
                {msg}
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-red-500 text-center">{error}</p>}

        <InputWithIcon
          icon={<Mail className="h-5 w-5" />}
          label="Емейл"
          name="email"
          placeholder="Введіть ваш емейл"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <InputWithIcon
          icon={<Lock className="h-5 w-5" />}
          label="Пароль"
          name="password"
          placeholder="Введіть ваш пароль"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className={`w-full bg-blue-500 text-white font-semibold p-3 rounded-lg transition duration-200 ${
            loading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
          }`}
          disabled={loading}
          type="submit"
        >
          {loading ? "Завантаження..." : "Увійти"}
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
