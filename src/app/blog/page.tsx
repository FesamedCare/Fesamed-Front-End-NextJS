import { Metadata } from "next";
import BlogSearch from "../ui/blog/categoriesHeader";
import { BlogCardHorizontal } from "../ui/blog/blog-card";
import { Post } from "../types/types";
import Footer from "../ui/navigation/footer";
import FilterTags from "../ui/blog/filterTags";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";

export const metadata: Metadata = {
  title: "Blog",
};

async function fetchPosts(category: string, limit: number, offset: number) {
  const queryParams = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    ...(category && category !== "All" && { category }),
  });

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/posts?${queryParams}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch posts");
    }

    const data = await response.json();
    return data; // Retorna { posts: [], total_posts: number }
  } catch (error) {
    console.error("Error fetching posts:", error);
    return { posts: [], total_posts: 0 };
  }
}

export default async function Page({
  searchParams,
}: {
  searchParams: { category?: string; page?: string };
}) {
  const category = searchParams.category || "All";
  const currentPage = Number(searchParams.page) || 1;
  const limit = 9; // Número de posts por página
  const offset = (currentPage - 1) * limit;

  // Fetch data desde el servidor
  const { posts, total_posts } = await fetchPosts(category, limit, offset);

  // Calcular el total de páginas
  const totalPages = Math.ceil(total_posts / limit);


  console.log("Server Posts:", posts);

  return (
    <div>
      <BlogSearch selectedCategory={category} />
      <FilterTags />
      <BlogCardHorizontal posts={posts} />

      {/* Paginación usando ShadCN */}
      <div className="flex justify-center my-6">
        <ShadCNPagination currentPage={currentPage} totalPages={totalPages} />
      </div>

      <Footer />
    </div>
  );
}





// Componente de paginación utilizando ShadCN
function ShadCNPagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const getPageLink = (page: number) => `?page=${page}`;

  return (
    <Pagination>
      <PaginationContent>
        {/* Botón Anterior */}
        <PaginationItem>
          <PaginationPrevious
            href={getPageLink(currentPage - 1)}
            className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>

        {/* Números de página */}
        {Array.from({ length: totalPages }, (_, i) => (
          <PaginationItem key={i}>
            <PaginationLink
              href={getPageLink(i + 1)}
              isActive={i + 1 === currentPage}
            >
              {i + 1}
            </PaginationLink>
          </PaginationItem>
        ))}

        {/* Botón Siguiente */}
        <PaginationItem>
          <PaginationNext
            href={getPageLink(currentPage + 1)}
            className={
              currentPage >= totalPages ? "pointer-events-none opacity-50" : ""
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
