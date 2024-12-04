import { FC } from 'react';
import PropTypes from 'prop-types'; // Importar PropTypes para validación de tipos
import { Post } from '../../types/types';
import Link from 'next/link'; 
import Image from 'next/image';


interface BlogCardHorizontalProps {
  posts: Post[];
}

export const BlogCardHorizontal: FC<BlogCardHorizontalProps> = ({ posts }) => {

  // Verificar si no hay posts
  if (posts?.length === 0) return <div className='flex items-center justify-center text-gray-400'>No posts available</div>; 

  return (
    <div className="bg-gray-50 py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:max-w-none">
          <div className="grid gap-8 lg:grid-cols-3">
            {posts?.map((post) => (
              <div key={post.id} className="flex flex-col overflow-hidden rounded-lg shadow-navbar">
                <div className="flex-shrink-0">
                  <Image
                    className="h-48 w-full object-cover"
                    src={post.thumbnail?.url || "https://via.placeholder.com/400"} // Placeholder por si no hay thumbnail
                    alt={post.title}
                    width={400}
                    height={200}
                    priority
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between bg-white p-6">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-600">
                      <Link href={`/category/${post.category?.slug}`} className="hover:underline">
                        {post.category?.name || "Uncategorized"}
                      </Link>
                    </p>
                    <Link href={`/posts/${post.slug}`} className="mt-2 block">
                      <p className="text-xl font-semibold text-gray-900 line-clamp-2">{post.title}</p>
                      <p className="mt-3 text-base text-gray-500 line-clamp-2">{post.description}</p>
                    </Link>
                  </div>
                  <div className="mt-6 flex items-center">
                    <div className="ml-3">
                      <p className="text-sm text-gray-500">{post.time_read} min read</p>
                      <div className="flex space-x-1 text-sm text-gray-500">
                        <time dateTime={new Date(post.published).toISOString()}>
                          {new Date(post.published).toLocaleDateString()}
                        </time>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Añadir la validación de PropTypes para asegurar que el componente recibe un array de posts
BlogCardHorizontal.propTypes = {
  posts: PropTypes.array.isRequired,
};
