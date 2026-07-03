import React from 'react';
import { Form, Input } from 'antd';
import { Controller, useFormContext } from 'react-hook-form';
import type { SupplierFormValues } from '../schemas/supplierSchema';

/**
 * Standalone supplier form. Uses React Hook Form context (useFormContext)
 * so it can be embedded in a Drawer, Modal, or full-page layout.
 * All validation is driven by the Zod schema via zodResolver.
 */
export const SupplierForm: React.FC = () => {
  const { control, formState: { errors } } = useFormContext<SupplierFormValues>();

  return (
    <div className="space-y-1">
      {/* ── Basic Info ────────────────────────────────────── */}
      <Form.Item
        label="Supplier Name"
        htmlFor="name"
        validateStatus={errors.name ? 'error' : ''}
        help={errors.name?.message}
        required
      >
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Input {...field} id="name" placeholder="e.g. Acme Spices Ltd." />
          )}
        />
      </Form.Item>

      <Form.Item
        label="Tax ID / Registration Number"
        htmlFor="taxId"
        validateStatus={errors.taxId ? 'error' : ''}
        help={errors.taxId?.message}
      >
        <Controller
          name="taxId"
          control={control}
          render={({ field }) => (
            <Input {...field} id="taxId" placeholder="e.g. TAX-987654321" />
          )}
        />
      </Form.Item>

      {/* ── Contact Info ──────────────────────────────────── */}
      <Form.Item
        label="Contact Email"
        htmlFor="contactEmail"
        validateStatus={errors.contactEmail ? 'error' : ''}
        help={errors.contactEmail?.message}
      >
        <Controller
          name="contactEmail"
          control={control}
          render={({ field }) => (
            <Input {...field} id="contactEmail" type="email" placeholder="e.g. contact@acmespices.com" />
          )}
        />
      </Form.Item>

      <Form.Item
        label="Contact Phone"
        htmlFor="contactPhone"
        validateStatus={errors.contactPhone ? 'error' : ''}
        help={errors.contactPhone?.message}
      >
        <Controller
          name="contactPhone"
          control={control}
          render={({ field }) => (
            <Input {...field} id="contactPhone" placeholder="e.g. +1 555-0199" />
          )}
        />
      </Form.Item>

      {/* ── Address ───────────────────────────────────────── */}
      <Form.Item label="Address" htmlFor="address">
        <Controller
          name="address"
          control={control}
          render={({ field }) => (
            <Input.TextArea {...field} id="address" rows={3} placeholder="Full warehouse or office address" />
          )}
        />
      </Form.Item>
    </div>
  );
};
