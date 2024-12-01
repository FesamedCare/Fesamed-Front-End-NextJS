export interface Post {
    id: number;
    title: string;
    content: string;
    description?: string;
    slug: string;
    thumbnail?: string;
    category?: {
      slug: string;
      name: string;
    };
    time_read: number;
    published: string;
  }
  