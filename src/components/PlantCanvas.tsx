import { useEffect, useRef } from 'react';
import type { PlantData } from '../utils/storage';
import { useInView } from './useInView';

// Temporarily disable worker import
// @ts-ignore - Vite will handle this correctly
// import CanvasWorker from '../workers/canvasWorker.ts?worker';

interface PlantCanvasProps {
    plants: PlantData[];
    className?: string;
}

// Simple fallback rendering with direct canvas
export function PlantCanvas({ plants, className }: PlantCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // Cast the ref to make TypeScript happy
    const isInView = useInView(canvasRef as React.RefObject<Element>);

    // Get canvas dimensions from parent element
    const getCanvasSize = () => {
        const parent = canvasRef.current?.parentElement;
        if (!parent) return null;

        // Use getBoundingClientRect for precise measurements
        const rect = parent.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        return {
            width: Math.floor(rect.width * dpr),
            height: Math.floor(rect.height * dpr),
            cssWidth: Math.floor(rect.width),
            cssHeight: Math.floor(rect.height)
        };
    };

    // Effect to initialize canvas when ready and re-render when visibility changes
    useEffect(() => {
        if (!isInView) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const size = getCanvasSize();
        if (!size || size.width <= 0 || size.height <= 0) {
            console.error('Invalid canvas dimensions');
            return;
        }

        // Set canvas size
        canvas.width = size.width;
        canvas.height = size.height;

        // Initialize 2D context
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Failed to get 2D context');
            return;
        }

        // Draw a placeholder background
        ctx.fillStyle = '#87CEEB';  // Sky blue
        ctx.fillRect(0, 0, size.width, size.height);

        // Draw a simple ground
        ctx.fillStyle = '#8FBC8F';  // Dark sea green
        ctx.fillRect(0, size.height * 0.7, size.width, size.height * 0.3);

        // Draw a simple placeholder for each plant
        plants.forEach((plant, index) => {
            const x = (index % 3 + 0.5) * size.width / 3;
            const y = size.height * 0.7;

            // Use the plant's seed to determine color
            const hue = (plant.seed % 360);
            ctx.fillStyle = `hsl(${hue}, 80%, 40%)`;

            // Draw a simple "plant" - a rectangle for stem
            ctx.fillRect(x - 5, y - 100, 10, 100);

            // Draw a circle for the "flower"
            ctx.beginPath();
            ctx.arc(x, y - 120, 20, 0, Math.PI * 2);
            ctx.fill();
        });

    }, [plants, isInView]);

    // Effect to handle resize
    useEffect(() => {
        const handleResize = () => {
            if (!isInView) return;

            const canvas = canvasRef.current;
            if (!canvas) return;

            const size = getCanvasSize();
            if (!size) return;

            // Update canvas size
            canvas.width = size.width;
            canvas.height = size.height;

            // Force redraw
            // Re-render with current plants
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Draw background
            ctx.fillStyle = '#87CEEB';
            ctx.fillRect(0, 0, size.width, size.height);

            // Draw ground
            ctx.fillStyle = '#8FBC8F';
            ctx.fillRect(0, size.height * 0.7, size.width, size.height * 0.3);

            // Draw plants
            plants.forEach((plant, index) => {
                const x = (index % 3 + 0.5) * size.width / 3;
                const y = size.height * 0.7;

                const hue = (plant.seed % 360);
                ctx.fillStyle = `hsl(${hue}, 80%, 40%)`;

                ctx.fillRect(x - 5, y - 100, 10, 100);

                ctx.beginPath();
                ctx.arc(x, y - 120, 20, 0, Math.PI * 2);
                ctx.fill();
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [plants, isInView]);

    return (
        <canvas
            ref={canvasRef}
            className={className}
            style={{ width: '100%', height: '100%' }}
        />
    );
}
