// PostCard.tsx
export default function PostCard({ post }: { post: any }) {
  return (
    <div className="p-4 bg-white border rounded-xl shadow-sm mb-4">
      <h4 className="font-semibold">{post.title}</h4>
      <p className="text-gray-700 text-sm">{post.content}</p>
      <div className="mt-2 text-xs text-gray-500">{post.author} • {post.timestamp}</div>
    </div>
  );
}
