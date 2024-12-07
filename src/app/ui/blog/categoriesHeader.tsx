"use client"

import { useRouter, useSearchParams } from "next/navigation";
import { SearchIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BlogSearchProps {
  selectedCategory: string;
}

export default function BlogSearch({ selectedCategory }: BlogSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleCategoryChange = (value: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    
    if (value === 'All') {
      current.delete('category');
    } else {
      current.set('category', value);
    }

    const search = current.toString();
    const query = search ? `?${search}` : '';

    router.push(`/blog${query}`);
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-48">
          <Select 
            onValueChange={handleCategoryChange} 
            value={selectedCategory}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Todas</SelectItem>
              <SelectItem value="Odontologia">Odontología</SelectItem>
              <SelectItem value="Nutricion">Nutrición</SelectItem>
              <SelectItem value="General">General</SelectItem>
              <SelectItem value="Salud">Salud</SelectItem>
            </SelectContent>
          </Select>
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