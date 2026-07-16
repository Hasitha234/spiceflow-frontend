import { Layout, Menu, Dropdown, Button, Space, Avatar, Typography } from 'antd';
import { 
  LogoutOutlined, 
  GlobalOutlined,
  BulbOutlined,
  MoonOutlined,
  UserOutlined,
  LeftOutlined
} from '@ant-design/icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { BrandLogo } from '@/components/common/BrandLogo';
import { useAgencyStore } from '@/store/agencyStore';
import { useTenantStore } from '@/store/tenantStore';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const allMenuItems = [
  {
    type: 'group',
    label: 'Core Workflows',
    children: [
      { key: '/day-summary', translateKey: 'nav.daySummary', roles: ['TENANT_OWNER'] },
      { key: '/month-summary', translateKey: 'nav.monthSummary', roles: ['TENANT_OWNER'] },
      { key: '/inventory', translateKey: 'nav.inventory', roles: ['TENANT_OWNER', 'DATA_ENTRY'] },
      { key: '/purchases', translateKey: 'nav.purchases', roles: ['TENANT_OWNER', 'DATA_ENTRY'] },
      { key: '/sales', translateKey: 'nav.orders', roles: ['TENANT_OWNER', 'DATA_ENTRY'] },
      { key: '/loading', translateKey: 'nav.loading', roles: ['TENANT_OWNER', 'DATA_ENTRY', 'DRIVER'] },
      { key: '/deliveries', translateKey: 'nav.deliveries', roles: ['TENANT_OWNER', 'DATA_ENTRY', 'DRIVER'] },
      { key: '/qr-scan', translateKey: 'nav.qrScan', roles: ['TENANT_OWNER', 'DRIVER'] },
      { key: '/settings', translateKey: 'nav.settings', roles: ['TENANT_OWNER', 'DATA_ENTRY'] },
    ]
  }
];

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.clearAuth);
  const { agencyName } = useAgencyStore();
  const { tenantId, setTenantId } = useTenantStore();
  
  const { theme, toggleTheme } = useThemeStore();

  const userType = user?.userType || 'TENANT_OWNER';

  const isSuspended = userType === 'TENANT_OWNER'
    ? user?.assignedTenants?.find(t => t.id === tenantId)?.status === 'SUSPENDED'
    : user?.tenantStatus === 'SUSPENDED';

  // Filter menu items based on user role
  const menuItems = allMenuItems.map(group => ({
    ...group,
    children: group.children.filter(item => item.roles.includes(userType))
  })).filter(group => group.children.length > 0);

  const flatMenuItems = menuItems.flatMap(group => group.children || []);

  const currentKey = flatMenuItems.reduce((best, item) => {
    return location.pathname.startsWith(item.key) && item.key.length > best.length ? item.key : best;
  }, '/');

  const handleLogout = async () => {
    try {
      const { authApi } = await import('@/api/auth');
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      logout();
      window.location.href = '/login';
    }
  };

  const languageMenu = {
    items: [
      { key: 'en', label: 'English' },
      { key: 'si', label: 'සිංහල' },
    ],
    onClick: (info: { key: string }) => {
      i18n.changeLanguage(info.key);
      localStorage.setItem('sf_lang', info.key);
    },
  };

  const switchAgencyItems = user?.userType === 'TENANT_OWNER' && user.assignedTenants && user.assignedTenants.length > 1
    ? [
        { type: 'divider' as const },
        {
          key: 'switch-agency',
          label: 'Switch Agency',
          children: user.assignedTenants.map(t => ({
            key: `tenant-${t.id}`,
            label: (
              <span style={{ fontWeight: t.id === tenantId ? 'bold' : 'normal', color: t.id === tenantId ? '#10b981' : 'inherit' }}>
                {t.businessName}
              </span>
            ),
            onClick: () => {
              setTenantId(t.id);
              window.location.href = '/'; // Full reload to clear cache
            }
          }))
        }
      ]
    : [];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        trigger={null}
        className="sf-sidebar"
        width={260}
        style={{ display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, left: 0, zIndex: 20 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ 
              height: 64, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? 0 : '0 20px',
              overflow: 'hidden',
              borderBottom: '1px solid var(--surface-border)',
            }}>
              <BrandLogo size={32} showText={!collapsed} textSize={18} badgeText="" />
            </div>
            
            <Menu
              theme={theme === 'dark' ? 'dark' : 'light'}
              mode="inline"
              selectedKeys={[currentKey]}
              onClick={({ key }) => navigate(key)}
              style={{ 
                background: 'transparent',
                borderRight: 'none',
                padding: '16px 12px 16px 0'
              }}
              items={menuItems.map((group) => ({
                type: 'group',
                label: <div style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b', marginTop: 16, marginBottom: 8, paddingLeft: collapsed ? 0 : 20, textAlign: collapsed ? 'center' : 'left' }}>{collapsed ? '•' : group.label}</div>,
                children: group.children.map((item) => ({
                  key: item.key,
                  label: t(item.translateKey),
                  style: { borderRadius: '0 8px 8px 0', marginBottom: 4 }
                }))
              }))}
            />
          </div>

          <div className="p-3 border-t border-slate-200 mt-auto">
            <button
              type="button"
              aria-label="Collapse sidebar navigation"
              onClick={() => setCollapsed(!collapsed)}
              className="w-full h-9 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none cursor-pointer"
            >
              <LeftOutlined className={`text-xs transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </Sider>
      
      <Layout>
        <Header className="sf-header" style={{ 
          padding: '0 var(--space-6)', 
          display: 'flex', 
          justifyContent: 'flex-end', 
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          {/* Centered Agency Name (like a header) */}
          {agencyName && (
            <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center' }}>
              <Text style={{ fontWeight: 800, fontSize: '20px', color: '#10b981', letterSpacing: '-0.02em' }}>
                {agencyName}
              </Text>
            </div>
          )}

          <Space size="middle">

            {/* Theme Toggle */}
            <Button 
              type="text" 
              icon={theme === 'dark' ? <BulbOutlined /> : <MoonOutlined />} 
              onClick={toggleTheme}
              style={{ color: 'var(--text-primary)' }}
            />
            
            {/* Language Toggle */}
            <Dropdown menu={languageMenu} placement="bottomRight">
              <Button type="text" icon={<GlobalOutlined />} style={{ color: 'var(--text-primary)' }}>
                {i18n.language.toUpperCase()}
              </Button>
            </Dropdown>
            
            {/* User Dropdown */}
            <Dropdown 
              menu={{
                items: [
                  { 
                    key: 'profile',
                    label: <Text type="secondary" className="tabular-nums">{user?.email}</Text>,
                    disabled: true
                  },
                  ...switchAgencyItems,
                  { type: 'divider' },
                  { 
                    key: 'logout', 
                    label: t('nav.logout'), 
                    icon: <LogoutOutlined />, 
                    danger: true 
                  }
                ],
                onClick: (info) => info.key === 'logout' && handleLogout()
              }} 
              placement="bottomRight"
            >
              <div className="hover-lift" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 8px', borderRadius: 24, background: 'var(--surface-muted)' }}>
                <Avatar size="small" icon={<UserOutlined />} style={{ background: '#334155' }} />
              </div>
            </Dropdown>
          </Space>
        </Header>
        
        <Content className="animate-fade-in" style={{ margin: '24px', position: 'relative' }}>
          {isSuspended && (
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.9)',
                padding: '40px',
                borderRadius: '16px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                textAlign: 'center',
                maxWidth: '600px',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                <Typography.Title level={3} style={{ color: '#dc2626', marginBottom: '16px' }}>
                  ගිණුම අත්හිටුවා ඇත
                </Typography.Title>
                <Typography.Text style={{ fontSize: '18px', color: '#334155', display: 'block' }}>
                  ඔබගේ මාසික සැලසුම අවසන් වී ඇත. කරුණාකර මුදල් ගෙවා ඉදිරියට යන්න.
                </Typography.Text>
              </div>
            </div>
          )}
          <div style={{ maxWidth: 1400, margin: '0 auto', filter: isSuspended ? 'blur(8px)' : 'none', pointerEvents: isSuspended ? 'none' : 'auto' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
