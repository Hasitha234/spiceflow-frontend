export * from './types';
import { productMetadata } from '../products/metadata';
import { supplierMetadata } from '../suppliers/metadata';
import { shopMetadata } from '../shops/metadata';
import { repMetadata } from '../reps/metadata';
import type { FeatureMetadata } from './types';

export const registeredFeatures: FeatureMetadata[] = [
  productMetadata,
  supplierMetadata,
  shopMetadata,
  repMetadata,
].sort((a, b) => a.order - b.order);
