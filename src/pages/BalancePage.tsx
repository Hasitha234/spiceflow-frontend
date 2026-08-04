import { useState } from 'react';
import { Card, Typography, DatePicker, Button, Row, Col, Space, Statistic, message, Popconfirm, Tag, Spin } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { CheckCircleOutlined, CloseCircleOutlined, SyncOutlined, RollbackOutlined, WhatsAppOutlined } from '@ant-design/icons';
import { balanceApi } from '../api/balanceApi';
import { reportApi } from '../api/sales';
import { productApi } from '../api/inventory';
import { useAuthStore } from '../store/authStore';
import { useTenantStore } from '../store/tenantStore';
import { useAgencyStore } from '../store/agencyStore';
const { Title, Text } = Typography;

export function BalancePage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const tenantId = useTenantStore((state) => state.tenantId);
  const { agencyName } = useAgencyStore();
  const isTenantOwner = user?.roles.includes('TENANT_OWNER');

  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [isSendingReport, setIsSendingReport] = useState(false);

  const dateString = selectedDate.format('YYYY-MM-DD');

  const { data: balanceData, isLoading, refetch } = useQuery({
    queryKey: ['dailyBalance', dateString],
    queryFn: () => balanceApi.getDailyBalance(dateString),
  });

  const proceedMutation = useMutation({
    mutationFn: () => balanceApi.proceedDailyBalance(dateString),
    onSuccess: () => {
      message.success('Daily balance proceeded successfully and summaries settled.');
      queryClient.invalidateQueries({ queryKey: ['dailyBalance', dateString] });
      queryClient.invalidateQueries({ queryKey: ['morningSummaries'] });
      queryClient.invalidateQueries({ queryKey: ['cancelSummaries'] });
      queryClient.invalidateQueries({ queryKey: ['endOfDaySummary'] });
      queryClient.invalidateQueries({ queryKey: ['monthSummary'] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || 'Failed to proceed balance');
    },
  });

  const undoMutation = useMutation({
    mutationFn: () => balanceApi.undoDailyBalance(dateString),
    onSuccess: () => {
      message.success('Daily balance undone successfully. Summaries reverted to PENDING.');
      queryClient.invalidateQueries({ queryKey: ['dailyBalance', dateString] });
      queryClient.invalidateQueries({ queryKey: ['morningSummaries'] });
      queryClient.invalidateQueries({ queryKey: ['cancelSummaries'] });
      queryClient.invalidateQueries({ queryKey: ['endOfDaySummary'] });
      queryClient.invalidateQueries({ queryKey: ['monthSummary'] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || 'Failed to undo balance');
    },
  });

  const isBalanced = balanceData?.isBalanced;
  const isProceeded = balanceData?.status === 'BALANCED';

  const handleSendReport = async () => {
    try {
      setIsSendingReport(true);
      
      // Fetch End of Day Summary, Stock Status & Products
      const summary = await reportApi.endOfDaySummary(dateString);
      const [stockData, productsRes] = await Promise.all([
        reportApi.stockStatus(),
        productApi.list({ size: 1000 })
      ]);
      const allProducts = productsRes?.content || [];
      
      // Get Agency Name
      const currentTenant = user?.assignedTenants?.find(t => t.id === tenantId);
      const businessName = agencyName || currentTenant?.businessName || '';

      // Format WhatsApp Message
      const totalIncome = (summary.totalCashCollected || 0) + (summary.totalChequeAmount || 0) + (summary.totalLoanGiven || 0);
      
      let totalValue = 0;
      let zeroBoxCount = 0;
      let stockMsg = '';
      
      stockData.forEach(item => {
        const product = allProducts.find(p => String(p.id) === String(item.productId) || p.sku === item.productCode);
        const basePrice = product?.basePrice || 0;
        const qty = item.mainStoreQuantity || 0;
        
        totalValue += (qty * basePrice);
        
        const perBox = product?.soldUnitsPerBox || 0;
        const perUnit = product?.itemsPerSoldUnit || 1;
        
        let boxes;
        if (perBox > 0 && perUnit > 0) {
          const itemsPerBox = perBox * perUnit;
          boxes = Math.floor(qty / itemsPerBox);
        } else {
          boxes = qty > 0 ? 1 : 0; // If no box packaging is defined, treat positive qty as having boxes
        }
        
        if (boxes === 0) {
          stockMsg += `${item.productName}: ${qty}\n`;
          zeroBoxCount++;
        }
      });
      
      if (zeroBoxCount === 0) {
        stockMsg += `0 Box අයිතම නොමැත (No 0-box items)\n`;
      }

      let msg = businessName ? `${businessName}\n` : '';
      msg += `දෛනික සාරාංශය (${dateString})\n------------------------\n`;
      msg += `මුළු ආදායම (Full Income): Rs. ${totalIncome.toFixed(2)}\n`;
      msg += `එකතු කළ මුදල් (Total Cash Collected): Rs. ${(summary.totalCashCollected || 0).toFixed(2)}\n`;
      msg += `ලැබුණු චෙක්පත් (Cheques Received): Rs. ${(summary.totalChequeAmount || 0).toFixed(2)}\n`;
      msg += `ණය මුදල් (Loan / Credit Given): Rs. ${(summary.totalLoanGiven || 0).toFixed(2)}\n`;
      msg += `අවලංගු කළ බිල්පත් වටිනාකම (Cancel Order Amount): Rs. ${(summary.cancelOrderAmount || 0).toFixed(2)}\n`;
      msg += `අවලංගු කළ බිල්පත් ගණන (Cancelled Shop Count): ${summary.cancelShopCount || 0}\n`;
      msg += `ඇස්තමේන්තුගත තොග වටිනාකම (Estimated Stock Value): Rs. ${totalValue.toFixed(2)}\n\n`;
      
      msg += `රියදුරු සාරාංශය (Driver Breakdown):\n\n`;
      
      if (summary.driverSummaries && summary.driverSummaries.length > 0) {
        summary.driverSummaries.forEach(driver => {
          msg += `රියදුරු (Driver): ${driver.driverName}\n`;
          msg += `එකතු කළ මුදල් (Cash): Rs. ${(driver.totalCashCollected || 0).toFixed(2)}\n`;
          msg += `ලැබුණු චෙක්පත් (Cheques): Rs. ${(driver.totalChequeAmount || 0).toFixed(2)}\n`;
          msg += `ණය මුදල් (Loan): Rs. ${(driver.totalLoanGiven || 0).toFixed(2)}\n`;
          msg += `අවලංගු (Cancelled): Rs. ${(driver.cancelOrderAmount || 0).toFixed(2)}\n`;
          msg += `අවලංගු කළ බිල්පත් ගණන (Cancelled Shop Count): ${driver.cancelShopCount || 0}\n\n`;
        });
      } else {
        msg += `රියදුරු දත්ත නොමැත (No driver data available)\n\n`;
      }
      
      msg += `ප්‍රධාන ගබඩාවේ තොග (Main Store Stock):\n`;
      msg += stockMsg;
      msg += `\n`;
      
      const encodedMessage = encodeURIComponent(msg);
      window.open(`https://wa.me/94772285702?text=${encodedMessage}`, '_blank');
      
    } catch (error) {
      console.error(error);
      message.error('Failed to generate report');
    } finally {
      setIsSendingReport(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Daily Balance Reconciliation</Title>
        <DatePicker 
          value={selectedDate} 
          onChange={(date) => date && setSelectedDate(date)}
          allowClear={false}
          size="large"
        />
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 50 }}>
          <Spin size="large" />
        </div>
      ) : balanceData ? (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          
          {isProceeded && (
            <Card style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f', textAlign: 'center' }}>
              <Space>
                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 24 }} />
                <Title level={4} style={{ margin: 0, color: '#389e0d' }}>
                  This date has been successfully balanced and finalized.
                </Title>
              </Space>
            </Card>
          )}

          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="Morning Summaries (Total Est. Value)"
                  value={balanceData.morningSummaryTotal}
                  precision={2}
                  prefix="Rs."
                  valueStyle={{ color: '#1677ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="Cancel Summaries (Total Est. Value)"
                  value={balanceData.cancelSummaryTotal}
                  precision={2}
                  prefix="Rs."
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card style={{ backgroundColor: '#fafafa', border: '2px solid #d9d9d9' }}>
                <Statistic
                  title="Net Dispatch (Morning - Cancel)"
                  value={balanceData.netDispatchTotal}
                  precision={2}
                  prefix="Rs."
                  valueStyle={{ fontWeight: 'bold' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title={<Title level={4} style={{ margin: 0 }}>Side A: Net Dispatch</Title>}>
                <Statistic
                  value={balanceData.netDispatchTotal}
                  precision={2}
                  prefix="Rs."
                  valueStyle={{ fontSize: 32 }}
                />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title={<Title level={4} style={{ margin: 0 }}>Side B: Bills Total (Net + Free)</Title>}>
                <Statistic
                  value={balanceData.billsTotal}
                  precision={2}
                  prefix="Rs."
                  valueStyle={{ fontSize: 32 }}
                />
              </Card>
            </Col>
          </Row>

          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space size="large">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 18, fontWeight: 500 }}>Status:</span>
                  {isBalanced ? (
                    <Tag color="success" icon={<CheckCircleOutlined />} style={{ fontSize: 16, padding: '4px 12px' }}>
                      Balanced
                    </Tag>
                  ) : (
                    <Tag color="error" icon={<CloseCircleOutlined />} style={{ fontSize: 16, padding: '4px 12px' }}>
                      Not Balanced
                    </Tag>
                  )}
                </div>
                {!isBalanced && (
                  <Text type="danger">
                    Difference: Rs. {Math.abs(balanceData.netDispatchTotal - balanceData.billsTotal).toFixed(2)}
                  </Text>
                )}
              </Space>

              <Space>
                <Button 
                  icon={<SyncOutlined />} 
                  onClick={() => refetch()}
                >
                  Refresh Data
                </Button>

                {isProceeded ? (
                  <>
                    <Button 
                      type="primary" 
                      style={{ backgroundColor: '#25D366' }} 
                      icon={<WhatsAppOutlined />} 
                      onClick={handleSendReport}
                      loading={isSendingReport}
                    >
                      Send Report
                    </Button>
                    {isTenantOwner && (
                    <Popconfirm
                      title="Undo Daily Balance?"
                      description="This will revert all settled Morning and Cancel summaries back to PENDING for this date."
                      onConfirm={() => undoMutation.mutate()}
                      okText="Yes, Undo"
                      cancelText="No"
                    >
                      <Button 
                        danger 
                        icon={<RollbackOutlined />} 
                        loading={undoMutation.isPending}
                      >
                        Undo Balance
                      </Button>
                    </Popconfirm>
                    )}
                  </>
                ) : (
                  <Button
                    type="primary"
                    size="large"
                    disabled={!isBalanced}
                    loading={proceedMutation.isPending}
                    onClick={() => proceedMutation.mutate()}
                  >
                    Proceed & Finalize Day
                  </Button>
                )}
              </Space>
            </div>
          </Card>
        </Space>
      ) : null}
    </div>
  );
}
