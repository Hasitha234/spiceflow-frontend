import { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Card, Col, Row, Tag, Typography, Button, Spin, Table, Statistic, Modal, InputNumber, Select, message } from 'antd';
import { ArrowLeftOutlined, AppstoreOutlined, ShoppingOutlined, DollarOutlined, RightOutlined, ReloadOutlined } from '@ant-design/icons';
import { warehouseApi, inventoryItemApi } from '../api/inventory';
import type { Warehouse, InventoryItem } from '../types/inventory';

const { Title, Text } = Typography;

export function InventoryPage() {
  const { t } = useTranslation();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);

  if (selectedWarehouseId) {
    return (
      <WarehouseDetail
        warehouseId={selectedWarehouseId}
        onBack={() => setSelectedWarehouseId(null)}
        t={t}
      />
    );
  }

  return <WarehouseGrid onSelect={setSelectedWarehouseId} t={t} />;
}

// ─── Level 1: Warehouse Grid ───────────────────────────────────────────────

function WarehouseGrid({ onSelect, t }: { onSelect: (id: string) => void; t: TFunction }) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWarehouses() {
      try {
        const res = await warehouseApi.list({ size: 100 });
        setWarehouses(res?.content || []);
      } catch (error) {
        console.error('Failed to load warehouses', error);
      } finally {
        setLoading(false);
      }
    }
    fetchWarehouses();
  }, []);



  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold m-0 text-slate-900">
          {t('inventory.title', 'Inventory')}
        </h2>
        <span className="text-slate-500 text-sm mt-2 block">
          {t('inventory.warehouseGrid', 'Select a warehouse to view inventory.')}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[24, 24]}>
          {warehouses.map((wh) => (
            <Col xs={24} sm={12} lg={8} key={wh.id}>
              <Card
                hoverable
                onClick={() => onSelect(wh.id)}
                styles={{ body: { padding: '24px' } }}
                className="rounded-lg shadow-sm border border-slate-200 h-full cursor-pointer transition-all hover:border-emerald-600 hover:shadow-md group"
              >
                <div className="flex justify-between items-center h-full">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="m-0 text-lg font-semibold text-slate-900 leading-none">
                        {wh.name}
                      </h3>
                      {wh.storeType === 'MAIN' && (
                        <span className="px-2 py-0.5 text-[12px] font-semibold text-emerald-800 bg-emerald-100 rounded leading-none flex items-center">
                          MAIN
                        </span>
                      )}
                      {wh.storeType === 'VEHICLE' && (
                        <span className="px-2 py-0.5 text-[12px] font-semibold text-blue-800 bg-blue-100 rounded leading-none flex items-center">
                          VEHICLE
                        </span>
                      )}
                      {wh.storeType === 'CUSTOM' && (
                        <span className="px-2 py-0.5 text-[12px] font-semibold text-slate-800 bg-slate-100 rounded leading-none flex items-center">
                          CUSTOM
                        </span>
                      )}
                    </div>
                    {wh.location && (
                      <span className="text-slate-500 text-sm block">
                        {wh.location}
                      </span>
                    )}
                  </div>
                  <RightOutlined className="text-slate-400 transition-colors group-hover:text-emerald-600" />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}

// ─── Level 2: Warehouse Detail ─────────────────────────────────────────────

function WarehouseDetail({ warehouseId, onBack, t }: { warehouseId: string; onBack: () => void; t: TFunction }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [loading, setLoading] = useState(true);
  const [unloadModalVisible, setUnloadModalVisible] = useState(false);
  const [allWarehouses, setAllWarehouses] = useState<Warehouse[]>([]);
  const [targetWarehouseId, setTargetWarehouseId] = useState<number | null>(null);
  const [unloadQuantities, setUnloadQuantities] = useState<Record<string, number>>({});
  const [unloading, setUnloading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [whRes, itemsRes, allWhRes] = await Promise.all([
        warehouseApi.get(warehouseId),
        inventoryItemApi.list({ warehouseId, size: 500 }),
        warehouseApi.list({ size: 100 }),
      ]);
      setWarehouse(whRes);
      setItems(itemsRes?.content || []);
      const whList = allWhRes?.content || [];
      setAllWarehouses(whList);
      const mainWh = whList.find(w => w.storeType === 'MAIN');
      if (mainWh && mainWh.id) {
        setTargetWarehouseId(Number(mainWh.id));
      } else if (whList.length > 0) {
        const firstOther = whList.find(w => String(w.id) !== String(warehouseId));
        if (firstOther && firstOther.id) setTargetWarehouseId(Number(firstOther.id));
      }
    } catch (error) {
      console.error('Failed to fetch warehouse details', error);
    } finally {
      setLoading(false);
    }
  }, [warehouseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenUnload = () => {
    const initialQtys: Record<string, number> = {};
    items.forEach(item => {
      if (item.quantityAvailable > 0 && item.productId) {
        initialQtys[String(item.productId)] = item.quantityAvailable;
      }
    });
    setUnloadQuantities(initialQtys);
    setUnloadModalVisible(true);
  };

  const handleConfirmUnload = async () => {
    if (!targetWarehouseId) {
      message.error('Please select a destination warehouse');
      return;
    }
    const itemsToUnload = Object.entries(unloadQuantities).filter(([, qty]) => qty > 0);
    if (itemsToUnload.length === 0) {
      message.warning('No items specified to unload');
      return;
    }
    setUnloading(true);
    try {
      for (const [prodId, qty] of itemsToUnload) {
        await inventoryItemApi.transfer({
          fromWarehouseId: Number(warehouseId),
          toWarehouseId: Number(targetWarehouseId),
          productId: Number(prodId),
          quantity: qty,
          reason: 'Unloading vehicle after route completion',
        });
      }
      message.success('Vehicle inventory successfully unloaded');
      setUnloadModalVisible(false);
      fetchData();
    } catch {
      message.error('Failed to unload some items');
    } finally {
      setUnloading(false);
    }
  };

  const totalProducts = items.length;
  const totalUnits = items.reduce((acc, item) => acc + item.quantityAvailable, 0);
  const totalValue = items.reduce((acc, item) => acc + (item.quantityAvailable * (item.productBasePrice || 0)), 0);

  const columns = useMemo(() => [
    {
      title: 'SKU',
      dataIndex: 'productSku',
      key: 'productSku',
      render: (sku: string) => <Text strong className="text-slate-900">{sku}</Text>,
    },
    {
      title: t('purchase.product', 'Product'),
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: t('inventory.boxes', 'Boxes'),
      key: 'boxes',
      align: 'right' as const,
      render: (_: unknown, record: InventoryItem) => {
        const total = record.quantityAvailable;
        const perBox = record.soldUnitsPerBox || 0;
        const perUnit = record.itemsPerSoldUnit || 0;
        
        if (perBox > 0 && perUnit > 0) {
          const itemsPerBox = perBox * perUnit;
          const boxes = Math.floor(total / itemsPerBox);
          return <span className="font-semibold text-slate-900 tabular-nums">{boxes}</span>;
        }
        return <span className="text-slate-400 tabular-nums">-</span>;
      },
    },
    {
      title: t('inventory.bundles', 'Bundles'),
      key: 'bundles',
      align: 'right' as const,
      render: (_: unknown, record: InventoryItem) => {
        const total = record.quantityAvailable;
        const perBox = record.soldUnitsPerBox || 0;
        const perUnit = record.itemsPerSoldUnit || 0;
        
        let remainder = total;
        if (perBox > 0 && perUnit > 0) {
          const itemsPerBox = perBox * perUnit;
          remainder = total % itemsPerBox;
        }

        if (perUnit > 0) {
          const bundles = Math.floor(remainder / perUnit);
          return <span className="font-semibold text-slate-900 tabular-nums">{bundles}</span>;
        }
        return <span className="text-slate-400 tabular-nums">-</span>;
      },
    },
    {
      title: t('inventory.loose', 'Loose'),
      key: 'loose',
      align: 'right' as const,
      render: (_: unknown, record: InventoryItem) => {
        const total = record.quantityAvailable;
        const perUnit = record.itemsPerSoldUnit || 0;
        
        if (perUnit > 0) {
          const looseAmount = total % perUnit;
          return <span className="font-semibold text-slate-900 tabular-nums">{looseAmount}</span>;
        }
        return <span className="text-slate-400 tabular-nums">-</span>;
      },
    },
    {
      title: t('inventory.totalQty', 'Total Qty'),
      dataIndex: 'quantityAvailable',
      key: 'quantityAvailable',
      align: 'right' as const,
      render: (qty: number) => <span className="text-emerald-700 font-bold tabular-nums">{qty}</span>,
    },
    {
      title: t('inventory.totalValue', 'Total Value (LKR)'),
      key: 'totalValue',
      align: 'right' as const,
      render: (_: unknown, record: InventoryItem) => {
        const val = record.quantityAvailable * (record.productBasePrice || 0);
        return <span className="font-semibold text-slate-900 tabular-nums">{val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
      }
    }
  ], [t]);

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={onBack}
          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 -ml-4"
        >
          {t('inventory.backToWarehouses', 'Back to Warehouses')}
        </Button>
        <Title level={2} style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0, color: '#0f172a' }}>
          {warehouse?.name || '...'}
        </Title>
        {warehouse && (
          <Tag color={warehouse.storeType === 'MAIN' ? 'green' : warehouse.storeType === 'VEHICLE' || warehouse.storeType === 'CUSTOM' ? 'blue' : 'default'} className="m-0 uppercase font-semibold">
            {warehouse.storeType}
          </Tag>
        )}
        {(warehouse?.storeType === 'CUSTOM' || warehouse?.storeType === 'VEHICLE' || warehouse?.name?.startsWith('Vehicle')) && (
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={handleOpenUnload}
            className="ml-auto bg-emerald-600 hover:bg-emerald-500 shadow-sm font-medium"
          >
            Unload Vehicle
          </Button>
        )}
      </div>

      <Row gutter={[16, 16]} className="w-full mb-6 mx-0">
        <Col xs={24} sm={8}>
          <Card styles={{ body: { padding: '24px' } }} className="rounded-lg shadow-sm border border-slate-200">
            <Statistic
              title={
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <AppstoreOutlined className="text-emerald-600" /> <span>{t('inventory.totalProducts', 'Total Products')}</span>
                </div>
              }
              value={totalProducts}
              valueStyle={{ fontWeight: 600, fontSize: '1.5rem', color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card styles={{ body: { padding: '24px' } }} className="rounded-lg shadow-sm border border-slate-200">
            <Statistic
              title={
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <ShoppingOutlined className="text-emerald-600" /> <span>{t('inventory.totalUnits', 'Total Units')}</span>
                </div>
              }
              value={totalUnits}
              valueStyle={{ fontWeight: 600, fontSize: '1.5rem', color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card styles={{ body: { padding: '24px' } }} className="rounded-lg shadow-sm border border-slate-200">
            <Statistic
              title={
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <DollarOutlined className="text-emerald-600" /> <span>{t('inventory.totalValue', 'Estimated Value (LKR)')}</span>
                </div>
              }
              value={totalValue}
              precision={2}
              valueStyle={{ fontWeight: 600, fontSize: '1.5rem', color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}
            />
          </Card>
        </Col>
      </Row>

      <Card styles={{ body: { padding: 0 } }} className="rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={items}
          columns={columns}
          pagination={{ pageSize: 20, className: 'px-4 py-3 border-t border-slate-100 m-0' }}
          locale={{ emptyText: t('inventory.noItems', 'No inventory items in this warehouse.') }}
          className="spiceflow-table"
        />
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-2 text-lg text-slate-800 dark:text-slate-200">
            <ReloadOutlined className="text-emerald-500" />
            <span>Unload Vehicle Inventory</span>
          </div>
        }
        open={unloadModalVisible}
        onCancel={() => setUnloadModalVisible(false)}
        onOk={handleConfirmUnload}
        confirmLoading={unloading}
        okText="Confirm Unload"
        okButtonProps={{ className: 'bg-emerald-600 hover:bg-emerald-500' }}
        width={700}
      >
        <div className="space-y-4 my-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Destination Warehouse</label>
            <Select
              value={targetWarehouseId}
              onChange={val => setTargetWarehouseId(val)}
              className="w-full"
              placeholder="Select warehouse to transfer inventory into"
            >
              {allWarehouses
                .filter(w => String(w.id) !== String(warehouseId))
                .map(w => (
                  <Select.Option key={w.id} value={w.id}>
                    {w.name} ({w.storeType})
                  </Select.Option>
                ))}
            </Select>
          </div>

          <div className="mt-4">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Select Items to Unload</h4>
            <Table
              dataSource={items.filter(i => i.quantityAvailable > 0 && i.productId)}
              rowKey="productId"
              pagination={false}
              size="small"
              columns={[
                { title: 'SKU', dataIndex: 'productSku', key: 'sku', render: (val: string) => <span className="font-mono">{val}</span> },
                { title: 'Product', dataIndex: 'productName', key: 'name' },
                { title: 'On Vehicle', dataIndex: 'quantityAvailable', key: 'avail', align: 'right' as const, render: (val: number) => <Tag color="blue">{val}</Tag> },
                {
                  title: 'Qty to Unload',
                  key: 'unloadQty',
                  align: 'right' as const,
                  render: (_: unknown, record: InventoryItem) => (
                    <InputNumber
                      min={0}
                      max={record.quantityAvailable}
                      value={unloadQuantities[String(record.productId)] ?? 0}
                      onChange={val => {
                        setUnloadQuantities(prev => ({
                          ...prev,
                          [String(record.productId)]: Number(val || 0),
                        }));
                      }}
                      style={{ width: 100 }}
                    />
                  ),
                },
              ]}
              locale={{ emptyText: 'No items currently loaded on this vehicle.' }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
