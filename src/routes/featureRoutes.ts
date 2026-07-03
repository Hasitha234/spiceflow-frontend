import React, { lazy } from 'react';
import type { FeatureMetadata } from '../features/metadata/types';
import { productMetadata } from '../features/products/metadata';
import { supplierMetadata } from '../features/suppliers/metadata';
import { shopMetadata } from '../features/shops/metadata';
import { repMetadata } from '../features/reps/metadata';

const ProductListPage = lazy(() => import('../features/products').then((m) => ({ default: m.ProductListPage })));
const SupplierListPage = lazy(() => import('../features/suppliers').then((m) => ({ default: m.SupplierListPage })));
const ShopListPage = lazy(() => import('../features/shops').then((m) => ({ default: m.ShopListPage })));
const RepListPage = lazy(() => import('../features/reps').then((m) => ({ default: m.RepListPage })));

export interface FeatureRouteConfig {
  metadata: FeatureMetadata;
  element: React.LazyExoticComponent<React.ComponentType<any>>;
}

export const featureRoutes: FeatureRouteConfig[] = [
  {
    metadata: productMetadata,
    element: ProductListPage,
  },
  {
    metadata: supplierMetadata,
    element: SupplierListPage,
  },
  {
    metadata: shopMetadata,
    element: ShopListPage,
  },
  {
    metadata: repMetadata,
    element: RepListPage,
  },
];
