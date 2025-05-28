import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@heroui/button";
import axios from "axios";
import DefaultLayout from "@/layouts/default";

export default function NotFoundPage() {
  const [catGif, setCatGif] = useState<string | null>(null);

  useEffect(() => {
    const fetchCatGif = async () => {
      try {
        const response = await axios.get(
          "https://api.thecatapi.com/v1/images/search?mime_types=gif"
        );
        setCatGif(response.data[0].url);
      } catch (error) {
        console.error("Failed to fetch cat gif", error);
        setCatGif("https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif");
      }
    };

    fetchCatGif();
  }, []);

  return (
    <DefaultLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        {catGif && (
            <img
            src={catGif}
            alt="Confused cat"
            className="w-80 h-auto mb-6 rounded-xl shadow-lg"
            />
        )}
        <h1 className="text-4xl font-bold mb-4 text-gray-900">404 — Сторінку не знайдено</h1>
        <p className="text-lg text-gray-600 mb-6">
            Мяу... Ця сторінка десь загубилася 🐱
        </p>
        <Link to="/">
            <Button color="primary" variant="solid">
            Повернутись на головну
            </Button>
        </Link>
        </div>
    </DefaultLayout>
  );
}
