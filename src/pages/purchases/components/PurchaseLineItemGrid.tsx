import React from 'react';
import { Button, Input, InputNumber, Select, Tooltip, Table } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Controller, useFieldArray, useWatch } from 'react-hook-form';
import type { Control, UseFormSetValue } from 'react-hook-form';
import type { FormValues } from '../CreatePurchasePage';
import { emptyLineItem } from '../CreatePurchasePage';
import type { Product } from '../../../types/inventory';

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

  const handleProductSelect = (productId: string, index: number) => {
    const product = supplierProducts.find((p) => String(p.id) === String(productId));
    if (product) {
      const rate = Number(product.ratePerSoldUnit ?? product.basePrice ?? 0);
      const itemsPerBox = Number(product.itemsPerSoldUnit ?? 1);
      const boxes = Number(lineItems?.[index]?.noOfBoxes || 1);
      
      setValue(`lineItems.${index}.rate`, rate);
      setValue(`lineItems.${index}.unitType`, product.unitType || 'BOX');
      setValue(`lineItems.${index}.soldQuantity`, boxes * itemsPerBox);
    }
  };

  const handleBoxesChange = (boxes: number | null, index: number) => {
    const productId = lineItems?.[index]?.productId;
    if (productId) {
      const product = supplierProducts.find((p) => String(p.id) === String(productId));
      if (product) {
        const itemsPerBox = Number(product.itemsPerSoldUnit ?? 1);
        setValue(`lineItems.${index}.soldQuantity`, (boxes || 1) * itemsPerBox);
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
      title: 'Boxes',
      key: 'boxes',
      width: '12%',
      render: (_: any, __: any, index: number) => (
        <Controller
          name={`lineItems.${index}.noOfBoxes`}
          control={control}
          render={({ field: f, fieldState: { error } }) => (
            <div>
              <InputNumber 
                {...f} 
                min={1} 
                style={{ width: '100%' }} 
                status={error ? 'error' : ''}
                onChange={(val) => {
                  f.onChange(val);
                  handleBoxesChange(val, index);
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
      width: '12%',
      render: (_: any, __: any, index: number) => {
        const selectedProductId = lineItems?.[index]?.productId;
        const product = supplierProducts.find(p => String(p.id) === String(selectedProductId));
        const itemsPerBox = product?.itemsPerSoldUnit;
        return (
          <Controller
            name={`lineItems.${index}.soldQuantity`}
            control={control}
            render={({ field: f, fieldState: { error } }) => (
              <div>
                <InputNumber 
                  {...f} 
                  min={1} 
                  readOnly 
                  variant="filled"
                  style={{ width: '100%', backgroundColor: '#f0f2f5', color: '#595959' }} 
                  status={error ? 'error' : ''} 
                />
                {itemsPerBox && (
                  <div style={{ fontSize: '10px', color: '#52c41a', marginTop: 4, whiteSpace: 'nowrap' }}>
                    = {lineItems?.[index]?.noOfBoxes || 0} × {itemsPerBox} {product?.unitType || 'Units'}
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
      width: '12%',
      render: (_: any, __: any, index: number) => (
        <Controller
          name={`lineItems.${index}.unitType`}
          control={control}
          render={({ field: f, fieldState: { error } }) => (
            <div>
              <Input {...f} placeholder="BOX" style={{ width: '100%' }} status={error ? 'error' : ''} />
              {error && <div style={{ color: '#f5222d', fontSize: '11px', marginTop: 4 }}>{error.message}</div>}
            </div>
          )}
        />
      ),
    },
    {
      title: 'Rate',
      key: 'rate',
      width: '14%',
      align: 'right' as const,
      render: (_: any, __: any, index: number) => (
        <Controller
          name={`lineItems.${index}.rate`}
          control={control}
          render={({ field: f, fieldState: { error } }) => (
            <div>
              <InputNumber {...f} min={0} step={0.01} precision={2} style={{ width: '100%' }} status={error ? 'error' : ''} />
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
