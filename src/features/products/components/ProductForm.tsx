import React from 'react';
import { Form, Input, InputNumber, Select, Spin, Row, Col } from 'antd';
import { Controller, useFormContext } from 'react-hook-form';
import type { ProductFormValues } from '../schemas/productSchema';
import { UNIT_TYPE_OPTIONS, UNIT_OF_MEASURE_OPTIONS } from '../constants';

export interface ProductFormProps {
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
    <Form layout="vertical" className="space-y-4">
      {/* ── Identification ──────────────────────────────────── */}
      <h3 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.125rem', marginBottom: '16px' }}>Basic Details</h3>
      
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            label="Product Code"
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
        </Col>
        <Col xs={24} md={12}>
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
        </Col>
      </Row>

      {/* ── Classification ─────────────────────────────────── */}
      <h3 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.125rem', marginTop: '24px', marginBottom: '16px' }}>Classification</h3>
      
      <Row gutter={16}>
        <Col xs={24} md={24}>
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
        </Col>
      </Row>

      {/* ── Pricing ────────────────────────────────────────── */}
      <h3 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.125rem', marginTop: '24px', marginBottom: '16px' }}>Pricing & Units</h3>
      
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            label="Rate (LKR)"
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
        </Col>
      </Row>

      {/* ── Packaging ──────────────────────────────────────── */}
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            label="Net Weight"
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
        </Col>
        <Col xs={24} md={12}>
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
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item label="Items per Bundle">
            <Controller
              name="itemsPerSoldUnit"
              control={control}
              render={({ field }) => (
                <InputNumber onFocus={(e) => e.target.select()} {...field} min={0} style={{ width: '100%' }} />
              )}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Bundles per Box">
            <Controller
              name="soldUnitsPerBox"
              control={control}
              render={({ field }) => (
                <InputNumber onFocus={(e) => e.target.select()} {...field} min={0} style={{ width: '100%' }} />
              )}
            />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
};
