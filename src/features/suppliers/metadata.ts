import { TeamOutlined } from '@ant-design/icons';
import type { FeatureMetadata } from '../metadata/types';

export const supplierMetadata: FeatureMetadata = {
  id: 'suppliers',
  path: 'settings/suppliers',
  title: 'Suppliers Management',
  navigationLabel: 'Suppliers',
  description: 'Manage supplier contacts, tax IDs, and credit terms',
  icon: TeamOutlined,
  permissions: ['PURCHASE_MANAGE'],
  breadcrumb: ['Settings', 'Suppliers'],
  order: 20,
  enabled: true,
};
