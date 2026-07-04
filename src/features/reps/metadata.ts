import { UserOutlined } from '@ant-design/icons';
import type { FeatureMetadata } from '../metadata/types';

export const repMetadata: FeatureMetadata = {
  id: 'reps',
  path: 'settings/reps',
  title: 'Sales Representatives Management',
  navigationLabel: 'Sales Reps',
  description: 'Manage sales reps, employee IDs, email addresses, and employment tenure',
  icon: UserOutlined,
  permissions: ['MASTER_DATA_VIEW'],
  breadcrumb: ['Settings', 'Sales Reps'],
  order: 40,
  enabled: true,
};
