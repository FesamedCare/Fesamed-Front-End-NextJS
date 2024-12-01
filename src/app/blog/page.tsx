'use client';

import { useState } from "react";
import BlogSearch from "../ui/blog/categoriesHeader";
import { BlogCardHorizontal } from "../ui/blog/blog-card";
import { Post } from "../types/types";

export default function Page() {
  const [posts, setPosts] = useState<Post[]>([]);

  return (
    <div>
      <BlogSearch setPosts={setPosts} />
      <BlogCardHorizontal posts={posts} />
    </div>
  );
}
