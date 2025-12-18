import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AnimatedBackground from '../components/AnimatedBackground';
import Navbar from '../components/Navbar';

export default function AdminPanel() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = () => {
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          router.push('/login');
          return;
        }

        const user = JSON.parse(userStr);
        if (user.role && (user.role === 'admin' || user.role === 'ADMIN')) {
          setIsAdmin(true);
        } else {
          router.push('/posts');
        }
      } catch (e) {
        console.error('Error verifying admin role', e);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <AnimatedBackground />
        <div className="text-foreground text-xl relative z-10">Verifying access...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Navbar />
      <AnimatedBackground />

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Manage system settings and users.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Dashboard Item 1 */}
          <div className="bg-card rounded-xl shadow-lg border border-border p-6 hover:shadow-xl transition-all cursor-pointer group">
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-2">Users Management</h3>
            <p className="text-muted-foreground text-sm">
              View, edit, and manage registered users.
            </p>
          </div>

          {/* Dashboard Item 2 */}
          <div className="bg-card rounded-xl shadow-lg border border-border p-6 hover:shadow-xl transition-all cursor-pointer group">
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-2">System Settings</h3>
            <p className="text-muted-foreground text-sm">
              Configure global application preferences.
            </p>
          </div>

          {/* Dashboard Item 3 */}
          <div className="bg-card rounded-xl shadow-lg border border-border p-6 hover:shadow-xl transition-all cursor-pointer group">
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-2">Analytics</h3>
            <p className="text-muted-foreground text-sm">
              Monitor usage statistics and performance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
