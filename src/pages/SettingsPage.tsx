import React, { useState } from 'react';
import { Card, Typography, Skeleton, ConfigProvider, Modal, Input, Button, Upload, message } from 'antd';
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
  SettingOutlined,
  UploadOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useGetProducts } from '@/api/generated/products/products';
import { useGetCategories } from '@/api/generated/product-categories/product-categories';
import { useGetSuppliers } from '@/api/generated/suppliers/suppliers';
import { useGetAllWarehouses } from '@/api/generated/warehouses/warehouses';
import { useGetReps, useGetDrivers, useGetShops } from '@/api/generated/sales-master-data/sales-master-data';
import { useAgencyStore } from '@/store/agencyStore';

const { Title, Text } = Typography;

// --- Card Component ---
interface CategoryCardProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  createLink?: string;
  onClick?: () => void;
  count?: number;
  isLoading?: boolean;
  isError?: boolean;
  hideCount?: boolean;
}

function CategoryCard({ title, icon, createLink, onClick, count, isLoading, isError, hideCount }: CategoryCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (createLink) {
      navigate(createLink);
    }
  };

  return (
    <Card 
      hoverable
      onClick={handleClick}
      style={{ 
        cursor: 'pointer',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--surface-border)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 150ms ease-in-out'
      }} 
      styles={{ body: { padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '1.25rem' }}>
          {icon}
        </div>
        <Text style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
          {title}
        </Text>
      </div>

      {!hideCount && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <Skeleton.Button active size="small" style={{ height: '16px', width: '32px', minWidth: '32px' }} />
              </motion.div>
            )}

            {!isLoading && !isError && (
              <motion.div key="count" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <Text style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {count || 0}
                </Text>
              </motion.div>
            )}

            {isError && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <WarningOutlined style={{ color: 'var(--color-danger)', fontSize: '1rem' }} title="Couldn't load count" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
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

// --- Agency Settings Modal ---
function AgencySettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { agencyName, agencyLogo, setAgencyName, setAgencyLogo } = useAgencyStore();
  const [nameInput, setNameInput] = useState(agencyName || '');
  const [logoInput, setLogoInput] = useState<string | null>(agencyLogo);

  // Sync inputs when modal opens
  React.useEffect(() => {
    if (open) {
      setNameInput(agencyName || '');
      setLogoInput(agencyLogo);
    }
  }, [open, agencyName, agencyLogo]);

  const handleSave = () => {
    setAgencyName(nameInput.trim() || null);
    setAgencyLogo(logoInput);
    message.success('Agency branding updated successfully!');
    onClose();
  };

  const handleLogoUpload = (file: File) => {
    // Check file size (max 500KB)
    if (file.size > 500 * 1024) {
      message.error('Logo must be smaller than 500KB');
      return false;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoInput(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    return false; // Prevent default upload
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SettingOutlined style={{ color: '#0F9D6C' }} />
          <span>Agency Profile Settings</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      okText="Save Changes"
      destroyOnClose
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
        <div>
          <Text strong style={{ display: 'block', marginBottom: '8px' }}>Agency Name</Text>
          <Input 
            placeholder="Enter agency name" 
            value={nameInput} 
            onChange={(e) => setNameInput(e.target.value)} 
          />
        </div>
        
        <div>
          <Text strong style={{ display: 'block', marginBottom: '8px' }}>Agency Logo</Text>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Upload 
              accept="image/png, image/jpeg, image/svg+xml" 
              showUploadList={false} 
              beforeUpload={handleLogoUpload}
            >
              <Button icon={<UploadOutlined />}>Upload Logo</Button>
            </Upload>
            {logoInput && (
              <Button danger type="text" icon={<DeleteOutlined />} onClick={() => setLogoInput(null)}>
                Remove
              </Button>
            )}
          </div>
          {logoInput && (
            <div style={{ marginTop: '12px', border: '1px solid #d9d9d9', borderRadius: '8px', padding: '16px', display: 'inline-block', background: '#f5f5f5' }}>
              <img src={logoInput} alt="Preview" style={{ maxHeight: '64px', maxWidth: '200px', objectFit: 'contain' }} />
            </div>
          )}
          <div style={{ marginTop: '8px' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>Supported formats: PNG, JPG, SVG. Max size: 500KB.</Text>
          </div>
        </div>
      </div>
    </Modal>
  );
}


// --- Main Page ---
export function SettingsPage() {
  const { t } = useTranslation();
  const [isAgencyModalOpen, setIsAgencyModalOpen] = useState(false);

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
    { id: 'products', title: 'Products', icon: <ShoppingOutlined />, createLink: 'products', query: productsQuery },
    { id: 'categories', title: 'Product Categories', icon: <AppstoreOutlined />, createLink: 'categories', query: categoriesQuery },
    { id: 'suppliers', title: 'Suppliers', icon: <TeamOutlined />, createLink: 'suppliers', query: suppliersQuery },
    { id: 'warehouses', title: 'Warehouses', icon: <BankOutlined />, createLink: 'warehouses', query: warehousesQuery },
    { id: 'reps', title: 'Sales Reps', icon: <UserOutlined />, createLink: 'reps', query: repsQuery },
    { id: 'drivers', title: 'Drivers', icon: <CarOutlined />, createLink: 'drivers', query: driversQuery },
    { id: 'shops', title: 'Shops', icon: <ShopOutlined />, createLink: 'shops', query: shopsQuery },
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
      <div style={{ padding: '24px', minHeight: '100vh', boxSizing: 'border-box', backgroundColor: 'var(--surface-base)' }}>
        
        {/* HEADER AREA */}
        <div style={{ paddingTop: '32px', marginBottom: '40px' }}>
          <Title level={1} style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            {t('settings.title', 'Settings')}
          </Title>
          <Text style={{ fontSize: '1rem', marginTop: '8px', display: 'block', color: 'var(--text-secondary)' }}>
            {t('settings.description', 'Manage master data for products, suppliers, warehouses, and your team.')}
          </Text>
        </div>

        <Title level={4} style={{ marginBottom: '16px' }}>Application Configuration</Title>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '16px',
          marginBottom: '32px'
        }}>
          <CategoryCard 
            id="agency-profile"
            title="Agency Profile"
            icon={<SettingOutlined />}
            onClick={() => setIsAgencyModalOpen(true)}
            hideCount
          />
        </div>

        <Title level={4} style={{ marginBottom: '16px' }}>Master Data</Title>
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
              createLink={cat.createLink}
              count={getCount(cat.query.data)}
              isLoading={cat.query.isLoading}
              isError={cat.query.isError}
            />
          ))}
        </div>
        
        <AgencySettingsModal open={isAgencyModalOpen} onClose={() => setIsAgencyModalOpen(false)} />
      </div>
    </ConfigProvider>
  );
}
