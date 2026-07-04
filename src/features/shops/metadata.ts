import { ShopOutlined } from '@ant-design/icons';
import type { FeatureMetadata } from '../metadata/types';

export const shopMetadata: FeatureMetadata = {
  id: 'shops',
  path: 'settings/shops',
  title: 'Shops Management',
  navigationLabel: 'Shops',
  description: 'Manage retail outlets, geolocation coordinates, and assigned reps',
  icon: ShopOutlined,
  permissions: ['MASTER_DATA_VIEW'],
  breadcrumb: ['Settings', 'Shops'],
  order: 30,
  enabled: true,
};
