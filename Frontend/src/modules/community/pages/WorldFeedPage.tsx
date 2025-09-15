import PostCard from "../components/PostCard";
import { useWorldFeed } from "../hooks/useWorldFeed";

export default function WorldFeedPage() {
  const { data: posts, isLoading } = useWorldFeed();
  if (isLoading) return <div>Loading...</div>;
  return (
    <div className="max-w-xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4">🌍 World Feed</h2>
      {posts?.map((post: any) => <PostCard key={post.id} post={post} />)}
    </div>
  );
}
