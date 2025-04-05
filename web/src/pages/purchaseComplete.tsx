import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@heroui/button";

import DefaultLayout from "@/layouts/default";
import { siteConfig } from "@/config/site.ts";

export default function PurchaseComplete() {
  const { orderID } = useParams<{ orderID: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "failed">(
    "loading",
  );

  useEffect(() => {
    if (!orderID) return;

    const checkPaymentStatus = async () => {
      try {
        const { data } = await axios.put(
          `${siteConfig.server_api}/payments/status/${orderID}`,
        );

        if (data.data.result === "ok") {
          setStatus("success");
        } else {
          setStatus("failed");
        }
      } catch (error) {
        setStatus("failed");
      }
    };

    checkPaymentStatus();
  }, [orderID]);

  return (
    <DefaultLayout>
      <div className="flex flex-col items-center justify-center h-3/4 text-center">
        {status === "loading" && (
          <>
            <p className="text-xl font-semibold text-gray-700">
              Перевіряємо оплату...
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h1 className="text-3xl font-bold text-green-700">
              Дякуємо за покупку!
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              Ваш квиток доступний у розділі &rdquo;Мої квитки&rdquo;.
            </p>
            <Button
              className="mt-6"
              color="primary"
              onPress={() => navigate("/my/tickets")}
            >
              Перейти до моїх квитків
            </Button>
          </>
        )}

        {status === "failed" && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mb-4" />
            <h1 className="text-3xl font-bold text-red-700">
              Оплата не пройшла
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              Спробуйте ще раз або зверніться в підтримку.
            </p>
            <Button
              className="mt-6"
              color="secondary"
              onPress={() => navigate("/")}
            >
              Повернутися на головну
            </Button>
          </>
        )}
      </div>
    </DefaultLayout>
  );
}
