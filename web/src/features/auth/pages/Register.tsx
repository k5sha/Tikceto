import { useState } from "react";
import axios from "axios";
import { User, Mail, Lock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import AuthLayout from "@/layouts/AuthLayout.tsx";
import { siteConfig } from "@/config/site.ts";
import InputWithIcon from "@/components/InputWithIcon";

const validateForm = (username: string, email: string, password: string) => {
  const errors: string[] = [];

  if (!username) {
    errors.push("Нікнейм є обов'язковим.");
  } else if (username.length > 100) {
    errors.push("Нікнейм не може бути довшим за 100 символів.");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) {
    errors.push("Емейл є обов'язковим.");
  } else if (!emailRegex.test(email)) {
    errors.push("Будь ласка, введіть правильний емейл.");
  } else if (email.length > 255) {
    errors.push("Емейл не може бути довшим за 255 символів.");
  }

  if (!password) {
    errors.push("Пароль є обов'язковим.");
  } else if (password.length < 8) {
    errors.push("Пароль повинен містити мінімум 8 символів.");
  } else if (password.length > 72) {
    errors.push("Пароль не може бути довшим за 72 символи.");
  }

  return errors;
};

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMessages([]);

    const validationErrors = validateForm(username, email, password);

    if (validationErrors.length > 0) {
      setErrorMessages(validationErrors);

      return;
    }

    try {
      await axios.post(`${siteConfig.server_api}/authentication/user`, {
        email,
        password,
        username,
      });

      toast.success(
        "Реєстрацію успішно завершено! Будь ласка, перевірте свою електронну пошту, щоб підтвердити обліковий запис.",
        { duration: 15000 },
      );
    } catch (err) {
      toast.error("Сталася помилка під час реєстрації.");
    }
  };

  return (
    <AuthLayout>
      <h2 className="text-2xl font-semibold text-center mb-6">Реєстрація</h2>
      <form className="space-y-4" onSubmit={handleRegister}>
        {errorMessages.length > 0 && (
          <div className="mb-4 text-red-500">
            {errorMessages.map((msg, index) => (
              <div key={index} className="flex items-center">
                <AlertCircle className="mr-2" />
                {msg}
              </div>
            ))}
          </div>
        )}

        <InputWithIcon
          icon={<User className="h-5 w-5" />}
          label="Нікнейм"
          name="username"
          placeholder="Введіть ваш нікнейм"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

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
