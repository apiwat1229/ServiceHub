import {
  ArrowRight,
  Box,
  Calendar,
  Droplets,
  Headphones,
  LayoutGrid,
  Truck,
  Warehouse,
  Wrench,
} from 'lucide-react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import AnimatedBackground from '../components/AnimatedBackground';
import Navbar from '../components/Navbar';

export default function AppsDashboard() {
  const router = useRouter();
  const { t } = useTranslation();

  // Define Apps List
  const apps = [
    {
      id: 'mrp',
      name: t('services.mrp.name'),
      description: t('services.mrp.description'),
      icon: Box,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      hoverBorderColor: 'hover:border-blue-500',
      hoverBgColor: 'hover:bg-blue-50',
      path: '#', // Placeholder
    },
    {
      id: 'cuplump',
      name: t('services.cuplump.name'),
      description: t('services.cuplump.description'),
      icon: Droplets,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
      hoverBorderColor: 'hover:border-orange-500',
      hoverBgColor: 'hover:bg-orange-50',
      path: '#',
    },
    {
      id: 'booking',
      name: t('services.booking.name'),
      description: t('services.booking.description'),
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      hoverBorderColor: 'hover:border-green-500',
      hoverBgColor: 'hover:bg-green-50',
      path: '/booking-queue',
    },
    {
      id: 'truck',
      name: t('services.truck.name'),
      description: t('services.truck.description'),
      icon: Truck,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      hoverBorderColor: 'hover:border-emerald-500',
      hoverBgColor: 'hover:bg-emerald-50',
      path: '#',
    },
    {
      id: 'maintenance',
      name: t('services.maintenance.name'),
      description: t('services.maintenance.description'),
      icon: Wrench,
      color: 'text-red-500',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      hoverBorderColor: 'hover:border-red-500',
      hoverBgColor: 'hover:bg-red-50',
      path: '#',
    },
    {
      id: 'it',
      name: t('services.itHelp.name'),
      description: t('services.itHelp.description'),
      icon: Headphones,
      color: 'text-violet-600',
      bgColor: 'bg-violet-100 dark:bg-violet-900/20',
      borderColor: 'border-violet-200 dark:border-violet-800',
      hoverBorderColor: 'hover:border-violet-500',
      hoverBgColor: 'hover:bg-violet-50',
      path: '#',
    },
    {
      id: 'warehouse',
      name: t('services.warehouse.name'),
      description: t('services.warehouse.description'),
      icon: Warehouse,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
      borderColor: 'border-indigo-200 dark:border-indigo-800',
      hoverBorderColor: 'hover:border-indigo-500',
      hoverBgColor: 'hover:bg-indigo-50',
      path: '#',
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <Navbar />

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <AnimatedBackground />
      </div>

      <main className="flex-1 container mx-auto px-6 py-12 relative z-10 max-w-7xl">
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground flex items-center justify-center md:justify-start gap-3">
            <LayoutGrid className="h-8 w-8 md:h-10 md:w-10 text-primary" />
            {t('services.title')}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">{t('services.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {apps.map((app) => (
            <div
              key={app.id}
              className={`group relative overflow-hidden rounded-2xl border-2 ${app.borderColor} ${app.hoverBorderColor} ${app.hoverBgColor} bg-card/60 backdrop-blur-sm p-6 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col`}
              onClick={() => router.push(app.path)}
            >
              {/* Decorative Background Blob */}
              <div
                className={`absolute -right-6 -top-6 h-24 w-24 rounded-full ${app.bgColor} opacity-20 transition-transform duration-500 group-hover:scale-150 group-hover:opacity-40`}
              />

              <div className="flex items-start justify-between mb-4 relative z-10">
                <div
                  className={`p-3 rounded-xl ${app.bgColor} ${app.color} transition-transform duration-300 group-hover:scale-110`}
                >
                  <app.icon size={28} strokeWidth={1.5} />
                </div>
                <div
                  className={`opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${app.color} text-xs font-semibold flex items-center gap-1`}
                >
                  ACCESS MODULE <ArrowRight size={14} />
                </div>
              </div>

              <div className="relative z-10 flex-1">
                <h3
                  className={`text-xl font-bold text-foreground mb-2 group-hover:${app.color} transition-colors`}
                >
                  {app.name}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{app.description}</p>
              </div>
            </div>
          ))}

          {/* Locked/Settings placeholder to fill grid or indicate admin area if needed, but user said exclude settings. */}
        </div>
      </main>
    </div>
  );
}
