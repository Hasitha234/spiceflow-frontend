import React from 'react';

export interface FeatureMetadata {
  id: string;
  path: string;
  title: string;
  navigationLabel: string;
  description?: string;
  icon?: React.ComponentType;
  permissions: string[];
  breadcrumb: string[];
  order: number;
  enabled?: boolean;
}
