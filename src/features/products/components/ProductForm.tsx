import React from 'react';
import { Form, Input, InputNumber, Select, Spin } from 'antd';
import { Controller, useFormContext } from 'react-hook-form';
import type { ProductFormValues } from '../schemas/productSchema';
import { UNIT_TYPE_OPTIONS, UNIT_OF_MEASURE_OPTIONS } from '../constants';

export interface ProductFormProps {
  categoryOptions: { label: string; value: number }[];
  supplierOptions: { label: string; value: number }[];
  lookupsLoading?: boolean;
  disabledSupplier?: boolean;
}

/**
 * Standalone product form. Uses React Hook Form context (useFormContext)
 * so it can be embedded in a Drawer, Modal, or full-page layout.
 * All validation is driven by the Zod schema via zodResolver.
 */
export const ProductForm: React.FC<ProductFormProps> = ({
  categoryOptions,
  supplierOptions,
  lookupsLoading = false,
  disabledSupplier = false,
}) => {
  const { control, formState: { errors } } = useFormContext<ProductFormValues>();

  if (lookupsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* ── Identification ──────────────────────────────────── */}
      <Form.Item
        label="SKU"
        htmlFor="sku"
        validateStatus={errors.sku ? 'error' : ''}
        help={errors.sku?.message}
        required
      >
        <Controller
          name="sku"
          control={control}
          render={({ field }) => (
            <Input {...field} id="sku" placeholder="e.g. SPF-001" />
          )}
        />
      </Form.Item>

      <Form.Item
        label="Product Name"
        htmlFor="name"
        validateStatus={errors.name ? 'error' : ''}
        help={errors.name?.message}
        required
      >
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Input {...field} id="name" placeholder="e.g. Turmeric Powder 100g" />
          )}
        />
      </Form.Item>

      <Form.Item label="Description">
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <Input.TextArea {...field} rows={2} placeholder="Optional product description" />
          )}
        />
      </Form.Item>

      {/* ── Classification ─────────────────────────────────── */}
      <Form.Item
        label="Category"
        validateStatus={errors.categoryId ? 'error' : ''}
        help={errors.categoryId?.message}
        required
      >
        <Controller
          name="categoryId"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              value={field.value || undefined}
              placeholder="Select category"
              options={categoryOptions}
              showSearch
              optionFilterProp="label"
            />
          )}
        />
      </Form.Item>

      <Form.Item
        label="Supplier"
        validateStatus={errors.supplierId ? 'error' : ''}
        help={errors.supplierId?.message}
        required
      >
        <Controller
          name="supplierId"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              value={field.value || undefined}
              placeholder="Select supplier"
              options={supplierOptions}
              showSearch
              optionFilterProp="label"
              disabled={disabledSupplier}
            />
          )}
        />
      </Form.Item>

      {/* ── Pricing ────────────────────────────────────────── */}
      <Form.Item
        label="Base Price (LKR)"
        htmlFor="basePrice"
        validateStatus={errors.basePrice ? 'error' : ''}
        help={errors.basePrice?.message}
        required
      >
        <Controller
          name="basePrice"
          control={control}
          render={({ field }) => (
            <InputNumber onFocus={(e) => e.target.select()}
              {...field}
              id="basePrice"
              min={0}
              step={0.01}
              precision={2}
              style={{ width: '100%' }}
              placeholder="0.00"
            />
          )}
        />
      </Form.Item>

      <Form.Item
        label="Rate per Bundle (LKR)"
        validateStatus={errors.ratePerSoldUnit ? 'error' : ''}
        help={errors.ratePerSoldUnit?.message}
      >
        <Controller
          name="ratePerSoldUnit"
          control={control}
          render={({ field }) => (
            <InputNumber onFocus={(e) => e.target.select()}
              {...field}
              min={0}
              step={0.01}
              precision={2}
              style={{ width: '100%' }}
              placeholder="0.00"
            />
          )}
        />
      </Form.Item>

      {/* ── Packaging ──────────────────────────────────────── */}
      <Form.Item
        label="Unit of Measure"
        validateStatus={errors.unitOfMeasure ? 'error' : ''}
        help={errors.unitOfMeasure?.message}
        required
      >
        <Controller
          name="unitOfMeasure"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              placeholder="Select unit"
              options={[...UNIT_OF_MEASURE_OPTIONS]}
            />
          )}
        />
      </Form.Item>

      <Form.Item
        label="Unit Type"
        validateStatus={errors.unitType ? 'error' : ''}
        help={errors.unitType?.message}
        required
      >
        <Controller
          name="unitType"
          control={control}
          render={({ field }) => (
            <Select {...field} options={[...UNIT_TYPE_OPTIONS]} />
          )}
        />
      </Form.Item>

      <Form.Item label="Net Weight">
        <Controller
          name="netWeight"
          control={control}
          render={({ field }) => (
            <Input {...field} placeholder="e.g. 100g" />
          )}
        />
      </Form.Item>

      <Form.Item label="Box Configuration">
        <Controller
          name="boxConfiguration"
          control={control}
          render={({ field }) => (
            <Input {...field} placeholder="e.g. 24 x 100g" />
          )}
        />
      </Form.Item>

      <Form.Item label="Items per Bundle">
        <Controller
          name="itemsPerSoldUnit"
          control={control}
          render={({ field }) => (
            <InputNumber onFocus={(e) => e.target.select()} {...field} min={0} style={{ width: '100%' }} />
          )}
        />
      </Form.Item>

      <Form.Item label="Bundles per Box">
        <Controller
          name="soldUnitsPerBox"
          control={control}
          render={({ field }) => (
            <InputNumber onFocus={(e) => e.target.select()} {...field} min={0} style={{ width: '100%' }} />
          )}
        />
      </Form.Item>
    </div>
  );
};

