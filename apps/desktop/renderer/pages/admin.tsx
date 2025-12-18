import { Activity, Calendar, CreditCard, DollarSign, Download, Users } from 'lucide-react';
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

      {/* Background with reduced opacity specifically for dashboard readability */}
      <div className="opacity-50">
        <AnimatedBackground />
      </div>

      <div className="container mx-auto px-6 py-8 relative z-10 space-y-8">
        {/* Header Section */}
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
            <p className="text-muted-foreground">
              Overview of your system performance and user activity.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
              <Calendar className="mr-2 h-4 w-4" />
              <span>Jan 20, 2024 - Feb 09, 2024</span>
            </button>
            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
              <Download className="mr-2 h-4 w-4" />
              Download
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="space-y-4">
          <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-background text-foreground shadow">
              Overview
            </button>
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-background/50 hover:text-foreground">
              Analytics
            </button>
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-background/50 hover:text-foreground">
              Reports
            </button>
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-background/50 hover:text-foreground">
              Notifications
            </button>
          </div>

          <div className="space-y-4">
            {/* Cards Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Card 1 */}
              <div className="rounded-xl border border-border bg-card text-card-foreground shadow">
                <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="tracking-tight text-sm font-medium">Total Revenue</h3>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="p-6 pt-0">
                  <div className="text-2xl font-bold">$45,231.89</div>
                  <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="rounded-xl border border-border bg-card text-card-foreground shadow">
                <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="tracking-tight text-sm font-medium">Subscriptions</h3>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="p-6 pt-0">
                  <div className="text-2xl font-bold">+2350</div>
                  <p className="text-xs text-muted-foreground">+180.1% from last month</p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="rounded-xl border border-border bg-card text-card-foreground shadow">
                <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="tracking-tight text-sm font-medium">Sales</h3>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="p-6 pt-0">
                  <div className="text-2xl font-bold">+12,234</div>
                  <p className="text-xs text-muted-foreground">+19% from last month</p>
                </div>
              </div>

              {/* Card 4 */}
              <div className="rounded-xl border border-border bg-card text-card-foreground shadow">
                <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="tracking-tight text-sm font-medium">Active Now</h3>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="p-6 pt-0">
                  <div className="text-2xl font-bold">+573</div>
                  <p className="text-xs text-muted-foreground">+201 since last hour</p>
                </div>
              </div>
            </div>

            {/* Charts & Listings */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              {/* Chart Area */}
              <div className="col-span-4 rounded-xl border border-border bg-card text-card-foreground shadow">
                <div className="flex flex-col space-y-1.5 p-6">
                  <h3 className="font-semibold leading-none tracking-tight">Overview</h3>
                </div>
                <div className="p-6 pt-0 pl-2">
                  <div className="h-[350px] w-full flex items-end justify-between gap-2 px-4">
                    {[35, 78, 45, 90, 60, 48, 85, 30, 65, 55, 80, 40].map((height, i) => (
                      <div
                        key={i}
                        className="group relative flex-1 bg-primary/20 hover:bg-primary/40 rounded-t-sm transition-all h-full flex items-end"
                      >
                        <div
                          className="w-full bg-primary rounded-t-sm transition-all group-hover:bg-primary/80"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 px-4 text-xs text-muted-foreground">
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                    <span>Jun</span>
                    <span>Jul</span>
                    <span>Aug</span>
                    <span>Sep</span>
                    <span>Oct</span>
                    <span>Nov</span>
                    <span>Dec</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="col-span-3 rounded-xl border border-border bg-card text-card-foreground shadow">
                <div className="flex flex-col space-y-1.5 p-6">
                  <h3 className="font-semibold leading-none tracking-tight">Recent Sales</h3>
                  <p className="text-sm text-muted-foreground">You made 265 sales this month.</p>
                </div>
                <div className="p-6 pt-0">
                  <div className="space-y-8">
                    {/* Item 1 */}
                    <div className="flex items-center">
                      <div className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full bg-primary/10 items-center justify-center">
                        <span className="flex h-full w-full items-center justify-center rounded-full bg-muted font-medium">
                          OM
                        </span>
                      </div>
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">Olivia Martin</p>
                        <p className="text-sm text-muted-foreground">olivia.martin@email.com</p>
                      </div>
                      <div className="ml-auto font-medium">+$1,999.00</div>
                    </div>
                    {/* Item 2 */}
                    <div className="flex items-center">
                      <div className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full bg-primary/10 items-center justify-center">
                        <span className="flex h-full w-full items-center justify-center rounded-full bg-muted font-medium">
                          JL
                        </span>
                      </div>
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">Jackson Lee</p>
                        <p className="text-sm text-muted-foreground">jackson.lee@email.com</p>
                      </div>
                      <div className="ml-auto font-medium">+$39.00</div>
                    </div>
                    {/* Item 3 */}
                    <div className="flex items-center">
                      <div className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full bg-primary/10 items-center justify-center">
                        <span className="flex h-full w-full items-center justify-center rounded-full bg-muted font-medium">
                          IN
                        </span>
                      </div>
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">Isabella Nguyen</p>
                        <p className="text-sm text-muted-foreground">isabella.nguyen@email.com</p>
                      </div>
                      <div className="ml-auto font-medium">+$299.00</div>
                    </div>
                    {/* Item 4 */}
                    <div className="flex items-center">
                      <div className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full bg-primary/10 items-center justify-center">
                        <span className="flex h-full w-full items-center justify-center rounded-full bg-muted font-medium">
                          WK
                        </span>
                      </div>
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">William Kim</p>
                        <p className="text-sm text-muted-foreground">will@email.com</p>
                      </div>
                      <div className="ml-auto font-medium">+$99.00</div>
                    </div>
                    {/* Item 5 */}
                    <div className="flex items-center">
                      <div className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full bg-primary/10 items-center justify-center">
                        <span className="flex h-full w-full items-center justify-center rounded-full bg-muted font-medium">
                          SD
                        </span>
                      </div>
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">Sofia Davis</p>
                        <p className="text-sm text-muted-foreground">sofia.davis@email.com</p>
                      </div>
                      <div className="ml-auto font-medium">+$39.00</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
