import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import AnimatedBackground from '../components/AnimatedBackground';
import Navbar from '../components/Navbar';
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <AnimatedBackground />
          <div className="text-foreground text-xl relative z-10">Loading posts...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <AnimatedBackground />
          <div className="text-destructive text-xl relative z-10">Error loading posts</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Navbar />
      <AnimatedBackground />

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-foreground">Posts</h1>
        </div>

        <div className="grid gap-6">
          {posts?.map((post: any) => (
            <div
              key={post.id}
              className="bg-card rounded-lg shadow-md p-6 border border-border hover:shadow-lg transition-shadow"
            >
              <h2 className="text-2xl font-semibold text-card-foreground mb-2">{post.title}</h2>
              {post.content && <p className="text-muted-foreground mb-4">{post.content}</p>}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>By {post.author?.name || post.author?.email}</span>
                <span>
                  {post.published ? (
                    <span className="text-green-600">Published</span>
                  ) : (
                    <span className="text-muted-foreground">Draft</span>
                  )}
                </span>
              </div>
            </div>
          ))}

          {posts?.length === 0 && (
            <div className="text-center text-muted-foreground py-12 bg-card rounded-lg shadow border border-border">
              No posts found. Run the seed script to add sample data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
