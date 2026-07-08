/* eslint-disable @typescript-eslint/no-explicit-any */

import { Button, InputNumber, Select, Tooltip, Table, message } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Controller, useFieldArray, useWatch } from 'react-hook-form';
import type { Control, UseFormSetValue } from 'react-hook-form';
import type { FormValues } from '../CreatePurchasePage';
import { emptyLineItem } from '../constants';
import type { Product } from '../../../types/inventory';
import { productApi } from '../../../api/inventory';

interface PurchaseLineItemGridProps {
  control: Control<FormValues>;
  setValue: UseFormSetValue<FormValues>;
  supplierProducts: Product[];
  errors: any;
}

export function PurchaseLineItemGrid({ control, setValue, supplierProducts, errors }: PurchaseLineItemGridProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lineItems',
  });

  const lineItems = useWatch({ control, name: 'lineItems' });

  const getMultiplier = (product: Product | undefined, unitType: string) => {
    if (!product) return 1;
    const itemsPerSoldUnit = Number(product.itemsPerSoldUnit || 1);
    const soldUnitsPerBox = Number(product.soldUnitsPerBox || 1);
    
    if (unitType === 'BOX') return itemsPerSoldUnit * soldUnitsPerBox;
    if (unitType === 'BUNDLE') return itemsPerSoldUnit;
    return 1; // EACH
  };

  const handleProductSelect = (productId: string, index: number) => {
    const product = supplierProducts.find((p) => String(p.id) === String(productId));
    if (product) {
      const rate = Number(product.ratePerSoldUnit ?? product.basePrice ?? 0);
      const unitType = product.unitType || 'BOX';
      const inputQty = Number(lineItems?.[index]?.noOfBoxes || 1);
      
      setValue(`lineItems.${index}.rate`, rate);
      setValue(`lineItems.${index}.unitType`, unitType);
      setValue(`lineItems.${index}.soldQuantity`, inputQty * getMultiplier(product, unitType));
    }
  };

  const handleQtyChange = (qty: number | null, index: number) => {
    const productId = lineItems?.[index]?.productId;
    const unitType = lineItems?.[index]?.unitType || 'BOX';
    if (productId) {
      const product = supplierProducts.find((p) => String(p.id) === String(productId));
      if (product) {
        setValue(`lineItems.${index}.soldQuantity`, (qty || 1) * getMultiplier(product, unitType));
      }
    }
  };

  const handleUnitChange = (unitType: string, index: number) => {
    const productId = lineItems?.[index]?.productId;
    const inputQty = Number(lineItems?.[index]?.noOfBoxes || 1);
    if (productId) {
      const product = supplierProducts.find((p) => String(p.id) === String(productId));
      if (product) {
        setValue(`lineItems.${index}.soldQuantity`, inputQty * getMultiplier(product, unitType));
      }
    }
  };

  const handleRateBlur = async (rate: number | null, index: number) => {
    if (rate === null || rate === undefined) return;
    const productId = lineItems?.[index]?.productId;
    const product = supplierProducts.find((p) => String(p.id) === String(productId));
    if (productId && product) {
      try {
        // The backend requires the full payload for PUT requests
        const payload = {
          ...product,
          ratePerSoldUnit: rate,
          basePrice: rate,
          categoryId: (product as any).categoryId,
          supplierId: (product as any).supplierId,
        };
        await productApi.update(productId, payload);
        message.success('Product database price updated!');
      } catch (e: any) {
        console.error('Update failed:', e?.response?.data || e);
        const errMsg = e?.response?.data?.message || JSON.stringify(e?.response?.data || 'Unknown error');
        message.error(`Update failed: ${errMsg}`);
      }
    }
  };

  const columns = [
    {
      title: 'Product',
      key: 'product',
      width: '30%',
      render: (_: any, __: any, index: number) => (
        <Controller
          name={`lineItems.${index}.productId`}
          control={control}
          render={({ field: f, fieldState: { error } }) => (
            <div>
              <Select
                {...f}
                size="middle"
                placeholder="Search product..."
                options={supplierProducts.map((p) => ({
                  value: String(p.id),
                  label: `${p.sku ? `[${p.sku}] ` : ''}${p.name}`,
                }))}
                showSearch
                optionFilterProp="label"
                style={{ width: '100%', minWidth: 200 }}
                status={error ? 'error' : ''}
                onChange={(val) => {
                  f.onChange(val);
                  handleProductSelect(val, index);
                }}
              />
              {error && <div style={{ color: '#f5222d', fontSize: '11px', marginTop: 4 }}>{error.message}</div>}
            </div>
          )}
        />
      ),
    },
    {
      title: 'Qty',
      key: 'boxes',
      width: '12%',
      render: (_: any, __: any, index: number) => (
        <Controller
          name={`lineItems.${index}.noOfBoxes`}
          control={control}
          render={({ field: f, fieldState: { error } }) => (
            <div>
              <InputNumber onFocus={(e) => e.target.select()} 
                {...f} 
                min={1} 
                size="large"
                style={{ width: '100%', minWidth: '80px', fontSize: '16px', fontWeight: 'bold' }} 
                status={error ? 'error' : ''}
                onChange={(val) => {
                  f.onChange(val);
                  handleQtyChange(val, index);
                }}
              />
              {error && <div style={{ color: '#f5222d', fontSize: '11px', marginTop: 4 }}>{error.message}</div>}
            </div>
          )}
        />
      ),
    },
    {
      title: 'Quantity (Total)',
      key: 'quantity',
      width: '14%',
      render: (_: any, __: any, index: number) => {
        const selectedProductId = lineItems?.[index]?.productId;
        const product = supplierProducts.find(p => String(p.id) === String(selectedProductId));
        const unitType = lineItems?.[index]?.unitType || 'BOX';
        const multiplier = getMultiplier(product, unitType);
        const uom = product?.unitOfMeasure || 'PCS';
        
        return (
          <Controller
            name={`lineItems.${index}.soldQuantity`}
            control={control}
            render={({ field: f, fieldState: { error } }) => (
              <div>
                <InputNumber onFocus={(e) => e.target.select()} 
                  {...f} 
                  min={1}
                  disabled
                  style={{ width: '100%', minWidth: '80px', backgroundColor: '#f5f5f5', color: '#10b981', fontWeight: 600 }} 
                  status={error ? 'error' : ''} 
                />
                {product && (
                  <div style={{ fontSize: '10px', color: '#52c41a', marginTop: 4, whiteSpace: 'nowrap' }}>
                    = {lineItems?.[index]?.noOfBoxes || 0} × {multiplier} {uom}
                  </div>
                )}
              </div>
            )}
          />
        );
      }
    },
    {
      title: 'Unit',
      key: 'unit',
      width: '10%',
      render: (_: any, __: any, index: number) => (
        <Controller
          name={`lineItems.${index}.unitType`}
          control={control}
          render={({ field: f, fieldState: { error } }) => (
            <div>
              <Select
                {...f}
                options={[
                  { label: 'Box', value: 'BOX' },
                  { label: 'Bundle', value: 'BUNDLE' },
                  { label: 'Each', value: 'EACH' },
                ]}
                style={{ width: '100%' }}
                status={error ? 'error' : ''}
                onChange={(val) => {
                  f.onChange(val);
                  handleUnitChange(val, index);
                }}
              />
              {error && <div style={{ color: '#f5222d', fontSize: '11px', marginTop: 4 }}>{error.message}</div>}
            </div>
          )}
        />
      ),
    },
    {
      title: 'Rate',
      key: 'rate',
      width: '16%',
      align: 'right' as const,
      render: (_: any, __: any, index: number) => (
        <Controller
          name={`lineItems.${index}.rate`}
          control={control}
          render={({ field: f, fieldState: { error } }) => (
            <div>
              <InputNumber onFocus={(e) => e.target.select()} 
                {...f} 
                min={0} 
                step={0.01} 
                precision={2} 
                size="large"
                style={{ width: '100%', minWidth: '100px', fontSize: '16px', fontWeight: 'bold' }} 
                status={error ? 'error' : ''} 
                onBlur={(e) => {
                  f.onBlur();
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) {
                    handleRateBlur(val, index);
                  }
                }}
              />
              {error && <div style={{ color: '#f5222d', fontSize: '11px', marginTop: 4 }}>{error.message}</div>}
            </div>
          )}
        />
      ),
    },
    {
      title: 'Amount',
      key: 'amount',
      width: '15%',
      align: 'right' as const,
      render: (_: any, __: any, index: number) => {
        const qty = Number(lineItems?.[index]?.soldQuantity) || 0;
        const rate = Number(lineItems?.[index]?.rate) || 0;
        const rowAmount = qty * rate;
        return (
          <div style={{ fontFamily: 'monospace', fontWeight: 600, paddingTop: 4 }}>
            {rowAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        );
      }
    },
    {
      title: '',
      key: 'actions',
      width: '5%',
      align: 'center' as const,
      render: (_: any, __: any, index: number) => (
        <Tooltip title="Delete row">
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => remove(index)}
            disabled={fields.length === 1}
          />
        </Tooltip>
      ),
    }
  ];

  return (
    <div style={{ width: '100%' }}>
      {errors.lineItems?.root?.message && (
        <div style={{ color: '#f5222d', padding: '8px 24px', backgroundColor: '#fff1f0', borderBottom: '1px solid #ffa39e' }}>
          {errors.lineItems.root.message}
        </div>
      )}
      
      <Table 
        dataSource={fields}
        columns={columns}
        rowKey="id"
        pagination={false}
        size="small"
      />
      
      <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0', backgroundColor: '#fafafa' }}>
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={() => append(emptyLineItem)}
          block
        >
          Add Line Item
        </Button>
      </div>
    </div>
  );
}

