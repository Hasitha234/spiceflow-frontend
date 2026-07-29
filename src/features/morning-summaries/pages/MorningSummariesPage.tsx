import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMorningSummaries } from '../api/morningSummaryApi';
import { DataTable } from '@/components/common/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { MorningSummary } from '../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { MorningSummaryFormDrawer } from '../components/MorningSummaryFormDrawer';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

export const MorningSummariesPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['morningSummaries', page, pageSize],
    queryFn: () => getMorningSummaries(page, pageSize),
  });

  const columns: ColumnDef<MorningSummary>[] = [
    {
      accessorKey: 'summaryNumber',
      header: 'Summary No',
      cell: ({ row }) => <span className="font-semibold text-blue-600">{row.original.summaryNumber}</span>,
    },
    {
      accessorKey: 'summaryDate',
      header: 'Date',
      cell: ({ row }) => <span>{format(new Date(row.original.summaryDate), 'PP')}</span>,
    },
    {
      accessorKey: 'repName',
      header: 'Rep Name',
    },
    {
      accessorKey: 'driverName',
      header: 'Driver Name',
    },
    {
      accessorKey: 'finalEstimateValue',
      header: 'Est. Value',
      cell: ({ row }) => (
        <span className="font-bold text-green-700">
          {formatCurrency(row.original.finalEstimateValue)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge variant={status === 'SETTLED' ? 'success' : status === 'CANCELLED' ? 'destructive' : 'warning'}>
            {status}
          </Badge>
        );
      },
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Morning Summaries</h1>
          <p className="text-slate-500 mt-1">Manage bulk van sales dispatch and loading sheets.</p>
        </div>
        <Button onClick={() => setIsDrawerOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Summary
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data?.content || []}
        isLoading={isLoading}
        pageCount={data?.totalPages || 0}
        pageIndex={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      <MorningSummaryFormDrawer 
        open={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </div>
  );
};
