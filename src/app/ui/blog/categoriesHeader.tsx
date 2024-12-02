"use client";

import { useRouter } from "next/navigation";
import { SearchIcon } from 'lucide-react';

interface BlogSearchProps {
  selectedCategory: string;
}

export default function BlogSearch({ selectedCategory }: BlogSearchProps) {
  const router = useRouter();

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCategory = e.target.value;
    router.push(`/blog?category=${selectedCategory}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative w-full sm:w-48">
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="w-full appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm leading-5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="All">Todas</option>
            <option value="Odontologia">Odontología</option>
            <option value="Nutricion">Nutrición</option>
            <option value="General">General</option>
            <option value="Salud">Salud</option>
          </select>
        </div>
        {/* Búsqueda */}
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Buscar Artículos..."
            className="w-full border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm leading-5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
