// ─── Pages ────────────────────────────────────────────────────────────────────
export { ProductListPage } from './pages/ProductListPage';

// ─── Components ───────────────────────────────────────────────────────────────
export { ProductForm } from './components/ProductForm';
export { ProductFormDrawer } from './components/ProductFormDrawer';
export { ProductTable } from './components/ProductTable';

// ─── Hooks ────────────────────────────────────────────────────────────────────
export { useProductList } from './hooks/useProductList';
export { useCreateProduct } from './hooks/useCreateProduct';
export { useUpdateProduct } from './hooks/useUpdateProduct';
export { useDeleteProduct } from './hooks/useDeleteProduct';
export { useProductLookups } from './hooks/useProductLookups';

// ─── Query Keys ───────────────────────────────────────────────────────────────
export { productKeys } from './queryKeys/productKeys';

// ─── Schema ───────────────────────────────────────────────────────────────────
export { productSchema, defaultProductValues } from './schemas/productSchema';
export type { ProductFormValues } from './schemas/productSchema';

// ─── Metadata ─────────────────────────────────────────────────────────────────
export { productMetadata } from './metadata';

