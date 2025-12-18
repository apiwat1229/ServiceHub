import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import AnimatedBackground from '../components/AnimatedBackground';
import { postsApi } from '../lib/api';

export default function Posts() {
  const router = useRouter();
  const {
    data: posts,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['posts'],
    queryFn: () => postsApi.getAll(),
  });

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center relative overflow-hidden">
        <AnimatedBackground />
        <div className="text-gray-900 text-xl relative z-10">Loading posts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center relative overflow-hidden">
        <AnimatedBackground />
        <div className="text-red-600 text-xl relative z-10">Error loading posts</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      <AnimatedBackground />

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Posts</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
          >
            Logout
          </button>
        </div>

        <div className="grid gap-6">
          {posts?.map((post: any) => (
            <div
              key={post.id}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">{post.title}</h2>
              {post.content && <p className="text-gray-600 mb-4">{post.content}</p>}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>By {post.author?.name || post.author?.email}</span>
                <span>
                  {post.published ? (
                    <span className="text-green-600">Published</span>
                  ) : (
                    <span className="text-gray-400">Draft</span>
                  )}
                </span>
              </div>
            </div>
          ))}

          {posts?.length === 0 && (
            <div className="text-center text-gray-500 py-12 bg-white rounded-lg shadow border border-gray-200">
              No posts found. Run the seed script to add sample data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
