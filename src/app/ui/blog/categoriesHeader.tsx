"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SearchIcon } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/i18n/LocaleProvider";

interface Category {
  category_id: string;
  name: string;
  slug: string;
  views: number;
}

interface BlogSearchProps {
  selectedCategory: string;
}

export default function BlogSearch({ selectedCategory }: BlogSearchProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`,);
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryChange = (value: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    if (value === "All") {
      current.delete("category");
    } else {
      current.set("category", value);
    }

    const search = current.toString();
    const query = search ? `?${search}` : "";

    router.push(`/blog${query}`);
  };

  const handleSearchDebounced = useDebouncedCallback((value: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    if (value.trim() === "") {
      current.delete("name");
    } else {
      current.set("name", value);
    }

    const search = current.toString();
    const query = search ? `?${search}` : "";

    router.push(`/blog${query}`);
  }, 300);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleSearchDebounced(event.target.value);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-48">
          <Select onValueChange={handleCategoryChange} value={selectedCategory}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("misc.pickCategory")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">{t("misc.allCategories")}</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.category_id} value={category.slug}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Búsqueda */}
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder={t("misc.searchArticles")}
            className="w-full border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm leading-5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onChange={handleSearchChange}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
}