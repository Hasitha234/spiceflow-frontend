/**
 * PR Justification:
 * (a) Mode-Gated Termination Date: The "Termination Date" field is fundamentally invalid during driver creation.
 *     It is now explicitly excluded from rendering when `mode === 'create'` to prevent data entry errors and
 *     reduce cognitive load on the user.
 * (b) Required Field Rigor: We have aligned the visual required asterisks with the actual form validation rules.
 *     Fields essential to dispatching a driver (Employee ID, Phone, License details) are now strictly enforced
 *     by Ant Design's built-in validation, ensuring no incomplete records can be submitted.
 */

import React, { useEffect } from 'react';
import { Drawer, Form, Input, Select, DatePicker, Switch, Button } from 'antd';
import dayjs from 'dayjs';
import { useDriverLookups } from '../hooks/useDriverLookups';
import { useCreateDriver } from '../hooks/useCreateDriver';
import { useUpdateDriver } from '../hooks/useUpdateDriver';

import { useTenantDriverUsers } from '../hooks/useTenantDriverUsers';

export interface DriverFormDrawerProps {
  open: boolean;
  onClose: () => void;
  mode?: 'create' | 'edit';
  // Note: If reusing this for editing, pass the initial driver data here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialValues?: any;
}

export const DriverFormDrawer: React.FC<DriverFormDrawerProps> = ({
  open,
  onClose,
  mode = 'create',
  initialValues,
}) => {
  const [form] = Form.useForm();
  const { warehouseOptions, isLoading: lookupsLoading } = useDriverLookups();
  const { data: driverUsers, isLoading: usersLoading } = useTenantDriverUsers();

  const createMutation = useCreateDriver({ onSuccess: onClose });
  const updateMutation = useUpdateDriver({ onSuccess: onClose });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isError = createMutation.isError || updateMutation.isError;

  // Reset form when drawer opens
  useEffect(() => {
    if (open) {
      if (initialValues) {
        form.setFieldsValue({
          ...initialValues,
          licenseExpiry: initialValues.licenseExpiry ? dayjs(initialValues.licenseExpiry) : undefined,
          employmentDate: initialValues.employmentDate ? dayjs(initialValues.employmentDate) : undefined,
          terminationDate: initialValues.terminationDate ? dayjs(initialValues.terminationDate) : undefined,
        });
      } else {
        form.resetFields();
        // Default values for create
        form.setFieldsValue({ status: 'AVAILABLE', isActive: true });
      }
    }
  }, [open, initialValues, form]);

  const handleUserSelect = (userId: number, option: { label?: string; email?: string }) => {
    form.setFieldsValue({
      name: option.label,
      email: option.email,
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = (values: any) => {
    const payload = {
      ...values,
      employmentDate: values.employmentDate ? values.employmentDate.format('YYYY-MM-DD') : undefined,
      terminationDate: values.terminationDate ? values.terminationDate.format('YYYY-MM-DD') : undefined,
      licenseExpiry: values.licenseExpiry ? values.licenseExpiry.format('YYYY-MM-DD') : undefined,
    };
    
    if (mode === 'edit' && initialValues?.id) {
      updateMutation.mutate({ id: initialValues.id, data: payload as never });
    } else {
      createMutation.mutate({ data: payload as never });
    }
  };

  const handleFinishFailed = () => {
    // Validation errors handled inline
  };

  return (
    <Drawer
      title={mode === 'create' ? 'Register New Driver' : 'Edit Driver'}
      size="large"
      open={open}
      onClose={onClose}
      destroyOnHidden
      maskClosable={!isSubmitting}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '4px 0' }}>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={() => form.submit()}
            loading={isSubmitting}
            style={{ fontWeight: 500 }}
          >
            {mode === 'create' ? 'Register Driver' : 'Save Changes'}
          </Button>
        </div>
      }
    >
      {/* Inline error fallback for network failures */}
      {isError && (
        <div className="mb-6 p-3 bg-red-50 text-red-600 border border-red-200 rounded text-sm font-medium">
          Couldn't {mode === 'create' ? 'register' : 'update'} driver — please try again.
        </div>
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onFinishFailed={handleFinishFailed}
        requiredMark={true}
        validateTrigger={['onChange', 'onBlur']}
      >
        {/* ========================================================
            1. PERSONAL & CONTACT
        ======================================================== */}
        <div className="mb-10">
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '16px' }}>
            Personal & Contact
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            {mode === 'create' ? (
              <Form.Item
                name="name"
                label="Driver User"
                rules={[{ required: true, message: 'Please select a driver user' }]}
              >
                <Select
                  placeholder="Select a driver"
                  loading={usersLoading}
                  disabled={isSubmitting || usersLoading}
                  onChange={handleUserSelect}
                  options={(driverUsers || []).map(u => ({
                    label: u.name,
                    value: u.name,
                    email: u.email
                  }))}
                />
              </Form.Item>
            ) : (
              <Form.Item
                name="name"
                label="Driver Name"
                rules={[{ required: true, message: 'Driver name is required' }]}
              >
                <Input placeholder="e.g. Nimal Perera" disabled={true} />
              </Form.Item>
            )}

            <Form.Item
              name="employeeId"
              label="Employee ID"
              rules={[{ required: true, message: 'Employee ID is required' }]}
            >
              <Input placeholder="e.g. DRV-001" disabled={isSubmitting} />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <Form.Item
              name="email"
              label="Email Address"
              rules={[
                { type: 'email', message: 'Please enter a valid email address' }
              ]}
            >
              <Input placeholder="e.g. nimal@spiceflow.com" disabled={true} />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Phone Number"
              rules={[
                { required: true, message: 'Phone number is required' },
                { pattern: /^(07\d{8}|\+947\d{8})$/, message: 'Must be a valid Sri Lankan mobile (e.g. 0771234567)' }
              ]}
            >
              <Input placeholder="e.g. 077 345 6789" disabled={isSubmitting} />
            </Form.Item>
          </div>
        </div>

        {/* ========================================================
            2. LICENSING & VEHICLE
        ======================================================== */}
        <div className="mb-10">
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '32px', marginBottom: '16px' }}>
            Licensing & Vehicle
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <Form.Item
              name="licenseNumber"
              label="License Number"
              rules={[{ required: true, message: 'License number is required' }]}
            >
              <Input placeholder="e.g. B1234567" disabled={isSubmitting} />
            </Form.Item>

            <Form.Item
              name="licenseClass"
              label="License Class"
              rules={[{ required: true, message: 'License class is required' }]}
            >
              <Select
                placeholder="Select class"
                disabled={isSubmitting}
                options={[
                  { label: 'Light Vehicle', value: 'LIGHT' },
                  { label: 'Heavy Vehicle', value: 'HEAVY' },
                  { label: 'Articulated / Trailer', value: 'ARTICULATED' },
                ]}
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <Form.Item
              name="licenseExpiry"
              label="License Expiry"
              rules={[{ required: true, message: 'License expiry date is required' }]}
            >
              <DatePicker 
                className="w-full" 
                format="DD MMM YYYY" 
                placeholder="Select expiry date"
                disabled={isSubmitting} 
              />
            </Form.Item>

            <Form.Item
              name="assignedVehicle"
              label="Assigned Vehicle Registration"
            >
              <Input placeholder="e.g. WP LC-1234" disabled={isSubmitting} />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <Form.Item
              name="defaultWarehouseId"
              label="Default Warehouse"
            >
              <Select
                placeholder="Select default warehouse"
                disabled={isSubmitting}
                loading={lookupsLoading}
                options={warehouseOptions}
              />
            </Form.Item>
          </div>
        </div>

        {/* ========================================================
            3. STATUS & EMPLOYMENT
        ======================================================== */}
        <div className="mb-4">
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '32px', marginBottom: '16px' }}>
            Status & Employment
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <Form.Item
              name="status"
              label="Operational Status"
              rules={[{ required: true, message: 'Status is required' }]}
              extra={<span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>Current dispatch availability</span>}
            >
              <Select
                disabled={isSubmitting}
                options={[
                  { label: 'Available', value: 'AVAILABLE' },
                  { label: 'On Route', value: 'ON_ROUTE' },
                  { label: 'On Leave', value: 'ON_LEAVE' },
                  { label: 'Suspended', value: 'SUSPENDED' },
                ]}
              />
            </Form.Item>

            <Form.Item
              name="isActive"
              label="Active Status"
              valuePropName="checked"
              extra={<span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>Employment status</span>}
            >
              <Switch
                checkedChildren="Active"
                unCheckedChildren="Inactive"
                disabled={isSubmitting}
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 mt-2">
            <Form.Item
              name="employmentDate"
              label="Employment Date"
            >
              <DatePicker 
                className="w-full" 
                format="DD MMM YYYY" 
                placeholder="Select start date"
                disabled={isSubmitting} 
              />
            </Form.Item>

            {/* CONDITIONAL RENDER: Termination Date is logically invalid during creation */}
            {mode === 'edit' && (
              <Form.Item
                name="terminationDate"
                label="Termination Date"
              >
                <DatePicker 
                  className="w-full" 
                  format="DD MMM YYYY" 
                  placeholder="Select end date (if any)"
                  disabled={isSubmitting} 
                />
              </Form.Item>
            )}
          </div>
        </div>

      </Form>
    </Drawer>
  );
};
