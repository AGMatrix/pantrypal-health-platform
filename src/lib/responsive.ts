// src/lib/responsive.ts
// Responsive design utilities and breakpoint system

export const breakpoints = {
    xs: '320px',   // Small phones
    sm: '640px',   // Large phones
    md: '768px',   // Tablets
    lg: '1024px',  // Small laptops
    xl: '1280px',  // Desktops
    '2xl': '1536px' // Large screens
  } as const;
  
  export type Breakpoint = keyof typeof breakpoints;
  
  export const deviceQueries = {
    mobile: '(max-width: 767px)',
    tablet: '(min-width: 768px) and (max-width: 1023px)',
    desktop: '(min-width: 1024px)',
    touch: '(hover: none) and (pointer: coarse)',
    mouse: '(hover: hover) and (pointer: fine)'
  } as const;
  
  // Responsive grid utilities
  export const gridResponsive = {
    mobile: 'grid-cols-1',
    tablet: 'grid-cols-2',
    desktop: 'grid-cols-3',
    wide: 'grid-cols-4'
  } as const;
  
  // Responsive spacing utilities
  export const spacingResponsive = {
    xs: 'p-2 sm:p-3 md:p-4 lg:p-6',
    sm: 'p-3 sm:p-4 md:p-6 lg:p-8',
    md: 'p-4 sm:p-6 md:p-8 lg:p-12',
    lg: 'p-6 sm:p-8 md:p-12 lg:p-16'
  } as const;
  
  // Responsive text utilities
  export const textResponsive = {
    xs: 'text-xs sm:text-sm',
    sm: 'text-sm sm:text-base',
    base: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl md:text-2xl',
    xl: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl',
    '2xl': 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl'
  } as const;
  
  // Utility function to check if device is mobile
  export const isMobile = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  };
  
  // Utility function to check if device is tablet
  export const isTablet = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 768 && window.innerWidth < 1024;
  };
  
  // Utility function to check if device is desktop
  export const isDesktop = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 1024;
  };
  
  // Touch device detection
  export const isTouchDevice = (): boolean => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  };
  
  // Responsive hook for React components
  export const useResponsive = () => {
    const [device, setDevice] = React.useState<'mobile' | 'tablet' | 'desktop'>('desktop');
    
    React.useEffect(() => {
      const handleResize = () => {
        const width = window.innerWidth;
        if (width < 768) setDevice('mobile');
        else if (width < 1024) setDevice('tablet');
        else setDevice('desktop');
      };
      
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    return {
      device,
      isMobile: device === 'mobile',
      isTablet: device === 'tablet',
      isDesktop: device === 'desktop',
      isTouchDevice: isTouchDevice()
    };
  };
  
  // Container responsive classes
  export const containerResponsive = 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';
  
  // Modal responsive classes
  export const modalResponsive = {
    container: 'fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 lg:p-8',
    content: 'bg-white rounded-xl sm:rounded-2xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-4xl max-h-[95vh] overflow-hidden',
    padding: 'p-4 sm:p-6 lg:p-8'
  };
  
  // Button responsive classes
  export const buttonResponsive = {
    xs: 'px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm',
    sm: 'px-3 py-1.5 text-sm sm:px-4 sm:py-2 sm:text-base',
    md: 'px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base',
    lg: 'px-6 py-3 text-base sm:px-8 sm:py-4 sm:text-lg'
  };
  
  // Form input responsive classes
  export const inputResponsive = 'w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  
  // Card responsive classes
  export const cardResponsive = 'bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-sm sm:shadow-md lg:shadow-lg border border-gray-200 overflow-hidden';
  
  // Navigation responsive classes
  export const navResponsive = {
    container: 'sticky top-0 z-40 w-full bg-white/80 backdrop-blur-lg border-b border-gray-200',
    content: 'flex items-center justify-between h-14 sm:h-16 lg:h-20 px-4 sm:px-6 lg:px-8',
    menu: 'hidden md:flex items-center space-x-2 lg:space-x-4',
    mobileMenu: 'md:hidden'
  };
  
  // Image responsive classes
  export const imageResponsive = 'w-full h-32 sm:h-40 md:h-48 lg:h-56 object-cover';
  
  // Typography responsive classes
  export const typographyResponsive = {
    h1: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold',
    h2: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold',
    h3: 'text-lg sm:text-xl md:text-2xl font-semibold',
    h4: 'text-base sm:text-lg md:text-xl font-semibold',
    body: 'text-sm sm:text-base',
    caption: 'text-xs sm:text-sm text-gray-600'
  };
  
  export default {
    breakpoints,
    deviceQueries,
    gridResponsive,
    spacingResponsive,
    textResponsive,
    containerResponsive,
    modalResponsive,
    buttonResponsive,
    inputResponsive,
    cardResponsive,
    navResponsive,
    imageResponsive,
    typographyResponsive,
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,
    useResponsive
  };