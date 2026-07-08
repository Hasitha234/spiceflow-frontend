import React from 'react';
import { Card, Button, Typography, Skeleton, ConfigProvider } from 'antd';
import { pluralize } from '@/utils/pluralize';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingOutlined,
  AppstoreOutlined,
  TeamOutlined,
  BankOutlined,
  UserOutlined,
  CarOutlined,
  ShopOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useGetProducts } from '@/api/generated/products/products';
import { useGetCategories } from '@/api/generated/product-categories/product-categories';
import { useGetSuppliers } from '@/api/generated/suppliers/suppliers';
import { useGetAllWarehouses } from '@/api/generated/warehouses/warehouses';
import { useGetReps, useGetDrivers, useGetShops } from '@/api/generated/sales-master-data/sales-master-data';

const { Title, Text } = Typography;

const NEUTRAL_ICON_COLOR = '#8b949e';

// --- Card Component ---
interface CategoryCardProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  createLabel: string;
  createLink: string;
  emptyLabel: string;
  singularLabel: string;
  pluralLabel?: string;
  count?: number;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

function CategoryCard({ title, icon, createLabel, createLink, emptyLabel, singularLabel, pluralLabel, count, isLoading, isError, onRetry }: CategoryCardProps) {
  const navigate = useNavigate();

  const isEmpty = count === 0;

  return (
    <Card 
      hoverable
      style={{ 
        height: '160px', 
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 150ms ease-in-out'
      }} 
      styles={{ body: { padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: NEUTRAL_ICON_COLOR, fontSize: '18px' }}>
            {icon}
          </div>
          <Text style={{ fontWeight: 600, fontSize: '16px' }}>
            {title}
          </Text>
        </div>

        <div style={{ height: '24px', display: 'flex', alignItems: 'center' }}>
          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ width: '120px' }}>
                <Skeleton.Button active size="small" style={{ height: '16px', width: '100px' }} />
              </motion.div>
            )}

            {!isLoading && !isError && isEmpty && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <Text type="secondary" style={{ fontSize: '14px' }}>{emptyLabel}</Text>
              </motion.div>
            )}

            {isError && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <WarningOutlined style={{ color: '#f87171', fontSize: '12px' }} />
                <Text style={{ fontSize: '14px' }}>Couldn't load count</Text>
                <Button 
                  type="link" 
                  size="small" 
                  onClick={(e) => { e.preventDefault(); onRetry(); }} 
                  style={{ padding: 0, height: 'auto', fontSize: '13px', color: '#0F9D6C' }}
                >
                  Retry
                </Button>
              </motion.div>
            )}

            {!isLoading && !isError && !isEmpty && (
              <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  <span style={{ fontWeight: 600 }}>{count}</span> {pluralize(count || 0, singularLabel, pluralLabel)}
                </Text>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        <Button 
          type="primary" 
          size="small" 
          onClick={() => navigate(createLink)}
          style={{ fontWeight: 500 }}
        >
          {createLabel}
        </Button>
      </div>
    </Card>
  );
}

// Helper to extract count from paginated or list response
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getCount = (data: any) => {
  if (!data) return 0;
  if (typeof data.totalElements === 'number') return data.totalElements;
  if (Array.isArray(data)) return data.length;
  if (Array.isArray(data.content)) return data.content.length;
  return 0;
};

// --- Main Page ---
export function SettingsPage() {
  const { t } = useTranslation();

  // Fetch only 1 item to minimize payload size since we just need the count
  const queryParams = { pageable: { size: 1 } };

  const productsQuery = useGetProducts(queryParams);
  const categoriesQuery = useGetCategories(queryParams);
  const suppliersQuery = useGetSuppliers(queryParams);
  const warehousesQuery = useGetAllWarehouses(queryParams);
  const repsQuery = useGetReps(queryParams);
  const driversQuery = useGetDrivers(queryParams);
  const shopsQuery = useGetShops(queryParams);

  const categories = [
    { 
      id: 'products', title: 'Products', icon: <ShoppingOutlined />, 
      createLabel: 'Create Product', createLink: 'products', emptyLabel: 'No products yet', singularLabel: 'product',
      query: productsQuery
    },
    { 
      id: 'categories', title: 'Product Categories', icon: <AppstoreOutlined />, 
      createLabel: 'Create Category', createLink: 'categories', emptyLabel: 'No categories yet', singularLabel: 'category', pluralLabel: 'categories',
      query: categoriesQuery
    },
    { 
      id: 'suppliers', title: 'Suppliers', icon: <TeamOutlined />, 
      createLabel: 'Create Supplier', createLink: 'suppliers', emptyLabel: 'No suppliers yet', singularLabel: 'supplier',
      query: suppliersQuery
    },
    { 
      id: 'warehouses', title: 'Warehouses', icon: <BankOutlined />, 
      createLabel: 'Create Warehouse', createLink: 'warehouses', emptyLabel: 'No warehouses yet', singularLabel: 'warehouse',
      query: warehousesQuery
    },
    { 
      id: 'reps', title: 'Sales Reps', icon: <UserOutlined />, 
      createLabel: 'Create Rep', createLink: 'reps', emptyLabel: 'No reps yet', singularLabel: 'rep',
      query: repsQuery
    },
    { 
      id: 'drivers', title: 'Drivers', icon: <CarOutlined />, 
      createLabel: 'Create Driver', createLink: 'drivers', emptyLabel: 'No drivers yet', singularLabel: 'driver',
      query: driversQuery
    },
    { 
      id: 'shops', title: 'Shops', icon: <ShopOutlined />, 
      createLabel: 'Create Shop', createLink: 'shops', emptyLabel: 'No shops yet', singularLabel: 'shop',
      query: shopsQuery
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#0F9D6C', // Consistent accent color
          fontFamily: 'var(--font-sans, sans-serif)',
        },
      }}
    >
      <div style={{ padding: '24px', minHeight: '100vh', boxSizing: 'border-box' }}>
        
        {/* HEADER AREA */}
        <div style={{ marginBottom: '32px' }}>
          <Title level={1} style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
            {t('settings.title', 'Settings')}
          </Title>
          <Text type="secondary" style={{ fontSize: '15px', marginTop: '4px', display: 'block' }}>
            {t('settings.description', 'Manage master data for products, suppliers, warehouses, and your team.')}
          </Text>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '16px' 
        }}>
          {categories.map((cat) => (
            <CategoryCard 
              key={cat.id}
              id={cat.id}
              title={cat.title}
              icon={cat.icon}
              createLabel={cat.createLabel}
              createLink={cat.createLink}
              emptyLabel={cat.emptyLabel}
              singularLabel={cat.singularLabel}
              pluralLabel={cat.pluralLabel}
              count={getCount(cat.query.data)}
              isLoading={cat.query.isLoading}
              isError={cat.query.isError}
              onRetry={() => cat.query.refetch()}
            />
          ))}
        </div>
        
      </div>
    </ConfigProvider>
  );
}
