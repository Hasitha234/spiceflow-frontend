import { Layout, Menu, Dropdown, Button, Space, Avatar, Typography } from 'antd';
import { 
  MenuFoldOutlined, 
  MenuUnfoldOutlined, 
  LogoutOutlined, 
  GlobalOutlined,
  BulbOutlined,
  MoonOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { BrandLogo } from '@/components/common/BrandLogo';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  {
    type: 'group',
    label: 'Core Workflows',
    children: [
      { key: '/', translateKey: 'nav.dashboard' },
      { key: '/purchases', translateKey: 'nav.purchases' },
      { key: '/day-summary', translateKey: 'nav.daySummary' },
      { key: '/inventory', translateKey: 'nav.inventory' },
      { key: '/sales', translateKey: 'nav.orders' },
    ]
  },
  {
    type: 'group',
    label: 'Operations',
    children: [
      { key: '/loading', translateKey: 'nav.loading' },
      { key: '/deliveries', translateKey: 'nav.deliveries' },
      { key: '/end-of-day', translateKey: 'nav.endOfDay' },
      { key: '/qr-scan', translateKey: 'nav.qrScan' },
    ]
  },
  {
    type: 'group',
    label: 'System & Reports',
    children: [
      { key: '/reports', translateKey: 'nav.reports' },
      { key: '/settings', translateKey: 'nav.settings' },
      { key: '/users', translateKey: 'nav.users' },
      { key: '/roles', translateKey: 'nav.roles' },
    ]
  }
];

const flatMenuItems = menuItems.flatMap(group => group.children || []);

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.clearAuth);
  
  const { theme, toggleTheme } = useThemeStore();

  const currentKey = flatMenuItems.reduce((best, item) => {
    return location.pathname.startsWith(item.key) && item.key.length > best.length ? item.key : best;
  }, '/');

  const handleLogout = async () => {
    try {
      // Import dynamically to avoid circular dependencies if authApi imports client which imports authStore
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

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        className="sf-sidebar"
        width={260}
      >
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
            label: <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 16, marginBottom: 8 }}>{group.label}</div>,
            children: group.children.map((item) => ({
              key: item.key,
              label: t(item.translateKey),
              style: { borderRadius: '0 8px 8px 0', marginBottom: 4 }
            }))
          }))}
        />
      </Sider>
      
      <Layout>
        <Header className="sf-header" style={{ 
          padding: '0 24px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <Space size="large">
            <Button 
              type="text" 
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} 
              onClick={() => setCollapsed(!collapsed)} 
              style={{ fontSize: 16, color: 'var(--text-primary)' }}
            />
          </Space>
          
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
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
