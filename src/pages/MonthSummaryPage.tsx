import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, Col, DatePicker, Row, Statistic, Table, Typography, App, Space, Button } from 'antd';
import { DollarOutlined, PlusOutlined, FallOutlined, RiseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { reportApi } from '../api/sales';
import { financeApi } from '../api/financeApi';
import type { MonthSummary } from '../types/sales';
import type { Expense } from '../types/finance';
import { ExpenseFormDrawer } from '../components/finance/ExpenseFormDrawer';

const { Title, Text } = Typography;

export function MonthSummaryPage() {
  const { message } = App.useApp();
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<MonthSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fmt = (val?: number) => Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const loadData = useCallback(async (date: dayjs.Dayjs) => {
    setLoading(true);
    try {
      const yearMonth = date.format('YYYY-MM');
      const [summaryRes, expensesRes] = await Promise.all([
        reportApi.monthSummary(yearMonth),
        financeApi.getExpensesForMonth(yearMonth),
      ]);
      setSummaryData(summaryRes || null);
      setExpenses(expensesRes || []);
    } catch {
      message.error('Failed to load month summary data');
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    loadData(selectedMonth);
  }, [selectedMonth, loadData]);

  const handleDateChange = (date: dayjs.Dayjs | null) => {
    if (date) setSelectedMonth(date);
  };

  const handleExpenseAdded = () => {
    loadData(selectedMonth);
  };

  const handleDeleteExpense = useCallback(async (id: number) => {
    try {
      await financeApi.deleteExpense(id);
      message.success('Expense deleted');
      loadData(selectedMonth);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || 'Failed to delete expense');
    }
  }, [message, loadData, selectedMonth]);

  const expenseColumns = useMemo(
    () => [
      {
        title: 'Date',
        dataIndex: 'date',
        key: 'date',
        render: (val: string) => dayjs(val).format('YYYY-MM-DD'),
      },
      {
        title: 'Category',
        dataIndex: 'category',
        key: 'category',
        render: (val: string) => <span className="font-medium text-slate-800 dark:text-slate-200">{val}</span>,
      },
      {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
      },
      {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        align: 'right' as const,
        render: (val: number) => <span className="text-red-500 font-semibold">Rs. {fmt(val)}</span>,
      },
      {
        title: 'Actions',
        key: 'actions',
        align: 'center' as const,
        render: (_: unknown, record: Expense) => (
          <Button danger type="text" onClick={() => handleDeleteExpense(record.id)}>Delete</Button>
        ),
      },
    ],
    [handleDeleteExpense]
  );

  const breakdownColumns = [
    { title: 'Category', dataIndex: 'category', key: 'category' },
    { title: 'Total Amount', dataIndex: 'amount', key: 'amount', align: 'right' as const, render: (val: number) => `Rs. ${fmt(val)}` },
  ];

  return (
    <Space direction="vertical" size="large" className="w-full pb-8">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div>
          <Title level={2} className="!mb-1 !text-slate-800 dark:!text-white">
            Month Summary
          </Title>
          <Text className="text-slate-500 dark:text-slate-400 text-base">
            Overview of Sales, Purchases, and Expenses for {selectedMonth.format('MMMM YYYY')}
          </Text>
        </div>
        <Space size="middle">
          <DatePicker
            picker="month"
            value={selectedMonth}
            onChange={handleDateChange}
            allowClear={false}
            className="w-48 shadow-sm"
            size="large"
          />
          <Button 
            type="primary" 
            size="large"
            icon={<PlusOutlined />} 
            onClick={() => setIsDrawerOpen(true)}
            className="shadow-sm"
          >
            Add Expense
          </Button>
        </Space>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="Total Sales"
              value={summaryData?.totalSalesValue || 0}
              precision={2}
              valueStyle={{ color: '#10b981' }}
              prefix={<RiseOutlined />}
              suffix="Rs"
            />
            <div className="text-slate-400 text-xs mt-2">{summaryData?.deliveryCount} Deliveries, {summaryData?.repOrderCount} Rep Orders</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="Total Purchases"
              value={summaryData?.totalPurchasesValue || 0}
              precision={2}
              valueStyle={{ color: '#f59e0b' }}
              prefix={<FallOutlined />}
              suffix="Rs"
            />
             <div className="text-slate-400 text-xs mt-2">{summaryData?.purchaseOrderCount} Purchase Orders</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="Total Expenses"
              value={summaryData?.totalExpensesValue || 0}
              precision={2}
              valueStyle={{ color: '#ef4444' }}
              prefix={<FallOutlined />}
              suffix="Rs"
            />
             <div className="text-slate-400 text-xs mt-2">{expenses.length} Expense Records</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow bg-slate-50 dark:bg-slate-700/50">
            <Statistic
              title="Net Profit"
              value={summaryData?.netProfit || 0}
              precision={2}
              valueStyle={{ color: (summaryData?.netProfit || 0) >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}
              prefix={<DollarOutlined />}
              suffix="Rs"
            />
             <div className="text-slate-400 text-xs mt-2">Sales - Purchases - Expenses</div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card 
            title="Expenses Detail" 
            bordered={false} 
            className="shadow-sm"
          >
            <Table
              dataSource={expenses}
              columns={expenseColumns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              size="middle"
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card 
            title="Expense Breakdown" 
            bordered={false} 
            className="shadow-sm"
          >
            <Table
              dataSource={summaryData?.expenseBreakdown || []}
              columns={breakdownColumns}
              rowKey="category"
              loading={loading}
              pagination={false}
              size="middle"
            />
          </Card>
        </Col>
      </Row>

      <ExpenseFormDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={handleExpenseAdded}
      />
    </Space>
  );
}
