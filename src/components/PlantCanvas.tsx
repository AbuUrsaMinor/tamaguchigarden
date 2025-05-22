import { useEffect, useRef, useState } from 'react';
import type { PlantData } from '../utils/storage';
import { useInView } from './useInView';

// Import worker as a URL
// @ts-ignore - Vite will handle this correctly
import CanvasWorker from '../workers/canvasWorker.ts?worker';

interface PlantCanvasProps {
    plants: PlantData[];
    className?: string;
}

export function PlantCanvas({ plants, className }: PlantCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const workerRef = useRef<Worker | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const isInView = useInView(canvasRef);
    const hasTransferred = useRef(false);    // Get canvas dimensions from parent element
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

    // Effect to initialize worker when canvas is ready
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || hasTransferred.current) return;

        const size = getCanvasSize();
        if (!size || size.width <= 0 || size.height <= 0) {
            console.error('Invalid canvas dimensions');
            return;
        }

        try {
            // Create new worker
            const worker = new CanvasWorker();
            workerRef.current = worker;

            // Create OffscreenCanvas from the canvas element
            const offscreen = canvas.transferControlToOffscreen();
            hasTransferred.current = true;

            // Initialize worker with the offscreen canvas and initial size
            worker.postMessage(
                {
                    type: 'init',
                    canvas: offscreen,
                    width: size.width,
                    height: size.height
                },
                [offscreen]
            );

            setIsInitialized(true);
        } catch (error) {
            console.error('Failed to transfer canvas control:', error);
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
            hasTransferred.current = false;
            setIsInitialized(false);
        }

        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
            hasTransferred.current = false;
            setIsInitialized(false);
        };
    }, []);

    // Effect to update plants in worker
    useEffect(() => {
        if (!isInitialized || !workerRef.current) return;

        // Convert PlantData to worker format
        const workerPlants = plants.map(plant => ({
            id: plant.id!,
            seed: plant.seed,
            ageInDays: calculateAgeInDays(plant)
        }));

        // Send plants to worker
        workerRef.current.postMessage({
            type: 'updatePlants',
            plants: workerPlants
        });
    }, [plants, isInitialized]);

    // Effect to update visibility
    useEffect(() => {
        if (!isInitialized || !workerRef.current) return;

        workerRef.current.postMessage({
            type: 'setVisible',
            isVisible: isInView
        });
    }, [isInView, isInitialized]);

    // Calculate plant age in days
    const calculateAgeInDays = (plant: PlantData): number => {
        const now = Date.now();
        const ageMs = now - plant.createdAt;
        return ageMs / (1000 * 60 * 60 * 24); // Convert ms to days
    };    // Handle resize with debounce
    useEffect(() => {
        let resizeTimeoutId: number;
        const debouncedResize = () => {
            if (resizeTimeoutId) {
                window.clearTimeout(resizeTimeoutId);
            }

            resizeTimeoutId = window.setTimeout(() => {
                if (!isInitialized || !workerRef.current) return;

                const size = getCanvasSize();
                if (!size) return;

                // Notify worker of size change
                workerRef.current.postMessage({
                    type: 'resize',
                    width: size.width,
                    height: size.height,
                    cssWidth: size.cssWidth,
                    cssHeight: size.cssHeight,
                });
            }, 100); // Debounce for 100ms
        };

        window.addEventListener('resize', debouncedResize);

        // Initial size update
        if (isInitialized && workerRef.current) {
            debouncedResize();
        }

        return () => {
            window.removeEventListener('resize', debouncedResize);
            if (resizeTimeoutId) {
                window.clearTimeout(resizeTimeoutId);
            }
        };
    }, [isInitialized]);// Set initial canvas size using inline styles
    const canvasStyle = {
        display: 'block',
        touchAction: 'none' as const,
        width: '100%',
        height: '100%'
    };

    return (
        <canvas
            ref={canvasRef}
            className={className || ''}
            style={canvasStyle}
            tabIndex={-1}
            aria-label="Virtual garden with procedurally generated plants"
        />
    );
}
