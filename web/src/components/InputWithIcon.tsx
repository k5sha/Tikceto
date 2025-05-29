import { ReactNode } from "react";

interface InputWithIconProps {
  label?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  name?: string;
  icon: ReactNode;
}

const InputWithIcon = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  name,
  icon,
}: InputWithIconProps) => {
  return (
    <div>
      {label && (
        <label className="block text-gray-700 font-medium mb-1" htmlFor={name}>
          {label}
        </label>
      )}

      <div className="relative">
        <input
          required
          className="w-full p-3 pl-10 mt-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          id={name}
          name={name}
          placeholder={placeholder}
          type={type}
          value={value}
          onChange={onChange}
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1.5 h-5 w-5 text-gray-500">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default InputWithIcon;
