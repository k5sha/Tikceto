import { Button } from "@heroui/button";
import { LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LoginPrompt = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-md w-full px-4 sm:px-6 lg:px-8 mt-6">
      <div className="bg-white rounded-2xl shadow-lg py-6 px-4 text-center">
        <p className="text-gray-700 text-lg mb-4">
          Увійдіть, щоб придбати квиток
        </p>
        <Button
          className="w-full sm:w-auto px-6 py-3 text-base sm:text-lg font-medium rounded-xl shadow-md hover:scale-105 transition-transform"
          color="secondary"
          size="lg"
          onPress={() => navigate("/login")}
        >
          <LogIn className="mr-2 w-5 h-5" />
          Увійти
        </Button>
      </div>
    </div>
  );
};

export default LoginPrompt;
