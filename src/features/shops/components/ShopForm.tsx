import React, { useState } from 'react';
import { Form, Input, InputNumber, Switch, Select, Button, Modal, Space, Tag, message } from 'antd';
import { AimOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { Controller, useFormContext } from 'react-hook-form';
import type { ShopFormValues } from '../schemas/shopSchema';
import { useShopLookups } from '../hooks/useShopLookups';

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
export const ShopForm: React.FC = () => {
  const { control, setValue, getValues, formState: { errors } } = useFormContext<ShopFormValues>();
  const { reps, isLoading: isLoadingReps } = useShopLookups();
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [tempLat, setTempLat] = useState<number | null>(null);
  const [tempLng, setTempLng] = useState<number | null>(null);

  const handleOpenMapModal = () => {
    setTempLat(getValues('latitude') ?? 6.927079);
    setTempLng(getValues('longitude') ?? 79.861244);
    setMapModalOpen(true);
  };

  const handleGetGpsLocation = () => {
    if (!navigator.geolocation) {
      message.error('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setTempLat(Number(latitude.toFixed(6)));
        setTempLng(Number(longitude.toFixed(6)));
        message.success('Fetched GPS coordinates successfully');
      },
      (error) => {
        message.error(`Unable to retrieve location: ${error.message}`);
      }
    );
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
            <Input {...field} id="name" placeholder="e.g. Perera Stores" />
          )}
        />
      </Form.Item>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
        <Form.Item label="Owner Name" htmlFor="ownerName">
          <Controller
            name="ownerName"
            control={control}
            render={({ field }) => (
              <Input {...field} id="ownerName" placeholder="e.g. Sunil Perera" />
            )}
          />
        </Form.Item>

        <Form.Item label="Phone Number" htmlFor="phone">
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <Input {...field} id="phone" placeholder="e.g. 077 123 4567" />
            )}
          />
        </Form.Item>
      </div>

      {/* ── Routing & Area ────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
        <Form.Item label="Route" htmlFor="route">
          <Controller
            name="route"
            control={control}
            render={({ field }) => (
              <Input {...field} id="route" placeholder="e.g. RT-01 Colombo North" />
            )}
          />
        </Form.Item>

        <Form.Item label="Area / City" htmlFor="area">
          <Controller
            name="area"
            control={control}
            render={({ field }) => (
              <Input {...field} id="area" placeholder="e.g. Kotahena" />
            )}
          />
        </Form.Item>
      </div>

      <Form.Item label="Address" htmlFor="address">
        <Controller
          name="address"
          control={control}
          render={({ field }) => (
            <Input.TextArea {...field} id="address" rows={2} placeholder="Full street address" />
          )}
        />
      </Form.Item>

      {/* ── Sales Rep Assignment & Financials ─────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
        <Form.Item label="Assigned Sales Rep" htmlFor="assignedRepId">
          <Controller
            name="assignedRepId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                id="assignedRepId"
                placeholder="Select assigned sales representative"
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
          label="Initial / Outstanding Loan (LKR)"
          htmlFor="outstandingLoan"
          validateStatus={errors.outstandingLoan ? 'error' : ''}
          help={errors.outstandingLoan?.message}
        >
          <Controller
            name="outstandingLoan"
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                id="outstandingLoan"
                className="w-full"
                min={0}
                precision={2}
                placeholder="0.00"
              />
            )}
          />
        </Form.Item>
      </div>

      {/* ── Geospatial Coordinates ────────────────────────── */}
      <div className="p-3 mb-4 rounded-lg bg-slate-800/60 border border-slate-700/50 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <EnvironmentOutlined className="text-emerald-400" />
            <span className="font-medium text-slate-200">Shop Location Coordinates</span>
          </div>
          <Button
            size="small"
            type="dashed"
            icon={<AimOutlined />}
            onClick={handleOpenMapModal}
            className="!text-emerald-400 !border-emerald-500/50 hover:!border-emerald-400"
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
                <InputNumber
                  {...field}
                  id="latitude"
                  className="w-full"
                  placeholder="e.g. 6.927079"
                  step={0.000001}
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
                <InputNumber
                  {...field}
                  id="longitude"
                  className="w-full"
                  placeholder="e.g. 79.861244"
                  step={0.000001}
                />
              )}
            />
          </Form.Item>
        </div>
      </div>

      {/* ── Status ────────────────────────────────────────── */}
      <Form.Item label="Active Status" htmlFor="isActive">
        <Controller
          name="isActive"
          control={control}
          render={({ field: { value, onChange } }) => (
            <Space>
              <Switch checked={value} onChange={onChange} />
              <span className="text-slate-300">
                {value ? 'Active (Eligible for orders & deliveries)' : 'Inactive'}
              </span>
            </Space>
          )}
        />
      </Form.Item>

      {/* ── Coordinate Picker Modal ───────────────────────── */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-100">
            <EnvironmentOutlined className="text-emerald-400" />
            <span>Select Shop Location</span>
          </div>
        }
        open={mapModalOpen}
        onOk={handleConfirmCoordinates}
        onCancel={() => setMapModalOpen(false)}
        okText="Confirm Coordinates"
      >
        <div className="space-y-4 py-2">
          <p className="text-slate-300 text-sm">
            Use your device GPS or select a quick preset location below to automatically populate the latitude and longitude for this shop.
          </p>

          <Button
            type="primary"
            icon={<AimOutlined />}
            onClick={handleGetGpsLocation}
            className="w-full bg-emerald-600 hover:bg-emerald-500"
          >
            Get Device GPS Location
          </Button>

          <div className="space-y-2 pt-2 border-t border-slate-700/50">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Quick Presets
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_LOCATIONS.map((loc) => (
                <Tag
                  key={loc.label}
                  className="cursor-pointer border-slate-700 bg-slate-800 text-slate-200 hover:border-emerald-500 py-1 px-2"
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
              <label className="block text-xs font-medium text-slate-400 mb-1">Latitude</label>
              <InputNumber
                value={tempLat}
                onChange={(v) => setTempLat(v)}
                step={0.0001}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Longitude</label>
              <InputNumber
                value={tempLng}
                onChange={(v) => setTempLng(v)}
                step={0.0001}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
