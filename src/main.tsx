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
        algorithm: currentTheme === 'dark'
          ? antdTheme.darkAlgorithm
          : antdTheme.defaultAlgorithm,
        token: {
          // Brand
          colorPrimary:       '#047857',
          colorPrimaryHover:  '#065f46',
          colorPrimaryActive: '#064e3b',
      
          // Typography
          fontFamily: "'Inter', 'Noto Sans Sinhala', system-ui, -apple-system, sans-serif",
          fontSize: 14,
      
          // Surfaces (theme-conditional)
          colorBgBase:       currentTheme === 'dark' ? '#0f172a' : '#f8fafc',
          colorBgContainer:  currentTheme === 'dark' ? '#1e293b' : '#ffffff',
          colorBgElevated:   currentTheme === 'dark' ? '#334155' : '#ffffff',
          colorBgLayout:     currentTheme === 'dark' ? '#0f172a' : '#f8fafc',
      
          // Borders
          colorBorder:          currentTheme === 'dark' ? '#334155' : '#e2e8f0',
          colorBorderSecondary: currentTheme === 'dark' ? '#1e293b' : '#f1f5f9',
      
          // Text
          colorText:         currentTheme === 'dark' ? '#f1f5f9' : '#0f172a',
          colorTextSecondary: currentTheme === 'dark' ? '#94a3b8' : '#475569',
          colorTextDescription: currentTheme === 'dark' ? '#94a3b8' : '#475569',
          colorTextDisabled:  currentTheme === 'dark' ? '#475569' : '#94a3b8',
      
          // Semantic
          colorSuccess: '#10b981',
          colorWarning: '#f59e0b',
          colorError:   '#ef4444',
          colorInfo:    '#2563eb',
      
          // Radius — matches CSS token scale
          borderRadius:   6,   // --radius-md
          borderRadiusLG: 8,   // --radius-lg
          borderRadiusSM: 4,   // --radius-sm
      
          // Motion — Ive-influenced: perceptible but not theatrical
          motionDurationFast: '0.12s',
          motionDurationMid:  '0.20s',
          motionDurationSlow: '0.32s',
          motionEaseInOut:    'cubic-bezier(0.4, 0, 0.2, 1)',
          motionEaseOut:      'cubic-bezier(0, 0, 0.2, 1)',
        },
        components: {
          Layout: {
            siderBg:  currentTheme === 'dark' ? '#1e293b' : '#ffffff',
            headerBg: currentTheme === 'dark' ? '#1e293b' : '#ffffff',
            headerHeight: 56,   // Reduce from 64px to 56px — tighter chrome
          },
          Menu: {
            itemSelectedColor: currentTheme === 'dark' ? '#f1f5f9' : '#0f172a',
            itemSelectedBg:    currentTheme === 'dark' ? 'rgba(255,255,255,0.06)' : '#f8fafc',
            itemHoverColor:    currentTheme === 'dark' ? '#f8fafc' : '#0f172a',
            itemHoverBg:       currentTheme === 'dark' ? 'rgba(5, 150, 105, 0.06)' : '#f1f5f9',
            itemColor:         currentTheme === 'dark' ? '#94a3b8' : '#475569',
            darkItemBg:        '#1e293b',
            itemActiveBg:      'rgba(5, 150, 105, 0.08)',
          },
          Button: {
            borderRadius: 6,
            controlHeight: 36,   // Default button height: 36px (was 32px) — better touch target
          },
          Input: {
            borderRadius: 6,
            controlHeight: 36,
            paddingInline: 12,
          },
          Select: {
            borderRadius: 6,
            controlHeight: 36,
          },
          Table: {
            headerBg:  currentTheme === 'dark' ? '#334155' : '#f1f5f9',
            headerColor: currentTheme === 'dark' ? '#94a3b8' : '#475569',
            rowHoverBg: currentTheme === 'dark' ? 'rgba(5,150,105,0.04)' : 'rgba(5,150,105,0.03)',
            borderColor: currentTheme === 'dark' ? '#334155' : '#e2e8f0',
          },
          Card: {
            colorBgContainer: currentTheme === 'dark' ? '#1e293b' : '#ffffff',
            borderRadius: 8,
            paddingLG: 20,    // Reduce from Ant's default 24px to 20px
          },
          Modal: {
            borderRadius: 8,
          },
          Drawer: {
            borderRadius: 8,
          },
          Tag: {
            borderRadius: 4,
            fontSize: 11,
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
