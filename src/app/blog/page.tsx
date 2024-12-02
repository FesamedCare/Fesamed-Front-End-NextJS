import BlogSearch from "../ui/blog/categoriesHeader";
import { BlogCardHorizontal } from "../ui/blog/blog-card";
import { Post } from "../types/types";
import { Metadata } from "next";

export const metadata: Metadata =  {
  title: 'Blog',
}

interface PageProps {
  searchParams: { category?: string };
}

export default async function Page({ searchParams }: PageProps) {
  const category = searchParams.category || "All";

  const queryParams = new URLSearchParams({
    limit: "6",
    offset: "0",
    ...(category !== "All" && { category }),
  });

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts?${queryParams}`, {
    cache: "no-store", // Para evitar que los datos se almacenen en caché
  });

  const data = await response.json();
  const posts: Post[] = data.posts || [];

  return (
    <div>
      <BlogSearch selectedCategory={category} />
      <BlogCardHorizontal posts={posts} />
    </div>
  );
}
