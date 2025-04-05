import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {siteConfig} from "@/config/site.ts";

const ActivationPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const activateUser = async () => {
    if (!token) return;

    setLoading(true);
    try {
      await axios.put(`${siteConfig.server_api}/users/activate/${token}`);
      navigate("/login");
    } catch (err) {
      setError("Активація не вдалася. Спробуйте ще раз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-semibold text-center mb-6">
          Активуйте свій акаунт
        </h1>

        {loading ? (
          <p className="text-center text-gray-500">Завантаження...</p>
        ) : (
          <>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            <p className="text-center text-lg mb-6">
              Ваш акаунт готовий до активації. Натисніть кнопку нижче, щоб
              активувати свій акаунт.
            </p>
            <button
              className="w-full bg-blue-500 text-white font-semibold p-3 rounded-lg hover:bg-blue-600 transition duration-200"
              onClick={activateUser}
            >
              Активувати акаунт
            </button>
            <div className="mt-4 text-center">
              <span className="text-sm text-gray-600">Не отримали листа?</span>
              <button
                className="text-blue-500 text-sm ml-1"
                onClick={() => activateUser()}
              >
                Надіслати лист активації знову
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ActivationPage;
