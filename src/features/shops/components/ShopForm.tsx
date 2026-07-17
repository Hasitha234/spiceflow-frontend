import React, { useState } from 'react';
import { Form, Input, InputNumber, Switch, Select, Button, Tag, message } from 'antd';
import { AimOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { Controller, useFormContext } from 'react-hook-form';
import type { ShopFormValues } from '../schemas/shopSchema';
import { useShopLookups } from '../hooks/useShopLookups';
import { ResponsiveModal } from '@/components/common';

const PRESET_LOCATIONS = [
  { label: 'Colombo HQ', lat: 6.927079, lng: 79.861244 },
  { label: 'Kandy Hub', lat: 7.290572, lng: 80.633726 },
  { label: 'Galle Port', lat: 6.053519, lng: 80.220977 },
  { label: 'Jaffna Depot', lat: 9.661498, lng: 80.025547 },
];

/**
 * Standalone shop form. Uses React Hook Form context (useFormContext)
 * so it can be embedded in a Drawer, Modal, or full-page layout.
 */
export const ShopForm: React.FC<{ isEditing?: boolean }> = ({ isEditing }) => {
  const { control, setValue, getValues, formState: { errors } } = useFormContext<ShopFormValues>();
  const { reps, isLoading: isLoadingReps } = useShopLookups();
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [tempLat, setTempLat] = useState<number | null>(null);
  const [tempLng, setTempLng] = useState<number | null>(null);

  const handleGetGpsLocation = React.useCallback((silent = false) => {
    if (!navigator.geolocation) {
      if (!silent) message.error('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setTempLat(Number(latitude.toFixed(6)));
        setTempLng(Number(longitude.toFixed(6)));
        // If triggered automatically, directly set the form values
        if (silent) {
          setValue('latitude', Number(latitude.toFixed(6)), { shouldValidate: true, shouldDirty: true });
          setValue('longitude', Number(longitude.toFixed(6)), { shouldValidate: true, shouldDirty: true });
        }
        if (!silent) message.success('Fetched GPS coordinates successfully');
      },
      (error) => {
        if (!silent) message.error(`Unable to retrieve location: ${error.message}`);
      }
    );
  }, [setValue]);

  // Auto-trigger GPS capture when creating a new shop
  React.useEffect(() => {
    if (!isEditing && !getValues('latitude') && !getValues('longitude')) {
      handleGetGpsLocation(true);
    }
  }, [isEditing, getValues, handleGetGpsLocation]);

  const handleOpenMapModal = () => {
    setTempLat(getValues('latitude') ?? 6.927079);
    setTempLng(getValues('longitude') ?? 79.861244);
    setMapModalOpen(true);
  };



  const handleConfirmCoordinates = () => {
    setValue('latitude', tempLat, { shouldValidate: true, shouldDirty: true });
    setValue('longitude', tempLng, { shouldValidate: true, shouldDirty: true });
    setMapModalOpen(false);
    message.success('Coordinates updated');
  };

  return (
    <div className="space-y-1">
      {/* ── Basic Info ────────────────────────────────────── */}
      <Form.Item
        label="Shop Name"
        htmlFor="name"
        validateStatus={errors.name ? 'error' : ''}
        help={errors.name?.message}
        required
      >
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Input {...field} id="name" placeholder="Perera Stores" />
          )}
        />
      </Form.Item>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
        <Form.Item label="Owner Name" htmlFor="ownerName">
          <Controller
            name="ownerName"
            control={control}
            render={({ field }) => (
              <Input {...field} id="ownerName" placeholder="Sunil Perera" />
            )}
          />
        </Form.Item>

        <Form.Item 
          label="Phone Number" 
          htmlFor="phone"
          validateStatus={errors.phone ? 'error' : ''}
          help={errors.phone?.message}
          required
        >
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <Input {...field} id="phone" placeholder="077 123 4567" />
            )}
          />
        </Form.Item>
      </div>

      {/* ── Routing & Area ────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
        <Form.Item 
          label="Route" 
          htmlFor="route"
          validateStatus={errors.route ? 'error' : ''}
          help={errors.route?.message}
          required
        >
          <Controller
            name="route"
            control={control}
            render={({ field }) => (
              <Input {...field} id="route" placeholder="RT-01 Colombo North" />
            )}
          />
        </Form.Item>

        <Form.Item 
          label="Area / City" 
          htmlFor="area"
          validateStatus={errors.area ? 'error' : ''}
          help={errors.area?.message}
          required
        >
          <Controller
            name="area"
            control={control}
            render={({ field }) => (
              <Input {...field} id="area" placeholder="Kotahena" />
            )}
          />
        </Form.Item>
      </div>

      <Form.Item 
        label="Address" 
        htmlFor="address"
        validateStatus={errors.address ? 'error' : ''}
        help={errors.address?.message}
        required
      >
        <Controller
          name="address"
          control={control}
          render={({ field }) => (
            <Input.TextArea {...field} id="address" rows={2} placeholder="Full street address" />
          )}
        />
      </Form.Item>

      {/* ── Sales Rep Assignment & Financials ─────────────── */}
      <div className="sf-form-section">
        <div className="sf-form-section-header">
          <span>Assignment & Billing</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
        <Form.Item label="Assigned Sales Rep" htmlFor="assignedRepId">
          <Controller
            name="assignedRepId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                id="assignedRepId"
                placeholder="Select sales rep"
                allowClear
                loading={isLoadingReps}
                options={reps.map((rep) => ({
                  label: `${rep.name} (${rep.area || 'No area'})`,
                  value: rep.id,
                }))}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Outstanding Loan (LKR)"
          htmlFor="outstandingLoan"
          validateStatus={errors.outstandingLoan ? 'error' : ''}
          help={errors.outstandingLoan?.message}
        >
          <Controller
            name="outstandingLoan"
            control={control}
            render={({ field }) => (
              <InputNumber onFocus={(e) => e.target.select()}
                {...field}
                id="outstandingLoan"
                className="w-full"
                style={{ width: '100%' }}
                min={0}
                precision={2}
                placeholder="0.00"
              />
            )}
          />
        </Form.Item>
      </div>
      </div>

      {/* ── Geospatial Coordinates ────────────────────────── */}
      <div className="sf-form-section">
        <div className="sf-form-section-header">
          <span>Location & Status</span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2" style={{ color: 'var(--color-text-tertiary)' }}>
            <EnvironmentOutlined style={{ fontSize: 14 }} />
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Shop GPS Coordinates
            </span>
          </div>
          <Button
            size="small"
            type="text"
            icon={<AimOutlined />}
            onClick={handleOpenMapModal}
            style={{ color: 'var(--color-primary)' }}
          >
            Pick on Map / GPS
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item
            label="Latitude"
            htmlFor="latitude"
            validateStatus={errors.latitude ? 'error' : ''}
            help={errors.latitude?.message}
            className="!mb-0"
          >
            <Controller
              name="latitude"
              control={control}
              render={({ field }) => (
                <InputNumber onFocus={(e) => e.target.select()}
                  {...field}
                  id="latitude"
                  className="w-full"
                  readOnly
                  placeholder="Auto-detected"
                  step={0.000001}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontVariantNumeric: 'tabular-nums',
                    color: 'var(--color-text-secondary)',
                    backgroundColor: 'var(--color-surface-subtle)',
                  }}
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label="Longitude"
            htmlFor="longitude"
            validateStatus={errors.longitude ? 'error' : ''}
            help={errors.longitude?.message}
            className="!mb-0"
          >
            <Controller
              name="longitude"
              control={control}
              render={({ field }) => (
                <InputNumber onFocus={(e) => e.target.select()}
                  {...field}
                  id="longitude"
                  className="w-full"
                  readOnly
                  placeholder="Auto-detected"
                  step={0.000001}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontVariantNumeric: 'tabular-nums',
                    color: 'var(--color-text-secondary)',
                    backgroundColor: 'var(--color-surface-subtle)',
                  }}
                />
              )}
            />
          </Form.Item>
        </div>

      {/* ── Status ────────────────────────────────────────── */}
      <div style={{ paddingTop: 'var(--space-4)' }}>
        <Controller
          name="isActive"
          control={control}
          render={({ field: { value, onChange } }) => (
            <div className="flex items-center gap-3">
              <Switch checked={value} onChange={onChange} />
              <div>
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {value ? 'Active' : 'Inactive'}
                </span>
                <div
                  className="text-xs"
                  style={{ color: 'var(--color-text-tertiary)', marginTop: 2 }}
                >
                  {value
                    ? 'Eligible for orders & deliveries'
                    : 'Not visible in order or delivery workflows'}
                </div>
              </div>
            </div>
          )}
        />
      </div>
      </div>

      {/* ── Coordinate Picker Modal ───────────────────────── */}
      <ResponsiveModal
        title={
          <div className="flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <EnvironmentOutlined className="text-emerald-500" />
            <span>Select Shop Location</span>
          </div>
        }
        open={mapModalOpen}
        onOk={handleConfirmCoordinates}
        onCancel={() => setMapModalOpen(false)}
        okText="Confirm Coordinates"
      >
        <div className="space-y-4 py-2">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Use your device GPS or select a quick preset location below to automatically populate the latitude and longitude for this shop.
          </p>

          <Button
            type="primary"
            icon={<AimOutlined />}
            onClick={() => handleGetGpsLocation(false)}
            className="w-full bg-emerald-600 hover:bg-emerald-500"
          >
            Get Device GPS Location
          </Button>

          <div className="space-y-2 pt-2" style={{ borderTop: '1px solid var(--color-border-default)' }}>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
              Quick Presets
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_LOCATIONS.map((loc) => (
                <Tag
                  key={loc.label}
                  className="cursor-pointer py-1 px-2"
                  style={{ borderColor: 'var(--color-border-default)', background: 'var(--color-surface-subtle)', color: 'var(--color-text-primary)' }}
                  onClick={() => {
                    setTempLat(loc.lat);
                    setTempLng(loc.lng);
                  }}
                >
                  <EnvironmentOutlined className="mr-1 text-emerald-400" />
                  {loc.label}
                </Tag>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-tertiary)' }}>Latitude</label>
              <InputNumber onFocus={(e) => e.target.select()}
                value={tempLat}
                onChange={(v) => setTempLat(v)}
                step={0.0001}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-tertiary)' }}>Longitude</label>
              <InputNumber onFocus={(e) => e.target.select()}
                value={tempLng}
                onChange={(v) => setTempLng(v)}
                step={0.0001}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </ResponsiveModal>
    </div>
  );
};
