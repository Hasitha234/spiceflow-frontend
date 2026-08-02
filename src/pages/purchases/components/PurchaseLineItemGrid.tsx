/* eslint-disable @typescript-eslint/no-explicit-any */

import { Button, InputNumber, Select, Tooltip, Table } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Controller, useFieldArray, useWatch } from 'react-hook-form';
import type { Control, UseFormSetValue } from 'react-hook-form';
import type { FormValues } from '../CreatePurchasePage';
import { emptyLineItem } from '../constants';
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

  const getUnitDivisor = (unitType: string): number => {
    switch (unitType) {
      case 'DZ': return 12;
      case 'EA': return 1;
      case 'MC': return 1000;
      default: return 1;
    }
  };

  const getTotalItemsPerBox = (product: Product | undefined): number => {
    if (!product) return 1;
    const itemsPerSoldUnit = Number(product.itemsPerSoldUnit || 1);
    const soldUnitsPerBox = Number(product.soldUnitsPerBox || 1);
    return itemsPerSoldUnit * soldUnitsPerBox;
  };

  const calcSoldQty = (boxes: number, product: Product | undefined, unitType: string): number => {
    // MC = Master Carton = 1 box, so soldQty always equals boxes
    if (unitType === 'MC') return boxes;
    const totalItems = boxes * getTotalItemsPerBox(product);
    return totalItems / getUnitDivisor(unitType);
  };

  const handleProductSelect = (productId: string, index: number) => {
    const product = supplierProducts.find((p) => String(p.id) === String(productId));
    if (product) {
      const unitType = product.unitType || 'DZ';
      const inputQty = Number(lineItems?.[index]?.noOfBoxes || 1);
      
      // Do NOT auto-fill rate — purchase unit price is separate from selling price
      setValue(`lineItems.${index}.rate`, 0);
      setValue(`lineItems.${index}.unitType`, unitType);
      setValue(`lineItems.${index}.soldQuantity`, calcSoldQty(inputQty, product, unitType));
      setValue(`lineItems.${index}.amount`, undefined);
    }
  };

  const handleQtyChange = (qty: number | null, index: number) => {
    const productId = lineItems?.[index]?.productId;
    if (productId) {
      const product = supplierProducts.find((p) => String(p.id) === String(productId));
      if (product) {
        const unitType = lineItems?.[index]?.unitType || 'DZ';
        setValue(`lineItems.${index}.soldQuantity`, calcSoldQty(qty || 1, product, unitType));
        setValue(`lineItems.${index}.amount`, undefined);
      }
    }
  };

  const handleUnitChange = (newUnit: string, index: number) => {
    const productId = lineItems?.[index]?.productId;
    const boxes = Number(lineItems?.[index]?.noOfBoxes || 1);
    if (productId) {
      const product = supplierProducts.find((p) => String(p.id) === String(productId));
      setValue(`lineItems.${index}.soldQuantity`, calcSoldQty(boxes, product, newUnit));
      setValue(`lineItems.${index}.amount`, undefined);
    }
  };

  const columns = [
    {
      title: '#',
      key: 'index',
      width: '5%',
      render: (_: any, __: any, index: number) => (
        <span style={{ color: '#94A3B8', fontWeight: 500 }}>{index + 1}</span>
      ),
    },
    {
      title: 'Product',
      key: 'product',
      width: '28%',
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
                  label: p.name,
                }))}
                showSearch
                optionFilterProp="label"
                popupMatchSelectWidth={false}
                optionRender={(option) => (
                  <div style={{ whiteSpace: 'normal', wordWrap: 'break-word', maxWidth: '400px' }}>
                    {option.data.label}
                  </div>
                )}
                style={{ width: '100%' }}
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
                size="middle"
                options={[
                  { label: 'DZ', value: 'DZ' },
                  { label: 'MC', value: 'MC' },
                  { label: 'EA', value: 'EA' },
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
      title: 'No. of Boxes',
      key: 'boxes',
      width: '10%',
      render: (_: any, __: any, index: number) => (
        <Controller
          name={`lineItems.${index}.noOfBoxes`}
          control={control}
          render={({ field: f, fieldState: { error } }) => (
            <div>
              <InputNumber onFocus={(e) => e.target.select()} 
                {...f} 
                min={0} 
                step={0.01}
                size="middle"
                style={{ width: '100%' }} 
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
      title: 'Sold Qty',
      key: 'quantity',
      width: '14%',
      render: (_: any, __: any, index: number) => {
        const selectedProductId = lineItems?.[index]?.productId;
        const product = supplierProducts.find(p => String(p.id) === String(selectedProductId));
        const uom = lineItems?.[index]?.unitType || product?.unitType || 'DZ';
        const boxes = lineItems?.[index]?.noOfBoxes || 0;
        const itemsPerSoldUnit = product?.itemsPerSoldUnit || 1;
        const soldUnitsPerBox = product?.soldUnitsPerBox || 1;
        const divisor = getUnitDivisor(uom);
        
        return (
          <Controller
            name={`lineItems.${index}.soldQuantity`}
            control={control}
            render={({ field: f, fieldState: { error } }) => (
              <div>
                <InputNumber onFocus={(e) => e.target.select()} 
                  {...f} 
                  min={0}
                  step={0.01}
                  size="middle"
                  style={{ width: '100%', color: '#10b981', fontWeight: 600 }} 
                  status={error ? 'error' : ''}
                  onChange={(val) => {
                    f.onChange(val);
                  }}
                />
                {product && (
                  <div style={{ fontSize: '12px', color: '#94A3B8', fontFamily: 'monospace', marginTop: 4, whiteSpace: 'nowrap' }}>
                    = {boxes} × {soldUnitsPerBox} × {itemsPerSoldUnit} ÷ {divisor} = {f.value || 0} {uom}
                  </div>
                )}
              </div>
            )}
          />
        );
      }
    },
    {
      title: 'Unit Price',
      key: 'rate',
      width: '13%',
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
                size="middle"
                style={{ width: '100%' }} 
                status={error ? 'error' : ''} 
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
      width: '14%',
      align: 'right' as const,
      render: (_: any, __: any, index: number) => {
        const qty = Number(lineItems?.[index]?.soldQuantity) || 0;
        const rate = Number(lineItems?.[index]?.rate) || 0;
        const autoAmount = qty * rate;
        
        return (
          <Controller
            name={`lineItems.${index}.amount`}
            control={control}
            render={({ field: f, fieldState: { error } }) => {
              const displayValue = f.value !== undefined ? f.value : autoAmount;
              return (
                <div>
                  <InputNumber onFocus={(e) => e.target.select()} 
                    {...f} 
                    value={displayValue}
                    min={0} 
                    step={0.01} 
                    precision={2} 
                    size="middle"
                    style={{ width: '100%', fontWeight: 600 }} 
                    status={error ? 'error' : ''}
                    onChange={(val) => {
                      f.onChange(val);
                    }}
                  />
                  {error && <div style={{ color: '#f5222d', fontSize: '11px', marginTop: 4 }}>{error.message}</div>}
                </div>
              );
            }}
          />
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
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"
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
        tableLayout="fixed"
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

