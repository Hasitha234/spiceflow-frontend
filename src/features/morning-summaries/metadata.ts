import { FileTextOutlined } from '@ant-design/icons';
import type { FeatureMetadata } from '../metadata/types';

export const morningSummaryMetadata: FeatureMetadata = {
  id: 'morning-summaries',
  path: 'sales/morning-summaries',
  title: 'Morning Summaries Management',
  navigationLabel: 'Morning Summaries',
  description: 'Manage morning dispatch summaries and load estimates',
  icon: FileTextOutlined,
  permissions: ['SALES_VIEW'], // Assuming sales view is appropriate
  breadcrumb: ['Sales', 'Morning Summaries'],
  order: 10,
  enabled: true,
};
