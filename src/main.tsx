/* eslint-disable react-refresh/only-export-components */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useThemeStore } from '@/store/themeStore';
import 'antd/dist/reset.css';
import './index.css';
import App from './App';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Theme-aware root component — wraps the app in Ant Design's ConfigProvider,
 * selecting the correct algorithm (dark/light) from the persisted theme store.
 * This component re-renders only when the theme changes.
 */
function ThemedApp() {
  const currentTheme = useThemeStore((s) => s.theme);

  return (
    <ConfigProvider
      theme={{
        algorithm:
          currentTheme === 'dark'
            ? antdTheme.darkAlgorithm
            : antdTheme.defaultAlgorithm,
        token: {
          // Brand
          colorPrimary: '#059669', // Emerald 600
          colorPrimaryHover: '#047857', // Emerald 700
          colorPrimaryActive: '#064e3b', // Emerald 900

          // Typography
          fontFamily:
            "'Inter', 'Noto Sans Sinhala', system-ui, -apple-system, sans-serif",
          fontSize: 14,

          // Surface tokens (dark/light)
          colorBgBase: currentTheme === 'dark' ? '#0f172a' : '#f9fafb',
          colorBgContainer: currentTheme === 'dark' ? '#1e293b' : '#ffffff',
          colorBgElevated: currentTheme === 'dark' ? '#334155' : '#ffffff',
          colorBgLayout: currentTheme === 'dark' ? '#0f172a' : '#f9fafb',

          // Border
          colorBorder: currentTheme === 'dark' ? '#334155' : '#e5e7eb',
          colorBorderSecondary: currentTheme === 'dark' ? '#1e293b' : '#f3f4f6',

          // Text
          colorText: currentTheme === 'dark' ? '#f8fafc' : '#111827',
          colorTextSecondary: currentTheme === 'dark' ? '#94a3b8' : '#4b5563',
          colorTextDisabled: currentTheme === 'dark' ? '#475569' : '#9ca3af',

          // Radius
          borderRadius: 6,
          borderRadiusLG: 12,
          borderRadiusSM: 4,

          // Motion
          motionDurationMid: '0.2s',
          motionEaseInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        },
        components: {
          Layout: {
            siderBg: currentTheme === 'dark' ? '#1e293b' : '#ffffff',
            headerBg: currentTheme === 'dark' ? '#1e293b' : '#ffffff',
          },
          Menu: {
            darkItemBg: '#1e293b',
            darkItemSelectedBg: 'rgba(5, 150, 105, 0.12)', // Emerald 600
            darkItemColor: '#94a3b8',
            darkItemSelectedColor: '#10b981', // Emerald 500
            darkItemHoverBg: 'rgba(5, 150, 105, 0.06)',
            darkItemHoverColor: '#f8fafc',
          },
          Button: {
            colorPrimaryTextHover: '#047857', // Emerald 700
          },
          Table: {
            headerBg: currentTheme === 'dark' ? '#334155' : '#f3f4f6', // Slate-700 / Gray-100
            rowHoverBg: currentTheme === 'dark' ? 'rgba(5,150,105,0.04)' : 'rgba(5,150,105,0.03)',
          },
          Card: {
            colorBgContainer: currentTheme === 'dark' ? '#1e293b' : '#ffffff',
          },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ConfigProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemedApp />
  </StrictMode>,
);
