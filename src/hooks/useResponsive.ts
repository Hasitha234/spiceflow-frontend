import { useState, useEffect } from 'react';

// Breakpoints should match index.css
const MOBILE_BREAKPOINT = 640;
const TABLET_BREAKPOINT = 1024;

export const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    // Check if window is defined (for SSR safety, though this is CRA/Vite)
    if (typeof window === 'undefined') return;

    const checkResponsive = () => {
      const width = window.innerWidth;
      setIsMobile(width < MOBILE_BREAKPOINT);
      setIsTablet(width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT);
      setIsDesktop(width >= TABLET_BREAKPOINT);
    };

    // Initial check
    checkResponsive();

    // Setup event listener
    window.addEventListener('resize', checkResponsive);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkResponsive);
  }, []);

  return { isMobile, isTablet, isDesktop };
};

export const useIsMobile = () => {
  const { isMobile } = useResponsive();
  return isMobile;
};
