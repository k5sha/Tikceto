const LegendOfMap = () => {
  return (
    <div className="flex justify-center gap-6 my-4 text-sm flex-wrap">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-gray-600 rounded" />
        Зарезервовано
      </div>
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-blue-500 border-2 border-white rounded" />
        Обране
      </div>
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-green-400 rounded" />
        {"<"} 100 грн
      </div>
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-yellow-400 rounded" />
        {"<"} 200 грн
      </div>
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-red-400 rounded" />
        vip-місця
      </div>
    </div>
  );
};

export default LegendOfMap;
