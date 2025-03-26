import { useNavigate } from "react-router-dom";

import DefaultLayout from "@/layouts/default";

export default function IndexPage() {
  const navigate = useNavigate();

  return (
    <DefaultLayout>
      <section className="bg-blue-500 text-white text-center py-16 rounded-lg">
        <h1 className="text-4xl font-bold mb-4">Ласкаво просимо до Ticketo</h1>
        <p className="text-xl mb-8">
          Легко та швидко купуйте квитки на заходи прямо тут
        </p>
        <button
          className="bg-primary-500 text-white py-2 px-6 rounded-lg hover:bg-opacity-50"
          onClick={() => navigate("/movies")}
        >
          Почати
        </button>
      </section>

      <section className="my-16">
        <h2 className="text-3xl font-bold text-center mb-8">Особливості</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="p-6 bg-white shadow-lg rounded-lg">
            <h3 className="text-xl font-semibold mb-4">
              Легкі покупки квитків
            </h3>
            <p>Купуйте квитки на улюблені події всього кількома кліками</p>
          </div>
          <div className="p-6 bg-white shadow-lg rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Миттєвий доступ</h3>
            <p>
              Миттєвий доступ до квитків після покупки — отримуйте їх прямо на
              електронну пошту
            </p>
          </div>
          <div className="p-6 bg-white shadow-lg rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Безпечні платежі</h3>
            <p>Усі транзакції захищені та безпечні</p>
          </div>
        </div>
      </section>

      <section className="bg-blue-600 text-white text-center py-14 rounded-lg">
        <h2 className="text-3xl font-bold mb-4">Готові розпочати?</h2>
        <p className="text-xl mb-8">
          Зареєструйтесь сьогодні та почніть купувати або продавати квитки!
        </p>
        <button
          className="bg-white text-primary-500 py-2 px-6 rounded-lg hover:bg-opacity-95"
          onClick={() => navigate("/registration")}
        >
          Зареєструватися
        </button>
      </section>
    </DefaultLayout>
  );
}
