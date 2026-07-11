import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Col, Row, Tag, Typography, Button, Spin, Table, Statistic } from 'antd';
import { ArrowLeftOutlined, AppstoreOutlined, ShoppingOutlined, DollarOutlined } from '@ant-design/icons';
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

function WarehouseGrid({ onSelect, t }: { onSelect: (id: string) => void; t: any }) {
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

  const getStoreTypeColor = (type: string) => {
    switch (type) {
      case 'MAIN': return 'green';
      case 'VEHICLE': return 'blue';
      default: return 'default';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2} style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
          {t('inventory.title', 'Inventory')}
        </Title>
        <Text style={{ fontSize: '0.875rem', marginTop: '0.5rem', display: 'block', color: 'var(--text-secondary)' }}>
          {t('inventory.warehouseGrid', 'Select a warehouse to view inventory.')}
        </Text>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {warehouses.map((wh) => (
            <Col xs={24} sm={12} lg={8} key={wh.id}>
              <Card
                hoverable
                onClick={() => onSelect(wh.id)}
                styles={{ body: { padding: '24px' } }}
                className="rounded-lg shadow-sm border border-slate-200 h-full cursor-pointer transition-colors hover:border-emerald-600 hover:shadow-md"
              >
                <div className="flex justify-between items-start mb-4">
                  <Title level={4} style={{ margin: 0, color: '#0f172a' }}>
                    {wh.name}
                  </Title>
                  <Tag color={getStoreTypeColor(wh.storeType)} className="m-0 uppercase font-semibold">
                    {wh.storeType}
                  </Tag>
                </div>
                {wh.location && (
                  <Text className="text-slate-500 block mb-4">
                    {wh.location}
                  </Text>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}

// ─── Level 2: Warehouse Detail ─────────────────────────────────────────────

function WarehouseDetail({ warehouseId, onBack, t }: { warehouseId: string; onBack: () => void; t: any }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [whRes, itemsRes] = await Promise.all([
          warehouseApi.get(warehouseId),
          inventoryItemApi.list({ warehouseId, size: 500 }), // Get all items for this warehouse
        ]);
        setWarehouse(whRes);
        setItems(itemsRes?.content || []);
      } catch (error) {
        console.error('Failed to fetch warehouse details', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [warehouseId]);

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
        
        let loose = total;
        if (perUnit > 0) {
          loose = total % perUnit;
          return <span className="font-semibold text-slate-900 tabular-nums">{loose}</span>;
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
          <Tag color={warehouse.storeType === 'MAIN' ? 'green' : warehouse.storeType === 'VEHICLE' ? 'blue' : 'default'} className="m-0 uppercase font-semibold">
            {warehouse.storeType}
          </Tag>
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
    </div>
  );
}
