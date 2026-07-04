import React from 'react';
import { Form, Input, Switch } from 'antd';
import { Controller, useFormContext } from 'react-hook-form';
import type { RepFormValues } from '../schemas/repSchema';

/**
 * Standalone sales rep form. Uses React Hook Form context (useFormContext)
 * so it can be embedded in a Drawer, Modal, or full-page layout.
 */
export const RepForm: React.FC = () => {
  const { control, formState: { errors } } = useFormContext<RepFormValues>();

  return (
    <div className="space-y-1">
      {/* ── Basic Info ────────────────────────────────────── */}
      <Form.Item
        label="Representative Name"
        htmlFor="name"
        validateStatus={errors.name ? 'error' : ''}
        help={errors.name?.message}
        required
      >
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Input {...field} id="name" placeholder="e.g. Kasun Silva" />
          )}
        />
      </Form.Item>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
        <Form.Item label="Employee ID" htmlFor="employeeId">
          <Controller
            name="employeeId"
            control={control}
            render={({ field }) => (
              <Input {...field} id="employeeId" placeholder="e.g. REP-001" />
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
              <Input {...field} id="email" type="email" placeholder="e.g. kasun@spiceflow.com" />
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
              <Input {...field} id="phone" placeholder="e.g. 071 234 5678" />
            )}
          />
        </Form.Item>

        <Form.Item label="Assigned Area / Territory" htmlFor="area">
          <Controller
            name="area"
            control={control}
            render={({ field }) => (
              <Input {...field} id="area" placeholder="e.g. Western Province North" />
            )}
          />
        </Form.Item>
      </div>

      {/* ── Tenure Info ───────────────────────────────────── */}
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

      {/* ── Status ────────────────────────────────────────── */}
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
