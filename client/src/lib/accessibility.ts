// Accessibility utilities and hooks
import { useEffect, useRef, useState, useCallback } from 'react';

// Screen reader announcements
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// Focus management hook
export function useFocusManagement() {
  const lastFocusedElement = useRef<HTMLElement | null>(null);
  
  const saveFocus = useCallback(() => {
    lastFocusedElement.current = document.activeElement as HTMLElement;
  }, []);
  
  const restoreFocus = useCallback(() => {
    if (lastFocusedElement.current) {
      lastFocusedElement.current.focus();
      lastFocusedElement.current = null;
    }
  }, []);
  
  const trapFocus = useCallback((element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
      
      if (e.key === 'Escape') {
        restoreFocus();
      }
    };
    
    element.addEventListener('keydown', handleTabKey);
    firstElement?.focus();
    
    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  }, [restoreFocus]);
  
  return { saveFocus, restoreFocus, trapFocus };
}

// Keyboard navigation hook
export function useKeyboardNavigation<T extends HTMLElement>() {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const itemsRef = useRef<T[]>([]);
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const items = itemsRef.current.filter(item => item && !item.hasAttribute('disabled'));
    
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        setFocusedIndex(prev => (prev + 1) % items.length);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        setFocusedIndex(prev => (prev - 1 + items.length) % items.length);
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(items.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        items[focusedIndex]?.click();
        break;
    }
  }, [focusedIndex]);
  
  useEffect(() => {
    const items = itemsRef.current.filter(item => item && !item.hasAttribute('disabled'));
    items[focusedIndex]?.focus();
  }, [focusedIndex]);
  
  const registerItem = useCallback((item: T | null, index: number) => {
    if (item) {
      itemsRef.current[index] = item;
    }
  }, []);
  
  return { handleKeyDown, registerItem, focusedIndex };
}

// High contrast mode detection
export function useHighContrastMode() {
  const [isHighContrast, setIsHighContrast] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return isHighContrast;
}

// Reduced motion detection
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return prefersReducedMotion;
}

// Color scheme detection
export function useColorScheme() {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setColorScheme(mediaQuery.matches ? 'dark' : 'light');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setColorScheme(e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return colorScheme;
}

// ARIA attributes helper
export function getAriaAttributes(props: {
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  expanded?: boolean;
  selected?: boolean;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  current?: boolean | string;
}) {
  const attributes: Record<string, any> = {};
  
  if (props.label) attributes['aria-label'] = props.label;
  if (props.labelledBy) attributes['aria-labelledby'] = props.labelledBy;
  if (props.describedBy) attributes['aria-describedby'] = props.describedBy;
  if (props.expanded !== undefined) attributes['aria-expanded'] = props.expanded;
  if (props.selected !== undefined) attributes['aria-selected'] = props.selected;
  if (props.disabled !== undefined) attributes['aria-disabled'] = props.disabled;
  if (props.required !== undefined) attributes['aria-required'] = props.required;
  if (props.invalid !== undefined) attributes['aria-invalid'] = props.invalid;
  if (props.current !== undefined) attributes['aria-current'] = props.current;
  
  return attributes;
}

// Skip link component
export function SkipLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a 
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
    >
      {children}
    </a>
  );
}

// Live region component for dynamic content updates
export function LiveRegion({ 
  children, 
  level = 'polite',
  atomic = false 
}: { 
  children: React.ReactNode; 
  level?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
}) {
  return (
    <div 
      aria-live={level}
      aria-atomic={atomic}
      className="sr-only"
    >
      {children}
    </div>
  );
}

// Focus visible utility class
export const focusVisibleStyles = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default {
  announceToScreenReader,
  useFocusManagement,
  useKeyboardNavigation,
  useHighContrastMode,
  useReducedMotion,
  useColorScheme,
  getAriaAttributes,
  SkipLink,
  LiveRegion,
  focusVisibleStyles
};