/* eslint-disable @typescript-eslint/no-explicit-any */

import { Button, InputNumber, Select, Tooltip, Table } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Controller, useFieldArray, useWatch } from 'react-hook-form';
import type { Control, UseFormSetValue } from 'react-hook-form';
import type { FormValues } from '../CreatePurchasePage';
import type { Product } from '../../../types/inventory';

interface PurchaseReturnItemGridProps {
  control: Control<FormValues>;
  setValue: UseFormSetValue<FormValues>;
  supplierProducts: Product[];
  errors: any;
}

const emptyReturnItem = {
  productId: '',
  quantity: 1,
  unitType: 'BOX',
  rate: 0,
};

export function PurchaseReturnItemGrid({ control, setValue, supplierProducts, errors }: PurchaseReturnItemGridProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'returnItems',
  });

  const returnItems = useWatch({ control, name: 'returnItems' });



  const handleProductSelect = (productId: string, index: number) => {
    const product = supplierProducts.find((p) => String(p.id) === String(productId));
    if (product) {
      const rate = Number(product.basePrice || product.ratePerSoldUnit || 0);
      const unitType = product.unitType || 'BOX';
      setValue(`returnItems.${index}.rate`, rate);
      setValue(`returnItems.${index}.unitType`, unitType);
      setValue(`returnItems.${index}.amount`, undefined);
    }
  };

  const columns = [
    {
      title: 'Product',
      key: 'product',
      width: '30%',
      render: (_: any, __: any, index: number) => (
        <Controller
          name={`returnItems.${index}.productId`}
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
      width: '12%',
      render: (_: any, __: any, index: number) => (
        <Controller
          name={`returnItems.${index}.unitType`}
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
              />
              {error && <div style={{ color: '#f5222d', fontSize: '11px', marginTop: 4 }}>{error.message}</div>}
            </div>
          )}
        />
      ),
    },
    {
      title: 'Quantity',
      key: 'quantity',
      width: '14%',
      render: (_: any, __: any, index: number) => (
        <Controller
          name={`returnItems.${index}.quantity`}
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
                  setValue(`returnItems.${index}.amount`, undefined);
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
      width: '15%',
      align: 'right' as const,
      render: (_: any, __: any, index: number) => (
        <Controller
          name={`returnItems.${index}.rate`}
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
                onChange={(val) => {
                  f.onChange(val);
                  setValue(`returnItems.${index}.amount`, undefined);
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
        const qty = Number(returnItems?.[index]?.quantity) || 0;
        const rate = Number(returnItems?.[index]?.rate) || 0;
        const autoAmount = qty * rate;
        
        return (
          <Controller
            name={`returnItems.${index}.amount`}
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
          />
        </Tooltip>
      ),
    }
  ];

  return (
    <div style={{ width: '100%' }}>
      {errors.returnItems?.root?.message && (
        <div style={{ color: '#f5222d', padding: '8px 24px', backgroundColor: '#fff1f0', borderBottom: '1px solid #ffa39e' }}>
          {errors.returnItems.root.message}
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
          onClick={() => append(emptyReturnItem)}
          block
        >
          Add Return Item
        </Button>
      </div>
    </div>
  );
}
