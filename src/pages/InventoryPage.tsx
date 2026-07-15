import { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Card, Col, Row, Tag, Button, Spin, Table, Statistic, Modal, InputNumber, Select, message, Form, Input, DatePicker, Popconfirm, Tooltip, Space, Tabs } from 'antd';
import { ArrowLeftOutlined, AppstoreOutlined, ShoppingOutlined, DollarOutlined, ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, CarOutlined, ShopOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { warehouseApi, inventoryItemApi, productApi } from '../api/inventory';
import type { Warehouse, InventoryItem, Product } from '../types/inventory';
import dayjs from 'dayjs';
import { VehicleLoadingSheetsTab } from '../features/inventory/components/VehicleLoadingSheetsTab';
import { WarehouseTypeBadge } from '../components/common/WarehouseTypeBadge';

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
  const [summaryMap, setSummaryMap] = useState<Record<string, { products: number; units: number; value: number }>>({});

  useEffect(() => {
    async function fetchWarehouses() {
      try {
        const res = await warehouseApi.list({ size: 100 });
        const whList = res?.content || [];
        setWarehouses(whList);
        
        // Fetch summaries in a second pass
        const newSummaryMap: Record<string, { products: number; units: number; value: number }> = {};
        await Promise.all(
          whList.map(async (wh) => {
            try {
              const itemsRes = await inventoryItemApi.list({ warehouseId: wh.id, size: 500 });
              const data = itemsRes?.content || [];
              newSummaryMap[wh.id] = {
                products: data.length,
                units: data.reduce((s, i) => s + i.quantityAvailable, 0),
                value: data.reduce((s, i) => s + (i.quantityAvailable * (i.productBasePrice || 0)), 0),
              };
            } catch (err) {
              console.error(`Failed to fetch items for warehouse ${wh.id}`, err);
            }
          })
        );
        setSummaryMap(newSummaryMap);
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
      <div className="mb-10">
        <h2 style={{
          fontSize: '28px',
          fontWeight: 700,
          letterSpacing: '-0.025em',
          lineHeight: 1.2,
          color: 'var(--color-text-primary)',
          margin: 0,
          marginBottom: '32px',
        }}>
          {t('inventory.title', 'Inventory')}
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[24, 24]}>
          {warehouses.map((wh) => {
            const summary = summaryMap[wh.id];
            return (
              <Col xs={24} md={12} key={wh.id}>
                <button
                  type="button"
                  onClick={() => onSelect(wh.id)}
                  aria-label={`View inventory for ${wh.name}`}
                  className="sf-focus-ring"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: 'none',
                    padding: 0,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      background: 'var(--color-surface-default)',
                      border: '1px solid var(--color-border-default)',
                      borderLeft: `4px solid ${
                        wh.storeType === 'MAIN' ? 'var(--color-primary)'
                        : wh.storeType === 'VEHICLE' ? '#2563eb'
                        : '#7c3aed'
                      }`,
                      borderRadius: '0 8px 8px 0',
                      padding: '20px 24px',
                      transition: 'box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1), border-color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)';
                      (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border-strong)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)';
                      (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border-default)';
                    }}
                  >
                    {/* Header row: name + badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: 'var(--color-primary)', fontSize: '18px', lineHeight: 1 }}>
                          {wh.storeType === 'VEHICLE' ? <CarOutlined /> : <ShopOutlined />}
                        </span>
                        <span style={{
                          fontSize: '16px',
                          fontWeight: 700,
                          color: 'var(--color-text-primary)',
                          letterSpacing: '-0.01em',
                          lineHeight: 1.2,
                        }}>
                          {wh.name}
                        </span>
                        <WarehouseTypeBadge storeType={wh.storeType} />
                      </div>
                      <ArrowRightOutlined aria-hidden="true" style={{ color: 'var(--color-text-tertiary)', fontSize: '13px' }} />
                    </div>

                    {/* Summary stats row */}
                    {summary ? (
                      <div style={{ display: 'flex', gap: '20px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                          <strong style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                            {summary.products}
                          </strong>
                          {' '}products
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                          <strong style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                            {summary.units.toLocaleString()}
                          </strong>
                          {' '}units
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                          Rs.{' '}
                          <strong style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                            {(summary.value / 1_000_000).toFixed(1)}M
                          </strong>
                          {' '}est. value
                        </span>
                      </div>
                    ) : (
                      <div style={{ height: '18px', marginBottom: '12px' }}></div>
                    )}

                    {/* Location if present */}
                    {wh.location && (
                      <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', margin: 0, lineHeight: 1.4 }}>
                        {wh.location}
                      </p>
                    )}
                  </div>
                </button>
              </Col>
            );
          })}
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

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [savingItem, setSavingItem] = useState(false);
  const [form] = Form.useForm();
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('ALL');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [whRes, itemsRes, allWhRes, productsRes] = await Promise.all([
        warehouseApi.get(warehouseId),
        inventoryItemApi.list({ warehouseId, size: 500 }),
        warehouseApi.list({ size: 100 }),
        productApi.list({ size: 1000 }),
      ]);
      setWarehouse(whRes);
      setItems(itemsRes?.content || []);
      const whList = allWhRes?.content || [];
      setAllWarehouses(whList);
      setAllProducts(productsRes?.content || []);
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

  const handleOpenAddProduct = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      quantityAvailable: undefined,
      quantityReserved: undefined,
    });
    setItemModalVisible(true);
  };

  const handleOpenEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    form.resetFields();
    form.setFieldsValue({
      productId: Number(item.productId),
      quantityAvailable: item.quantityAvailable,
      quantityReserved: item.quantityReserved || 0,
      batchNumber: item.batchNumber || '',
      expirationDate: item.expirationDate ? dayjs(item.expirationDate) : null,
    });
    setItemModalVisible(true);
  };

  const handleDeleteItem = async (item: InventoryItem) => {
    if (item.quantityAvailable > 0 || (item.quantityReserved && item.quantityReserved > 0)) {
      message.warning('Please edit quantity to 0 before deleting this item.');
      return;
    }
    try {
      await inventoryItemApi.delete(item.id);
      message.success('Inventory item deleted successfully');
      fetchData();
    } catch {
      message.error('Failed to delete inventory item');
    }
  };

  const handleSaveItem = async (values: {
    productId: number | string;
    quantityAvailable?: number;
    quantityReserved?: number;
    batchNumber?: string;
    expirationDate?: dayjs.Dayjs | null;
  }) => {
    setSavingItem(true);
    try {
      const payload = {
        productId: Number(values.productId),
        warehouseId: Number(warehouseId),
        quantityAvailable: Number(values.quantityAvailable || 0),
        quantityReserved: Number(values.quantityReserved || 0),
        batchNumber: values.batchNumber || undefined,
        expirationDate: values.expirationDate ? values.expirationDate.format('YYYY-MM-DD') : undefined,
      };

      if (editingItem) {
        await inventoryItemApi.update(editingItem.id, payload);
        message.success('Inventory item updated successfully');
      } else {
        await inventoryItemApi.create(payload);
        message.success('Product added to warehouse inventory successfully');
      }
      setItemModalVisible(false);
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err?.response?.data?.message || 'Failed to save inventory item');
    } finally {
      setSavingItem(false);
    }
  };

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

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSku = item.productSku?.toLowerCase().includes(q);
        const matchesName = item.productName?.toLowerCase().includes(q);
        if (!matchesSku && !matchesName) return false;
      }
      if (stockFilter === 'IN_STOCK' && item.quantityAvailable <= 0) return false;
      if (stockFilter === 'OUT_OF_STOCK' && item.quantityAvailable > 0) return false;
      return true;
    });
  }, [items, searchQuery, stockFilter]);

  const columns = useMemo(() => [
    {
      title: 'SKU',
      dataIndex: 'productSku',
      key: 'productSku',
      align: 'left' as const,
      width: 130,
      render: (sku: string) => <span className="font-mono text-xs text-slate-500 tabular-nums">{sku || 'N/A'}</span>,
    },
    {
      title: t('purchase.product', 'Product'),
      dataIndex: 'productName',
      key: 'productName',
      align: 'left' as const,
    },
    {
      title: t('inventory.boxes', 'Boxes'),
      key: 'boxes',
      align: 'right' as const,
      width: 100,
      render: (_: unknown, record: InventoryItem) => {
        const total = record.quantityAvailable;
        const perBox = record.soldUnitsPerBox || 0;
        const perUnit = record.itemsPerSoldUnit || 0;
        
        if (perBox > 0 && perUnit > 0) {
          const itemsPerBox = perBox * perUnit;
          const boxes = Math.floor(total / itemsPerBox);
          return <span className="font-mono text-xs text-slate-600 tabular-nums">{boxes}</span>;
        }
        return <span className="font-mono text-xs text-slate-400 tabular-nums">-</span>;
      },
    },
    {
      title: t('inventory.bundles', 'Bundles'),
      key: 'bundles',
      align: 'right' as const,
      width: 100,
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
          return <span className="font-mono text-xs text-slate-600 tabular-nums">{bundles}</span>;
        }
        return <span className="font-mono text-xs text-slate-400 tabular-nums">-</span>;
      },
    },
    {
      title: t('inventory.loose', 'Loose'),
      key: 'loose',
      align: 'right' as const,
      width: 100,
      render: (_: unknown, record: InventoryItem) => {
        const total = record.quantityAvailable;
        const perUnit = record.itemsPerSoldUnit || 0;
        
        if (perUnit > 0) {
          const looseAmount = total % perUnit;
          return <span className="font-mono text-xs text-slate-600 tabular-nums">{looseAmount}</span>;
        }
        return <span className="font-mono text-xs text-slate-400 tabular-nums">-</span>;
      },
    },
    {
      title: t('inventory.totalQty', 'Total Qty'),
      dataIndex: 'quantityAvailable',
      key: 'quantityAvailable',
      align: 'right' as const,
      width: 110,
      render: (qty: number) => (
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-text-primary)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {qty ?? 0}
        </span>
      ),
    },
    {
      title: t('inventory.totalValue', 'Est. Value (LKR)'),
      key: 'totalValue',
      align: 'right' as const,
      width: 160,
      render: (_: unknown, record: InventoryItem) => {
        const val = record.quantityAvailable * (record.productBasePrice || 0);
        return (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-text-primary)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            Rs. {Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        );
      }
    },
    {
      title: t('common.actions', 'Actions'),
      key: 'actions',
      align: 'right' as const,
      width: 100,
      render: (_: unknown, record: InventoryItem) => (
        <Space>
          <Tooltip title={t('common.edit', 'Edit')}>
            <Button
              type="text"
              icon={<EditOutlined style={{ color: 'var(--color-primary)' }} />}
              onClick={() => handleOpenEditItem(record)}
              aria-label={`Edit ${record.productName}`}
              style={{ width: 36, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            />
          </Tooltip>
          <Tooltip title={t('common.delete', 'Delete')}>
            <Popconfirm
              title={record.quantityAvailable > 0 || (record.quantityReserved && record.quantityReserved > 0) ? "Please edit quantity to 0 before deleting." : "Are you sure you want to delete this item?"}
              onConfirm={() => handleDeleteItem(record)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                aria-label={`Delete ${record.productName}`}
                style={{ width: 36, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t]);

  return (
    <div className="p-6">
      {/* ─── TIER 1: PAGE CONTEXT & PRIMARY ACTION BAR ─────────────────────── */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ marginBottom: '16px' }}>
          <button 
            type="button"
            onClick={onBack}
            className="sf-focus-ring"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
              height: '32px',
              padding: '0 var(--space-2)',
              marginLeft: '-8px',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-text-secondary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'color var(--transition-fast), background var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-primary)';
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface-subtle)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
              (e.currentTarget as HTMLButtonElement).style.background = 'none';
            }}
          >
            <ArrowLeftOutlined style={{ fontSize: '10px' }} />
            {t('inventory.backToWarehouses', 'Back to Warehouses')}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 style={{
              fontSize: '28px',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              lineHeight: 1.2,
              color: 'var(--color-text-primary)',
              margin: 0,
            }}>
              {warehouse?.name || '...'}
            </h1>
            {warehouse && <WarehouseTypeBadge storeType={warehouse.storeType} />}
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto ml-auto">
            {(warehouse?.storeType === 'CUSTOM' || warehouse?.storeType === 'VEHICLE' || warehouse?.name?.startsWith('Vehicle')) && (
              <Button
                type="default"
                icon={<ReloadOutlined />}
                onClick={handleOpenUnload}
                className="h-9 px-4 rounded-md border-slate-300 text-slate-700 hover:text-emerald-700 hover:border-emerald-600 font-medium text-sm transition-all"
              >
                Unload Vehicle
              </Button>
            )}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenAddProduct}
              className="h-9 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm inline-flex items-center gap-1.5 shadow-2xs transition-all"
            >
              {t('inventory.addProduct', 'Add Product')}
            </Button>
          </div>
        </div>
      </div>

      {/* ─── TIER 2: KPI SUMMARY CARDS ────────────────────────────────────── */}
      <Row gutter={[24, 16]} className="w-full mx-0" style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={8}>
          <Card styles={{ body: { padding: 'var(--space-5)' } }} style={{ border: '1px solid var(--color-primary-border)' }}>
            <Statistic
              title={
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                  <AppstoreOutlined style={{ color: 'var(--color-primary)' }} /> <span>{t('inventory.totalProducts', 'Total Products')}</span>
                </div>
              }
              value={totalProducts}
              styles={{ content: { fontWeight: 600, fontSize: 'var(--text-2xl)', color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card styles={{ body: { padding: 'var(--space-5)' } }} style={{ border: '1px solid var(--color-primary-border)' }}>
            <Statistic
              title={
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                  <ShoppingOutlined style={{ color: 'var(--color-primary)' }} /> <span>{t('inventory.totalUnits', 'Total Units')}</span>
                </div>
              }
              value={totalUnits}
              styles={{ content: { fontWeight: 600, fontSize: 'var(--text-2xl)', color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card styles={{ body: { padding: 'var(--space-5)' } }} style={{ border: '1px solid var(--color-primary-border)' }}>
            <Statistic
              title={
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                  <DollarOutlined style={{ color: 'var(--color-primary)' }} /> <span>{t('inventory.totalValue', 'Estimated Value (LKR)')}</span>
                </div>
              }
              value={totalValue}
              precision={2}
              styles={{ content: { fontWeight: 600, fontSize: 'var(--text-2xl)', color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* ─── TIER 3: TABLE CONTROL TOOLBAR ────────────────────────────────── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-4)',
        paddingBottom: 'var(--space-4)',
        borderBottom: '1px solid var(--color-border-default)',
      }}>
        <div style={{ flex: 1 }}>
          <Input.Search
            placeholder="Search SKU or product name"
            aria-label="Search inventory by SKU or product name"
            allowClear
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', maxWidth: '448px' }}
            size="middle"
          />
        </div>
        <div className="flex items-center gap-2.5 ml-auto">
          <Select
            defaultValue="ALL"
            size="middle"
            style={{ width: 160 }}
            onChange={setStockFilter}
            options={[
              { label: 'All Stock Status', value: 'ALL' },
              { label: 'In Stock (> 0)', value: 'IN_STOCK' },
              { label: 'Out of Stock (0)', value: 'OUT_OF_STOCK' },
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchData} size="middle">
            Refresh
          </Button>
        </div>
      </div>

      {/* ─── TIER 4: INVENTORY DATA TABLE ─────────────────────────────────── */}
      {warehouse && (warehouse.storeType === 'VEHICLE' || warehouse.storeType === 'CUSTOM' || warehouse.name.startsWith('Vehicle - ')) ? (
        <Tabs
          defaultActiveKey="loadingSheets"
          className="mt-2"
          items={[
            {
              key: 'loadingSheets',
              label: (
                <span className="flex items-center gap-2 px-3 py-1 text-base font-medium text-slate-700">
                  <CarOutlined className="text-emerald-600" /> Loading Sheets & Lorry Unload
                </span>
              ),
              children: <VehicleLoadingSheetsTab warehouse={warehouse} />,
            },
            {
              key: 'inventory',
              label: (
                <span className="flex items-center gap-2 px-3 py-1 text-base font-medium text-slate-700">
                  <AppstoreOutlined className="text-blue-600" /> Current Vehicle Stock ({filteredItems.length} items)
                </span>
              ),
              children: (
                <Card styles={{ body: { padding: 0 } }} style={{ overflow: 'hidden', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-primary-border)' }} className="mt-3">
                  <Table
                    rowKey="id"
                    loading={loading}
                    dataSource={filteredItems}
                    columns={columns}
                    pagination={{ pageSize: 20, className: 'px-4 py-3 border-t border-slate-100 m-0' }}
                    locale={{
                      emptyText: (
                        <div className="py-12 px-6 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                          <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-400 mb-4 shadow-2xs">
                            <AppstoreOutlined className="text-xl" />
                          </div>
                          <h3 className="text-sm font-semibold text-slate-800 mb-1">
                            No inventory recorded for {warehouse?.name || 'this warehouse'}
                          </h3>
                          <p className="text-xs text-slate-500 leading-relaxed mb-5">
                            Products allocated to this warehouse or returned from delivery rounds will appear here.
                          </p>
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleOpenAddProduct}
                            className="h-9 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 font-medium text-sm shadow-2xs transition-all"
                          >
                            Add First Product
                          </Button>
                        </div>
                      ),
                    }}
                    className="spiceflow-table"
                  />
                </Card>
              ),
            },
          ]}
        />
      ) : (
        <Card styles={{ body: { padding: 0 } }} style={{ overflow: 'hidden', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-primary-border)' }}>
          <Table
            rowKey="id"
            loading={loading}
            dataSource={filteredItems}
            columns={columns}
            pagination={{ pageSize: 20, className: 'px-4 py-3 border-t border-slate-100 m-0' }}
            locale={{
              emptyText: (
                <div className="py-12 px-6 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                  <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-400 mb-4 shadow-2xs">
                    <AppstoreOutlined className="text-xl" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 mb-1">
                    No inventory recorded for {warehouse?.name || 'this warehouse'}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-5">
                    Products allocated to this warehouse or returned from delivery rounds will appear here.
                  </p>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleOpenAddProduct}
                    className="h-9 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 font-medium text-sm shadow-2xs transition-all"
                  >
                    Add First Product
                  </Button>
                </div>
              ),
            }}
            className="spiceflow-table"
          />
        </Card>
      )}

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

      <Modal
        title={
          <div className="flex items-center gap-2 text-lg text-slate-800 dark:text-slate-200">
            {editingItem ? <EditOutlined className="text-emerald-500" /> : <PlusOutlined className="text-emerald-500" />}
            <span>{editingItem ? t('inventory.editItem', 'Edit Inventory Item') : t('inventory.addItem', 'Add Product to Warehouse')}</span>
          </div>
        }
        open={itemModalVisible}
        onCancel={() => setItemModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={savingItem}
        okText={editingItem ? t('common.update', 'Update') : t('common.add', 'Add Product')}
        okButtonProps={{ className: 'bg-emerald-600 hover:bg-emerald-500' }}
        width={500}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveItem}
          className="mt-4"
        >
          <Form.Item
            name="productId"
            label={t('purchase.product', 'Product')}
            rules={[{ required: true, message: 'Please select a product' }]}
          >
            <Select
              placeholder="Select a product"
              disabled={!!editingItem}
              showSearch
              optionFilterProp="children"
            >
              {allProducts
                .filter(p => !!editingItem || !items.some(i => String(i.productId) === String(p.id)))
                .map(p => (
                  <Select.Option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="quantityAvailable"
                label={t('inventory.quantityAvailable', 'Quantity Available')}
                rules={[{ required: true, message: 'Required' }]}
              >
                <InputNumber min={0} placeholder="0" onFocus={(e) => e.target.select()} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="quantityReserved"
                label={t('inventory.quantityReserved', 'Quantity Reserved')}
              >
                <InputNumber min={0} placeholder="0" onFocus={(e) => e.target.select()} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="batchNumber"
            label={t('inventory.batchNumber', 'Batch Number (Optional)')}
          >
            <Input placeholder="e.g. BATCH-001" />
          </Form.Item>

          <Form.Item
            name="expirationDate"
            label={t('inventory.expirationDate', 'Expiration Date (Optional)')}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
