import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Table, InputNumber, Select, Tag, App, Input, Radio } from 'antd';
import { SwapOutlined, SearchOutlined } from '@ant-design/icons';
import { ResponsiveModal } from '@/components/common';
import { inventoryItemApi } from '../../../api/inventory';
import type { Warehouse, InventoryItem, Product } from '../../../types/inventory';
import { WarehouseTypeBadge } from '../../../components/common/WarehouseTypeBadge';



interface TransferStockModalProps {
  visible: boolean;
  sourceWarehouseId: string;
  sourceWarehouseName: string;
  items: InventoryItem[];
  allWarehouses: Warehouse[];
  allProducts: Product[];
  onClose: () => void;
  onSuccess: () => void;
}

interface TransferItemState {
  totalQty: number;
  boxes: number;
  bundles: number;
  loose: number;
}

export const TransferStockModal: React.FC<TransferStockModalProps> = ({
  visible,
  sourceWarehouseId,
  sourceWarehouseName,
  items,
  allWarehouses,
  allProducts,
  onClose,
  onSuccess,
}) => {
  const { message: appMessage } = App.useApp();
  const [targetWarehouseId, setTargetWarehouseId] = useState<number | null>(null);
  const [transferState, setTransferState] = useState<Record<string, TransferItemState>>({});
  const [transferring, setTransferring] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputMode, setInputMode] = useState<'packaging' | 'totalQty'>('packaging');
  const [notes, setNotes] = useState('');

  // Clear state when modal opens
  useEffect(() => {
    if (visible) {
      setTargetWarehouseId(null);
      setTransferState({});
      setSearchQuery('');
      setNotes('');
      setInputMode('packaging');
    }
  }, [visible]);

  const calculateTotalQty = useCallback((productId: string | number, b: number, bund: number, l: number) => {
    const product = allProducts.find(p => String(p.id) === String(productId));
    if (!product) return 0;
    const perBox = product.soldUnitsPerBox || 0;
    const perUnit = product.itemsPerSoldUnit || 0;
    const itemsPerBox = perBox * perUnit;
    return (b * itemsPerBox) + (bund * perUnit) + l;
  }, [allProducts]);

  const decomposeTotalQty = useCallback((productId: string | number, total: number) => {
    const product = allProducts.find(p => String(p.id) === String(productId));
    if (!product) return { boxes: 0, bundles: 0, loose: total };
    const perBox = product.soldUnitsPerBox || 0;
    const perUnit = product.itemsPerSoldUnit || 0;
    
    let boxes = 0;
    let bundles = 0;
    let loose = total;

    if (perBox > 0 && perUnit > 0) {
      const itemsPerBox = perBox * perUnit;
      boxes = Math.floor(loose / itemsPerBox);
      loose = loose % itemsPerBox;
    }
    
    if (perUnit > 0) {
      bundles = Math.floor(loose / perUnit);
      loose = loose % perUnit;
    }
    return { boxes, bundles, loose };
  }, [allProducts]);

  const handlePackagingChange = (productId: string, field: 'boxes' | 'bundles' | 'loose', val: number) => {
    setTransferState(prev => {
      const current = prev[productId] || { boxes: 0, bundles: 0, loose: 0, totalQty: 0 };
      const next = { ...current, [field]: val };
      next.totalQty = calculateTotalQty(productId, next.boxes, next.bundles, next.loose);
      return { ...prev, [productId]: next };
    });
  };

  const handleTotalQtyChange = (productId: string, val: number) => {
    setTransferState(prev => {
      const decomp = decomposeTotalQty(productId, val);
      return { ...prev, [productId]: { totalQty: val, ...decomp } };
    });
  };

  const availableItems = useMemo(() => {
    let filtered = items.filter(i => i.quantityAvailable > 0 && i.productId);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(i => 
        i.productSku?.toLowerCase().includes(q) || 
        i.productName?.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [items, searchQuery]);

  const totalTransferItemsCount = Object.values(transferState).filter(v => v.totalQty > 0).length;
  const totalTransferQuantity = Object.values(transferState).reduce((acc, v) => acc + v.totalQty, 0);
  const totalTransferValue = Object.entries(transferState).reduce((acc, [productId, state]) => {
    const item = items.find(i => String(i.productId) === productId);
    if (!item) return acc;
    return acc + (state.totalQty * (item.productBasePrice || 0));
  }, 0);

  const handleConfirmTransfer = async () => {
    if (!targetWarehouseId) {
      appMessage.error('Please select a destination warehouse');
      return;
    }

    const itemsToTransfer = Object.entries(transferState)
      .filter(([, state]) => state.totalQty > 0)
      .map(([productId, state]) => ({
        productId: Number(productId),
        quantity: state.totalQty
      }));

    if (itemsToTransfer.length === 0) {
      appMessage.warning('No items specified to transfer. Please enter quantities.');
      return;
    }

    // Validate quantities against available stock
    for (const item of itemsToTransfer) {
      const inventoryItem = items.find(i => String(i.productId) === String(item.productId));
      if (!inventoryItem || inventoryItem.quantityAvailable < item.quantity) {
        appMessage.error(`Insufficient stock for ${inventoryItem?.productName || 'Product ID ' + item.productId}. Available: ${inventoryItem?.quantityAvailable || 0}`);
        return;
      }
    }

    setTransferring(true);
    try {
      await inventoryItemApi.batchTransfer({
        fromWarehouseId: Number(sourceWarehouseId),
        toWarehouseId: Number(targetWarehouseId),
        items: itemsToTransfer,
        notes: notes || `Batch transfer from ${sourceWarehouseName}`
      });
      appMessage.success(`Successfully transferred ${itemsToTransfer.length} items`);
      onSuccess();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      appMessage.error(err?.response?.data?.message || 'Failed to complete the transfer');
    } finally {
      setTransferring(false);
    }
  };

  const columns = [
    { 
      title: 'SKU', 
      dataIndex: 'productSku', 
      key: 'sku',
      width: 120,
      render: (val: string) => <span className="font-mono text-xs text-slate-500">{val}</span> 
    },
    { 
      title: 'Product', 
      dataIndex: 'productName', 
      key: 'name',
      render: (val: string, record: InventoryItem) => (
        <div>
          <div className="font-medium text-slate-700">{val}</div>
          <div className="text-xs text-slate-400">Rs. {(record.productBasePrice || 0).toLocaleString()}</div>
        </div>
      )
    },
    { 
      title: 'Available', 
      dataIndex: 'quantityAvailable', 
      key: 'avail', 
      align: 'right' as const,
      width: 100,
      render: (val: number) => <Tag color="blue" className="font-mono tabular-nums">{val}</Tag> 
    },
    ...(inputMode === 'packaging' ? [
      {
        title: 'Boxes',
        key: 'boxes',
        width: 100,
        align: 'right' as const,
        render: (_: unknown, record: InventoryItem) => {
          const val = transferState[String(record.productId)]?.boxes || 0;
          return (
            <InputNumber
              min={0}
              value={val}
              onChange={v => handlePackagingChange(String(record.productId), 'boxes', Number(v || 0))}
              style={{ width: '100%' }}
              onFocus={e => e.target.select()}
            />
          );
        }
      },
      {
        title: 'Bundles',
        key: 'bundles',
        width: 100,
        align: 'right' as const,
        render: (_: unknown, record: InventoryItem) => {
          const val = transferState[String(record.productId)]?.bundles || 0;
          return (
            <InputNumber
              min={0}
              value={val}
              onChange={v => handlePackagingChange(String(record.productId), 'bundles', Number(v || 0))}
              style={{ width: '100%' }}
              onFocus={e => e.target.select()}
            />
          );
        }
      },
      {
        title: 'Loose',
        key: 'loose',
        width: 100,
        align: 'right' as const,
        render: (_: unknown, record: InventoryItem) => {
          const val = transferState[String(record.productId)]?.loose || 0;
          return (
            <InputNumber
              min={0}
              value={val}
              onChange={v => handlePackagingChange(String(record.productId), 'loose', Number(v || 0))}
              style={{ width: '100%' }}
              onFocus={e => e.target.select()}
            />
          );
        }
      }
    ] : []),
    {
      title: 'Total Transfer Qty',
      key: 'transferQty',
      align: 'right' as const,
      width: 140,
      render: (_: unknown, record: InventoryItem) => {
        const val = transferState[String(record.productId)]?.totalQty || 0;
        const isError = val > record.quantityAvailable;
        return (
          <InputNumber
            min={0}
            max={record.quantityAvailable}
            value={val}
            onChange={v => handleTotalQtyChange(String(record.productId), Number(v || 0))}
            status={isError ? 'error' : undefined}
            disabled={inputMode === 'packaging'}
            style={{ width: '100%', ...(inputMode === 'packaging' ? { backgroundColor: 'var(--color-surface-subtle)' } : {}) }}
            onFocus={e => inputMode === 'totalQty' && e.target.select()}
          />
        );
      },
    },
    {
      title: 'Line Value',
      key: 'lineValue',
      align: 'right' as const,
      width: 120,
      render: (_: unknown, record: InventoryItem) => {
        const val = transferState[String(record.productId)]?.totalQty || 0;
        const lineVal = val * (record.productBasePrice || 0);
        return (
          <span className="font-mono text-sm font-semibold text-emerald-600">
            {lineVal > 0 ? `Rs. ${lineVal.toLocaleString()}` : '-'}
          </span>
        );
      }
    }
  ];

  return (
    <ResponsiveModal
      title={
        <div className="flex items-center gap-2 text-lg text-slate-800 dark:text-slate-200">
          <SwapOutlined className="text-emerald-500" />
          <span>Transfer Stock</span>
          <span className="mx-2 text-slate-300">|</span>
          <span className="text-sm font-normal text-slate-500">From <strong className="text-slate-700">{sourceWarehouseName}</strong></span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      onOk={handleConfirmTransfer}
      confirmLoading={transferring}
      okText="Confirm Transfer"
      okButtonProps={{ className: 'bg-emerald-600 hover:bg-emerald-500', disabled: totalTransferItemsCount === 0 }}
      width={1000}
      destroyOnHidden
    >
      <div className="space-y-6 my-4">
        {/* Step 1: Destination Selection */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <label className="block text-sm font-semibold text-slate-800 mb-2">1. Select Destination Warehouse</label>
          <Select
            value={targetWarehouseId}
            onChange={val => setTargetWarehouseId(val)}
            className="w-full max-w-md"
            placeholder="Where should this stock go?"
            size="large"
            status={!targetWarehouseId && totalTransferItemsCount > 0 ? 'error' : undefined}
          >
            {allWarehouses
              .filter(w => String(w.id) !== String(sourceWarehouseId))
              .map(w => (
                <Select.Option key={w.id} value={w.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{w.name}</span>
                    <WarehouseTypeBadge storeType={w.storeType} />
                  </div>
                </Select.Option>
              ))}
          </Select>
        </div>

        {/* Step 2: Item Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-semibold text-slate-800">2. Select Items to Transfer</label>
            
            <div className="flex items-center gap-4">
              <Radio.Group
                value={inputMode}
                onChange={e => setInputMode(e.target.value)}
                optionType="button"
                buttonStyle="solid"
                size="small"
              >
                <Radio.Button value="packaging">By Packaging</Radio.Button>
                <Radio.Button value="totalQty">By Total Qty</Radio.Button>
              </Radio.Group>
              
              <Input
                placeholder="Search products..."
                prefix={<SearchOutlined className="text-slate-400" />}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-64"
                allowClear
              />
            </div>
          </div>
          
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <Table
              dataSource={availableItems}
              rowKey="productId"
              pagination={false}
              size="small"
              columns={columns}
              scroll={{ y: 400 }}
              locale={{ emptyText: 'No stock available to transfer matching your search.' }}
            />
          </div>
        </div>

        {/* Step 3: Optional Notes */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-2">3. Additional Notes (Optional)</label>
          <Input.TextArea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add any reason or reference for this transfer..."
            rows={2}
          />
        </div>

        {/* Summary Footer */}
        {totalTransferItemsCount > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="text-emerald-800 font-medium">Transfer Summary</div>
              <div className="text-sm text-emerald-600 mt-1">
                Moving {totalTransferQuantity.toLocaleString()} units across {totalTransferItemsCount} products
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-emerald-600 font-medium uppercase tracking-wider mb-1">Estimated Transfer Value</div>
              <div className="text-2xl font-bold text-emerald-700 font-mono">
                Rs. {totalTransferValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        )}
      </div>
    </ResponsiveModal>
  );
};
