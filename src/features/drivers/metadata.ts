import { CarOutlined } from '@ant-design/icons';
import type { FeatureMetadata } from '../metadata/types';

export const driverMetadata: FeatureMetadata = {
  id: 'drivers',
  path: 'settings/drivers',
  title: 'Drivers & Logistics Management',
  navigationLabel: 'Drivers',
  description: 'Manage delivery drivers, licenses, vehicles, and default warehouses',
  icon: CarOutlined,
  permissions: ['MASTER_DATA_VIEW'],
  breadcrumb: ['Settings', 'Drivers'],
  order: 50,
  enabled: true,
};
