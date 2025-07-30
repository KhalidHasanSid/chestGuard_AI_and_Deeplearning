import React, { useState } from "react";

type Props = {
  title: string;
  content: string;
};

export default function ToggleCard({ title, content }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="bg-white rounded-xl shadow-md p-4 transition duration-300 ease-in-out hover:shadow-xl cursor-pointer"
      onClick={() => setIsOpen(!isOpen)}
    >
      <h2 className="text-xl font-semibold mb-2">{title}</h2>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-auto opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <p className="text-gray-700 mt-2">{content}</p>
      </div>
    </div>
  );
}
