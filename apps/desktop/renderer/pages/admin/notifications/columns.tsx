import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/button';
import { Checkbox } from '../../../components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';

export type Broadcast = {
  id: string;
  title: string;
  message: string;
  type: string;
  recipientCount: number;
  createdAt: string;
};

interface UseColumnsProps {
  onDelete: (id: string) => void;
  onView: (broadcast: Broadcast) => void;
}

export const useNotificationColumns = ({
  onDelete,
  onView,
}: UseColumnsProps): ColumnDef<Broadcast>[] => {
  const { t } = useTranslation();

  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'title',
      header: t('admin.notifications.titleLabel'),
      cell: ({ row }) => <div className="font-medium">{row.getValue('title')}</div>,
    },
    {
      accessorKey: 'message',
      header: t('admin.notifications.message'),
      cell: ({ row }) => (
        <div
          className="text-muted-foreground truncate max-w-[300px]"
          title={row.getValue('message')}
        >
          {row.getValue('message')}
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: t('admin.notifications.type'),
      cell: ({ row }) => {
        const type = row.getValue('type') as string;
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              type === 'SUCCESS'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : type === 'ERROR'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  : type === 'WARNING'
                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
            }`}
          >
            {type}
          </span>
        );
      },
    },
    {
      accessorKey: 'recipientCount',
      header: t('admin.notifications.recipients'),
      cell: ({ row }) => (
        <div className="text-muted-foreground">{row.getValue('recipientCount')} users</div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: t('admin.notifications.date'),
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {format(new Date(row.getValue('createdAt')), 'dd/MM/yyyy HH:mm')}
        </div>
      ),
    },
    {
      id: 'actions',
      header: t('common.actions', 'Actions'),
      enableSorting: false,
      cell: ({ row }) => {
        const broadcast = row.original;

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onView(broadcast)}>
                  {t('common.view')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(broadcast.id)}
                  className="text-red-600 focus:text-red-600"
                >
                  {t('common.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
};
