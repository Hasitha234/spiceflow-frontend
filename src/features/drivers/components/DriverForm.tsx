import React from 'react';
import { Form, Input, Select, Switch, Spin } from 'antd';
import { Controller, useFormContext } from 'react-hook-form';
import type { DriverFormValues } from '../schemas/driverSchema';
import { DriverRequestStatus, DriverRequestLicenseClass } from '@/api/generated';

export interface DriverFormProps {
  warehouseOptions: { label: string; value: number }[];
  lookupsLoading?: boolean;
}

/**
 * Standalone driver form. Uses React Hook Form context (useFormContext)
 * so it can be embedded in a Drawer, Modal, or full-page layout.
 */
export const DriverForm: React.FC<DriverFormProps> = ({
  warehouseOptions,
  lookupsLoading = false,
}) => {
  const { control, formState: { errors } } = useFormContext<DriverFormValues>();

  if (lookupsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  const statusOptions = [
    { label: 'Available', value: DriverRequestStatus.AVAILABLE },
    { label: 'On Route', value: DriverRequestStatus.ON_ROUTE },
    { label: 'On Leave', value: DriverRequestStatus.ON_LEAVE },
    { label: 'Suspended', value: DriverRequestStatus.SUSPENDED },
  ];

  const licenseClassOptions = [
    { label: 'Light Vehicle', value: DriverRequestLicenseClass.LIGHT },
    { label: 'Heavy Vehicle', value: DriverRequestLicenseClass.HEAVY },
    { label: 'Articulated / Trailer', value: DriverRequestLicenseClass.ARTICULATED },
  ];

  return (
    <div className="space-y-1">
      {/* ── Basic Info ────────────────────────────────────── */}
      <Form.Item
        label="Driver Name"
        htmlFor="name"
        validateStatus={errors.name ? 'error' : ''}
        help={errors.name?.message}
        required
      >
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Input {...field} id="name" placeholder="e.g. Nimal Perera" />
          )}
        />
      </Form.Item>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
        <Form.Item label="Employee ID" htmlFor="employeeId">
          <Controller
            name="employeeId"
            control={control}
            render={({ field }) => (
              <Input {...field} id="employeeId" placeholder="e.g. DRV-001" />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Email Address"
          htmlFor="email"
          validateStatus={errors.email ? 'error' : ''}
          help={errors.email?.message}
        >
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input {...field} id="email" type="email" placeholder="e.g. nimal@spiceflow.com" />
            )}
          />
        </Form.Item>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
        <Form.Item label="Phone Number" htmlFor="phone">
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <Input {...field} id="phone" placeholder="e.g. 077 345 6789" />
            )}
          />
        </Form.Item>

        <Form.Item label="Assigned Vehicle Registration" htmlFor="assignedVehicle">
          <Controller
            name="assignedVehicle"
            control={control}
            render={({ field }) => (
              <Input {...field} id="assignedVehicle" placeholder="e.g. WP LC-1234" />
            )}
          />
        </Form.Item>
      </div>

      {/* ── Licensing Info ────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4">
        <Form.Item label="License Number" htmlFor="licenseNumber">
          <Controller
            name="licenseNumber"
            control={control}
            render={({ field }) => (
              <Input {...field} id="licenseNumber" placeholder="e.g. B1234567" />
            )}
          />
        </Form.Item>

        <Form.Item label="License Class" htmlFor="licenseClass">
          <Controller
            name="licenseClass"
            control={control}
            render={({ field }) => (
              <Select
                id="licenseClass"
                {...field}
                options={licenseClassOptions}
                placeholder="Select class"
                allowClear
              />
            )}
          />
        </Form.Item>

        <Form.Item label="License Expiry" htmlFor="licenseExpiry">
          <Controller
            name="licenseExpiry"
            control={control}
            render={({ field }) => (
              <Input {...field} id="licenseExpiry" type="date" />
            )}
          />
        </Form.Item>
      </div>

      {/* ── Logistics & Tenure ────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
        <Form.Item label="Default Warehouse" htmlFor="defaultWarehouseId">
          <Controller
            name="defaultWarehouseId"
            control={control}
            render={({ field }) => (
              <Select
                id="defaultWarehouseId"
                {...field}
                options={warehouseOptions}
                placeholder="Select default warehouse"
                allowClear
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Operational Status" htmlFor="status" required>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                id="status"
                {...field}
                options={statusOptions}
              />
            )}
          />
        </Form.Item>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
        <Form.Item label="Employment Date" htmlFor="employmentDate">
          <Controller
            name="employmentDate"
            control={control}
            render={({ field }) => (
              <Input {...field} id="employmentDate" type="date" />
            )}
          />
        </Form.Item>

        <Form.Item label="Termination Date" htmlFor="terminationDate">
          <Controller
            name="terminationDate"
            control={control}
            render={({ field }) => (
              <Input {...field} id="terminationDate" type="date" />
            )}
          />
        </Form.Item>
      </div>

      {/* ── Active Status ─────────────────────────────────── */}
      <Form.Item label="Active Status" htmlFor="isActive">
        <Controller
          name="isActive"
          control={control}
          render={({ field }) => (
            <Switch
              id="isActive"
              checked={field.value}
              onChange={(checked) => field.onChange(checked)}
              checkedChildren="Active"
              unCheckedChildren="Inactive"
            />
          )}
        />
      </Form.Item>
    </div>
  );
};
