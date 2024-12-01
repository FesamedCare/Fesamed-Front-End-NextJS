export interface Post {
  id: string;
  title: string;
  description: string;
  slug: string;
  category: {
    id: number;
    name: string;
    slug: string;
    views: number;
  };
  thumbnail: {
    url: string;
  } | null; // Puede ser un objeto o null
  time_read: number;
  published: string;
}
