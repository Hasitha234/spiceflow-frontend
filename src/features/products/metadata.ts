import { ShoppingOutlined } from '@ant-design/icons';
import type { FeatureMetadata } from '../metadata/types';

export const productMetadata: FeatureMetadata = {
  id: 'products',
  path: 'settings/products',
  title: 'Products Management',
  navigationLabel: 'Products',
  description: 'Manage product catalog, pricing, and active status',
  icon: ShoppingOutlined,
  permissions: ['INVENTORY_VIEW'],
  breadcrumb: ['Settings', 'Products'],
  order: 10,
  enabled: true,
};
