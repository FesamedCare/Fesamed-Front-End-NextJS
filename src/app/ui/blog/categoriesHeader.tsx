'use client';

import { useEffect, useState, useCallback } from 'react';
import { SearchIcon } from 'lucide-react';
import PropTypes from 'prop-types';
import { Post } from '../../types/types';

type BlogSearchProps = {
  setPosts: (posts: Post[]) => void;
};

export default function BlogSearch({ setPosts } : BlogSearchProps) {
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const fetchPosts = useCallback(async (selectedCategory:any) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        category: selectedCategory !== 'All' ? selectedCategory : '',
        limit: '6',
        offset: '0',
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/?${queryParams.toString()}`);
      const data = await response.json();
      console.log('posts',data.posts);
      setPosts(data.posts);
    } catch (error) {
    // Convertimos el error a string de forma segura
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado';
    setError(errorMessage);
    console.error(error);
    } finally {
      setLoading(false);
    }
  }, [setPosts]); // Añade setPosts como dependencia si es necesario

  useEffect(() => {
    fetchPosts(category);
  }, [category, fetchPosts]); // Añade category y fetchPosts como dependencias

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCategory = e.target.value;
    setCategory(selectedCategory);
    console.log('selectedCategory',selectedCategory);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Categoría */}
        <div className="relative w-full sm:w-48">
          <select
            value={category}
            onChange={handleCategoryChange}
            className="w-full appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm leading-5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option>Todas</option>
            <option>Odontologia</option>
            <option>Nutricion</option>
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

      {/* Mensaje de error */}
      {error && <div className="text-red-500 mt-4">Error: {error}</div>}

      {/* Indicador de carga sobre los posts */}
      <div className="mt-4 h-2">
        {loading ? (
          <div className="text-center">
            <svg className="animate-spin h-5 w-5 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
          </div>
        ) : (
          <div>
            {/* Aquí van los posts renderizados */}
          </div>
        )}
      </div>
    </div>
  );
}

BlogSearch.propTypes = {
  setPosts: PropTypes.func.isRequired,
};
