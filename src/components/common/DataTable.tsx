import { Table, type TableProps } from 'antd';
import { LoadingSkeleton } from './LoadingSkeleton';
import { EmptyState } from './EmptyState';

export interface DataTableProps<T> extends TableProps<T> {
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onAdd?: () => void;
  addText?: string;
}

export const DataTable = <T extends object>({
  isLoading = false,
  emptyTitle,
  emptyDescription,
  onAdd,
  addText = 'Add New',
  dataSource,
  ...restProps
}: DataTableProps<T>) => {
  if (isLoading) {
    return <LoadingSkeleton rows={7} type="table" />;
  }

  if (!dataSource || dataSource.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionText={onAdd ? addText : undefined}
        onAction={onAdd}
      />
    );
  }

  return (
    <div className="data-table-container">
      <Table<T>
        dataSource={dataSource}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          className: '!px-6 !py-4',
        }}
        className="custom-data-table"
        {...restProps}
      />
    </div>
  );
};
