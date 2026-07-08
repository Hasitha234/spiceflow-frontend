/**
 * COMPONENT: SupplierFormDrawer
 * 
 * ASSUMPTIONS & VALIDATION ALIGNMENT:
 * Based on the backend API contract (SupplierRequest.java), ONLY the "name" field is 
 * annotated with @NotBlank and is therefore strictly required. Fields like taxId, 
 * contactEmail, contactPhone, and address only enforce @Size or @Email constraints 
 * but are otherwise optional.
 * Therefore, we only mark "name" as required in this UI to match the backend truthfully.
 * 
 * API CONFIGURATION:
 * The base URL and API configuration are managed centrally in the generated Orval Axios client
 * (see src/api/mutator/custom-instance.ts). This ensures all endpoint paths map correctly to 
 * the Railway-deployed Spring Boot backend.
 */

import React, { useEffect, useState } from 'react';
import { Drawer, Form, Input, Button, Alert, message } from 'antd';
import { useCreateSupplier, useUpdateSupplier } from '@/api/generated';
import type { SupplierRequest, SupplierResponse } from '@/api/generated';
import { getErrorMessage } from '@/utils/getProblemDetails';

export interface SupplierFormDrawerProps {
  open: boolean;
  onClose: () => void;
  /** When provided, the drawer switches to "Edit" mode. */
  editingSupplier?: SupplierResponse | null;
}

type SubmissionStatus = 'idle' | 'submitting' | 'error' | 'success';

export const SupplierFormDrawer: React.FC<SupplierFormDrawerProps> = ({
  open,
  onClose,
  editingSupplier,
}) => {
  const [form] = Form.useForm<SupplierRequest>();
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [serverError, setServerError] = useState<string | null>(null);

  const isEditing = !!editingSupplier;

  // Use the generated Orval hooks mapped to the real Spring Boot backend
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();

  // Reset form state when opened or closed
  useEffect(() => {
    if (open) {
      setStatus('idle');
      setServerError(null);
      if (editingSupplier) {
        form.setFieldsValue({
          name: editingSupplier.name ?? '',
          taxId: editingSupplier.taxId ?? '',
          contactEmail: editingSupplier.contactEmail ?? '',
          contactPhone: editingSupplier.contactPhone ?? '',
          address: editingSupplier.address ?? '',
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, editingSupplier, form]);

  const handleFinish = (values: SupplierRequest) => {
    setStatus('submitting');
    setServerError(null);

    if (isEditing && editingSupplier?.id) {
      updateMutation.mutate(
        { id: editingSupplier.id, data: values },
        {
          onSuccess: () => {
            setStatus('success');
            message.success('Supplier updated successfully');
            onClose(); // Parent's onClose should refetch the list
          },
          onError: (error: unknown) => {
            setStatus('error');
            setServerError(getErrorMessage(error) || "Couldn't update supplier — please try again");
          },
        }
      );
    } else {
      createMutation.mutate(
        { data: values },
        {
          onSuccess: () => {
            setStatus('success');
            message.success('Supplier created successfully');
            onClose(); // Parent's onClose should refetch the list
          },
          onError: (error: unknown) => {
            setStatus('error');
            setServerError(getErrorMessage(error) || "Couldn't create supplier — please try again");
          },
        }
      );
    }
  };

  return (
    <Drawer
      title={<span className="font-semibold">{isEditing ? 'Edit Supplier' : 'Create Supplier'}</span>}
      placement="right"
      size="large"
      onClose={onClose}
      open={open}
      destroyOnClose
      styles={{
        header: { borderBottom: '1px solid #f0f0f0', padding: '16px 24px' },
        body: { padding: '24px' },
      }}
      extra={
        <div className="flex gap-3">
          <Button onClick={onClose} disabled={status === 'submitting'}>
            Cancel
          </Button>
          <Button 
            type="primary" 
            onClick={() => form.submit()} 
            loading={status === 'submitting'}
          >
            {isEditing ? 'Save Changes' : 'Create Supplier'}
          </Button>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        requiredMark={true}
        validateTrigger="onBlur"
        className="space-y-4"
      >
        {status === 'error' && serverError && (
          <Alert 
            type="error" 
            message={serverError} 
            showIcon 
            className="mb-6"
          />
        )}

        <Form.Item
          name="name"
          label="Supplier Name"
          rules={[{ required: true, message: 'Supplier name is required' }]}
        >
          <Input placeholder="e.g. Acme Spices Ltd." disabled={status === 'submitting'} />
        </Form.Item>

        <Form.Item
          name="taxId"
          label="Tax ID / Registration Number"
          rules={[{ max: 100, message: 'Tax ID must be under 100 characters' }]}
        >
          <Input placeholder="e.g. TAX-987654321" disabled={status === 'submitting'} />
        </Form.Item>

        <Form.Item
          name="contactEmail"
          label="Contact Email"
          rules={[
            { type: 'email', message: 'Invalid email format' },
            { max: 255, message: 'Email cannot exceed 255 characters' }
          ]}
        >
          <Input type="email" placeholder="e.g. contact@acmespices.com" disabled={status === 'submitting'} />
        </Form.Item>

        <Form.Item
          name="contactPhone"
          label="Contact Phone"
          rules={[
            { max: 50, message: 'Phone number must be under 50 characters' },
            { 
              pattern: /^(\+?\d{1,3}[-\s]?)?\(?\d{1,4}\)?[-\s]?\d{1,4}[-\s]?\d{1,9}$/, 
              message: 'Invalid phone format' 
            }
          ]}
        >
          <Input placeholder="e.g. +1 555-0199 or 0771234567" disabled={status === 'submitting'} />
        </Form.Item>

        <Form.Item
          name="address"
          label="Address"
        >
          <Input.TextArea 
            placeholder="Full warehouse or office address" 
            autoSize={{ minRows: 3, maxRows: 6 }} 
            disabled={status === 'submitting'}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
};
