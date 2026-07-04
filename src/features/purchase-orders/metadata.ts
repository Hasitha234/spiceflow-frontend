import { ShoppingOutlined } from '@ant-design/icons';
import type { FeatureMetadata } from '../metadata/types';

export const purchaseOrderMetadata: FeatureMetadata = {
  id: 'purchase-orders',
  path: 'purchase-orders',
  title: 'Purchase Orders',
  navigationLabel: 'Purchase Orders',
  description: 'Manage supplier purchase orders, track fulfilment, and view procurement analytics',
  icon: ShoppingOutlined,
  permissions: ['PURCHASE_VIEW'],
  breadcrumb: ['Purchasing', 'Purchase Orders'],
  order: 30,
  enabled: true,
};
