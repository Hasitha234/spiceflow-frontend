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
  setSupplierProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  errors: any;
}

export function PurchaseLineItemGrid({ control, setValue, supplierProducts, setSupplierProducts, errors }: PurchaseLineItemGridProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lineItems',
  });

  const lineItems = useWatch({ control, name: 'lineItems' });

  const getMultiplier = (product: Product | undefined) => {
    if (!product) return 1;
    const itemsPerSoldUnit = Number(product.itemsPerSoldUnit || 1);
    const soldUnitsPerBox = Number(product.soldUnitsPerBox || 1);
    
    return itemsPerSoldUnit * soldUnitsPerBox;
  };

  const handleProductSelect = (productId: string, index: number) => {
    const product = supplierProducts.find((p) => String(p.id) === String(productId));
    if (product) {
      const rate = Number(product.basePrice || product.ratePerSoldUnit || 0);
      const unitType = product.unitType || 'BOX';
      const inputQty = Number(lineItems?.[index]?.noOfBoxes || 1);
      
      setValue(`lineItems.${index}.rate`, rate);
      setValue(`lineItems.${index}.unitType`, unitType);
      setValue(`lineItems.${index}.soldQuantity`, inputQty * getMultiplier(product));
      setValue(`lineItems.${index}.amount`, undefined);
    }
  };

  const handleQtyChange = (qty: number | null, index: number) => {
    const productId = lineItems?.[index]?.productId;
    if (productId) {
      const product = supplierProducts.find((p) => String(p.id) === String(productId));
      if (product) {
        setValue(`lineItems.${index}.soldQuantity`, (qty || 1) * getMultiplier(product));
        setValue(`lineItems.${index}.amount`, undefined);
      }
    }
  };



  const handleTotalQtyBlur = async (totalQty: number | null, index: number) => {
    if (!totalQty || totalQty < 1) return;
    const productId = lineItems?.[index]?.productId;
    const noOfBoxes = Number(lineItems?.[index]?.noOfBoxes || 1);
    const product = supplierProducts.find((p) => String(p.id) === String(productId));
    if (!productId || !product) return;

    setValue(`lineItems.${index}.amount`, undefined);
    const newMultiplier = totalQty / noOfBoxes;
    
    const newItemsPerSoldUnit = product.itemsPerSoldUnit || 1;
    const newSoldUnitsPerBox = Math.max(1, Math.round(newMultiplier / newItemsPerSoldUnit));

    try {
      const payload = {
        ...product,
        itemsPerSoldUnit: newItemsPerSoldUnit,
        soldUnitsPerBox: newSoldUnitsPerBox,
        categoryId: (product as any).categoryId,
        supplierId: (product as any).supplierId,
      };
      await productApi.update(productId, payload);

      // Update local state so multiplier recalculates in the UI
      setSupplierProducts(prev => prev.map(p => 
        String(p.id) === String(productId) 
          ? { ...p, itemsPerSoldUnit: newItemsPerSoldUnit, soldUnitsPerBox: newSoldUnitsPerBox }
          : p
      ));

      message.success('Product box configuration updated!');
    } catch (e: any) {
      console.error('Box config update failed:', e?.response?.data || e);
      const errMsg = e?.response?.data?.message || 'Unknown error';
      message.error(`Update failed: ${errMsg}`);
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
        setValue(`lineItems.${index}.amount`, undefined);
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
                  label: `${p.sku ? `[${p.sku}] ` : ''}${p.name}`,
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
                  { label: 'Box', value: 'BOX' },
                  { label: 'Bundle', value: 'BUNDLE' },
                  { label: 'Each', value: 'EACH' },
                ]}
                style={{ width: '100%' }}
                status={error ? 'error' : ''}
                onChange={(val) => {
                  f.onChange(val);
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
      width: '10%',
      render: (_: any, __: any, index: number) => (
        <Controller
          name={`lineItems.${index}.noOfBoxes`}
          control={control}
          render={({ field: f, fieldState: { error } }) => (
            <div>
              <InputNumber onFocus={(e) => e.target.select()} 
                {...f} 
                min={1} 
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
      title: 'Quantity (Total)',
      key: 'quantity',
      width: '14%',
      render: (_: any, __: any, index: number) => {
        const selectedProductId = lineItems?.[index]?.productId;
        const product = supplierProducts.find(p => String(p.id) === String(selectedProductId));
        const multiplier = getMultiplier(product);
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
                  size="middle"
                  style={{ width: '100%', color: '#10b981', fontWeight: 600 }} 
                  status={error ? 'error' : ''}
                  onChange={(val) => {
                    f.onChange(val);
                  }}
                  onBlur={(e) => {
                    f.onBlur();
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) {
                      handleTotalQtyBlur(val, index);
                    }
                  }}
                />
                {product && (
                  <div style={{ fontSize: '12px', color: '#94A3B8', fontFamily: 'monospace', marginTop: 4, whiteSpace: 'nowrap' }}>
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
      title: 'Rate',
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

