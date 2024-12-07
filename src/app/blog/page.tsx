import { Metadata } from "next";
import BlogSearch from "../ui/blog/categoriesHeader";
import { BlogCardHorizontal } from "../ui/blog/blog-card";
import { Post } from "../types/types";
import Footer from "../ui/navigation/footer";

export const metadata: Metadata = {
  title: "Blog",
};

// Server-side function to fetch posts
async function fetchPosts(category?: string) {
  const queryParams = new URLSearchParams({
    limit: "6",
    offset: "0",
    ...(category && category !== "All" && { category }),
  });

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts?${queryParams}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch posts");
    }

    const data = await response.json();
    return data.posts || [];
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

// Definir `searchParams` como un `Promise`
type SearchParams = Promise<{ category?: string }>;

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Resolver explícitamente el `Promise` de `searchParams`
  const resolvedSearchParams = await searchParams;
  const category = resolvedSearchParams.category || "All";
  const posts: Post[] = await fetchPosts(category);

  return (
    <div>
      <BlogSearch selectedCategory={category} />
      <BlogCardHorizontal posts={posts} />
      <Footer />
    </div>
  );
}
