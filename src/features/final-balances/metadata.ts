import { CalculatorOutlined } from '@ant-design/icons';
import type { FeatureMetadata } from '../metadata/types';

export const metadata: FeatureMetadata = {
  id: 'final-balances',
  title: 'Final Balances',
  navigationLabel: 'Final Balances',
  description: 'Manage rep final balances and calculate discrepancies',
  icon: CalculatorOutlined,
  path: 'sales/final-balances',
  permissions: ['SALES_VIEW'],
  breadcrumb: ['Sales', 'Final Balances'],
  order: 40,
  enabled: true,
};
