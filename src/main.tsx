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
          colorPrimary: '#10b981',
          colorPrimaryHover: '#34d399',
          colorPrimaryActive: '#059669',

          // Typography
          fontFamily:
            "'Inter', 'Noto Sans Sinhala', system-ui, -apple-system, sans-serif",
          fontSize: 14,

          // Surface tokens (dark)
          colorBgBase: currentTheme === 'dark' ? '#0d1117' : '#f8fafc',
          colorBgContainer: currentTheme === 'dark' ? '#161b22' : '#ffffff',
          colorBgElevated: currentTheme === 'dark' ? '#1c2333' : '#ffffff',
          colorBgLayout: currentTheme === 'dark' ? '#0d1117' : '#f1f5f9',

          // Border
          colorBorder: currentTheme === 'dark' ? '#30363d' : '#e2e8f0',
          colorBorderSecondary: currentTheme === 'dark' ? '#21262d' : '#f1f5f9',

          // Text
          colorText: currentTheme === 'dark' ? '#e6edf3' : '#0f172a',
          colorTextSecondary: currentTheme === 'dark' ? '#8b949e' : '#475569',
          colorTextDisabled: currentTheme === 'dark' ? '#484f58' : '#94a3b8',

          // Radius
          borderRadius: 8,
          borderRadiusLG: 12,
          borderRadiusSM: 6,

          // Motion
          motionDurationMid: '0.2s',
          motionEaseInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        },
        components: {
          Layout: {
            siderBg: currentTheme === 'dark' ? '#161b22' : '#ffffff',
            headerBg: currentTheme === 'dark' ? '#161b22' : '#ffffff',
          },
          Menu: {
            darkItemBg: '#161b22',
            darkItemSelectedBg: 'rgba(16, 185, 129, 0.12)',
            darkItemColor: '#8b949e',
            darkItemSelectedColor: '#10b981',
            darkItemHoverBg: 'rgba(16, 185, 129, 0.06)',
            darkItemHoverColor: '#e6edf3',
          },
          Button: {
            // Primary button uses the emerald gradient via CSS — the base
            // color here provides the hover/focus ring fallback
            colorPrimaryTextHover: '#34d399',
          },
          Table: {
            headerBg: currentTheme === 'dark' ? '#1c2333' : '#f8fafc',
            rowHoverBg: currentTheme === 'dark' ? 'rgba(16,185,129,0.04)' : 'rgba(16,185,129,0.03)',
          },
          Card: {
            colorBgContainer: currentTheme === 'dark' ? '#161b22' : '#ffffff',
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
