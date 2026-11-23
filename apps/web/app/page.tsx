// "use client";
"use client";
import axios from "axios";
// import { useEffect, useState } from "react";
import { useEffect, useState } from "react";

// interface Post {
//   id: number;
//   title: string;
//   category: string;
// }

interface Data {
message: string;

}

// export default function PostsPage() {
export default function HomePage() {
//   const [posts, setPosts] = useState<Post[]>([]);
const [data, setData] = useState<Data | null>(null);
const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetches from apps/web/src/app/api/posts/route.ts
    axios.get("/api/posts")
      .then((res) => res.data)
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="p-8">Loading posts...</p>;

  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Blog Posts</h1>
      <div className="grid gap-4">
        {data && data.message}
      </div>
    </main>
  );
}