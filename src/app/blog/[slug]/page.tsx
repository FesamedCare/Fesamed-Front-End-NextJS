import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Post } from "@/app/types/types";
import './index.css';
import DOMPurify from "isomorphic-dompurify";
import Footer from "@/app/ui/navigation/footer";
import { inter } from "@/app/layout";

// Fetch individual post data
async function fetchPost(slug: string): Promise<Post | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/posts/?slug=${slug}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    const post = data.posts ? data.posts[0] : null;
    console.log("Post:", post);
    return post;
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
  }
}

// Genera metadatos dinámicos para SEO
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await fetchPost(params.slug);

  return {
    title: post ? post.title : "Post no encontrado",
    description: post ? post.description : "No hay descripción disponible.",
  };
}

// Página principal del Post
export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await fetchPost(params.slug);

  if (!post) {
    notFound();
  }

  const publishedDate = post.published_at ? new Date(post.published_at) : null;
  const thumbnailUrl = post.thumbnail?.url;

  return (
    <>
    <div className={`${inter.className} antialiased`}>
    <div className="bg-white min-h-screen py-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <article>
          {/* Título */}
          <h1 className="text-4xl font-extrabold text-gray-900 mb-6 border-l-4 border-blue-500 pl-4">
            {post.title}
          </h1>

          {/* Fecha, tiempo de lectura y vistas */}
          <div className="text-gray-500 text-sm mb-6">
            {publishedDate ? (
              <time dateTime={publishedDate.toISOString()}>
                {publishedDate.toLocaleDateString()}
              </time>
            ) : (
              <span>Fecha no disponible</span>
            )}
            {" · "}
            {post.time_read} min read
            {" · "}
            {post.views} vistas
          </div>

          {/* Imagen destacada */}
          <div className="mb-6">
            <Image
              src={thumbnailUrl || "/default-thumbnail.jpg"}
              alt={post.title}
              width={800}
              height={400}
              className="w-full rounded-lg object-cover"
              priority
            />
          </div>

          {/* Categoría */}
          <p className="text-sm text-gray-500 mb-2">
            Categoría: <span className="font-semibold">{post.category?.name || "Sin categoría"}</span>
          </p>

          {/* Descripción */}
          <div className="bg-gray-100 p-6 rounded-lg shadow-lg">
  <p className="text-gray-600 text-lg mb-4">{post.description}</p>
</div>

          <hr />

          {/* Contenido - Renderizar HTML */}
          <div
            className="markdown"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
          />
        </article>
      </div>
    </div>
    </div>
    <Footer />
    </>
  );
}
