import { useEffect, useState, RefObject } from 'react';

/**
 * Custom hook to detect if an element is in the viewport
 * @param ref React ref to the element to observe
 * @param rootMargin Optional margin around the viewport
 * @returns Boolean indicating if the element is in view
 */
export function useInView(ref: RefObject<Element>, rootMargin: string = '0px'): boolean {
  const [isInView, setIsInView] = useState(false);
  
  useEffect(() => {
    if (!ref.current) return;
    
    // Check if IntersectionObserver is available
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          // Update state when visibility changes
          setIsInView(entry.isIntersecting);
        },
        { rootMargin }
      );
      
      // Start observing
      observer.observe(ref.current);
      
      // Cleanup function
      return () => {
        observer.disconnect();
      };
    } else {
      // Fallback if IntersectionObserver not supported
      setIsInView(true); // Always render
      return;
    }
  }, [ref, rootMargin]);
  
  return isInView;
}
