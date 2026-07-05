import React, { useState } from 'react';
import { Button, Drawer, Table, Tag } from 'antd';
import { PlusOutlined, ShoppingOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { SupplierResponse, ProductResponse } from '@/api/generated';
import { useProductList } from '@/features/products/hooks/useProductList';
import { ProductFormDrawer } from '@/features/products/components/ProductFormDrawer';
import { PermissionGuard } from '@/components/common';

export interface SupplierCatalogDrawerProps {
  open: boolean;
  onClose: () => void;
  supplier: SupplierResponse | null;
}

export const SupplierCatalogDrawer: React.FC<SupplierCatalogDrawerProps> = ({
  open,
  onClose,
  supplier,
}) => {
  const [productDrawerOpen, setProductDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductResponse | null>(null);

  const { data, isLoading, refetch } = useProductList({
    pageable: { page: 0, size: 100 },
    search: '',
    supplierId: supplier?.id ?? 0,
  } as never);

  const columns: ColumnsType<ProductResponse> = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 120,
      render: (sku?: string) => (
        <span className="font-mono text-emerald-400 font-semibold">{sku || '—'}</span>
      ),
    },
    {
      title: 'Product Name',
      dataIndex: 'name',
      key: 'name',
      render: (name?: string) => (
        <span className="font-medium text-slate-100">{name || '—'}</span>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'categoryName',
      key: 'categoryName',
      render: (cat?: string) => (
        <Tag color="blue">{cat || 'Uncategorized'}</Tag>
      ),
    },
    {
      title: 'Unit Price',
      dataIndex: 'basePrice',
      key: 'basePrice',
      render: (price?: number) => (
        <span className="text-slate-300 font-medium">
          {price !== undefined ? `LKR ${price.toLocaleString()}` : '—'}
        </span>
      ),
    },
    {
      title: 'Unit',
      dataIndex: 'unitOfMeasure',
      key: 'unitOfMeasure',
      width: 80,
      render: (uom?: string) => <Tag color="purple">{uom || '—'}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: ProductResponse) => (
        <PermissionGuard requireRole={['ROLE_TENANT_OWNER', 'ROLE_PURCHASING_AGENT', 'ROLE_INVENTORY_MANAGER']}>
          <Button
            type="link"
            size="small"
            onClick={() => {
              setEditingProduct(record);
              setProductDrawerOpen(true);
            }}
            className="!text-blue-400 hover:!text-blue-300"
          >
            Edit
          </Button>
        </PermissionGuard>
      ),
    },
  ];

  const handleProductDrawerClose = () => {
    setProductDrawerOpen(false);
    setEditingProduct(null);
    void refetch();
  };

  return (
    <>
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <ShoppingOutlined className="text-emerald-400 text-lg" />
            <span>Supplier Catalog — {supplier?.name}</span>
          </div>
        }
        open={open}
        onClose={onClose}
        width={750}
        styles={{
          header: { background: '#1e293b', borderBottom: '1px solid #334155', color: '#f8fafc' },
          body: { background: '#0f172a', padding: '20px' },
        }}
        extra={
          <PermissionGuard requireRole={['ROLE_TENANT_OWNER', 'ROLE_PURCHASING_AGENT', 'ROLE_INVENTORY_MANAGER']}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingProduct(null);
                setProductDrawerOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 border-none font-medium"
            >
              Add Item to Supplier
            </Button>
          </PermissionGuard>
        }
      >
        <div className="mb-4 text-slate-400 text-sm">
          Manage all products and items sourced from <strong className="text-slate-200">{supplier?.name}</strong>. Items added here will be immediately available for selection when creating Purchase Orders or Invoices from this supplier.
        </div>

        <Table
          dataSource={data?.content ?? []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={false}
          className="custom-dark-table"
        />
      </Drawer>

      <ProductFormDrawer
        open={productDrawerOpen}
        onClose={handleProductDrawerClose}
        editingProduct={editingProduct}
        defaultSupplierId={supplier?.id}
      />
    </>
  );
};
