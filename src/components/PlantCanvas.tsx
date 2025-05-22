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
    const hasTransferred = useRef(false);

    // Effect to initialize worker when canvas is ready
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || hasTransferred.current) return;

        // Create the worker
        const worker = new CanvasWorker();
        workerRef.current = worker;

        try {
            // Create OffscreenCanvas from the canvas element
            const offscreenCanvas = canvas.transferControlToOffscreen();
            hasTransferred.current = true;

            // Initialize worker with the offscreen canvas
            worker.postMessage(
                { type: 'init', canvas: offscreenCanvas },
                [offscreenCanvas]
            );

            setIsInitialized(true);
        } catch (error) {
            console.error('Failed to transfer canvas control:', error);
            // Reset state to allow retry
            hasTransferred.current = false;
            worker.terminate();
            workerRef.current = null;
        }

        // Cleanup on unmount or when canvas changes
        return () => {
            if (worker) {
                worker.terminate();
                workerRef.current = null;
                setIsInitialized(false);
            }
            hasTransferred.current = false;
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
    };

    // Handle resize
    useEffect(() => {
        const handleResize = () => {
            if (!canvasRef.current || !isInitialized || !workerRef.current) return;

            // Set canvas size to match display size
            const canvas = canvasRef.current;
            const parent = canvas.parentElement;

            if (parent) {
                const width = parent.clientWidth;
                const height = parent.clientHeight;

                canvas.width = width;
                canvas.height = height;

                // Notify worker of size change
                workerRef.current.postMessage({
                    type: 'resize',
                    width,
                    height
                });
            }
        };

        // Initial size
        handleResize();

        // Listen for resize
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [isInitialized]);

    return (
        <canvas
            ref={canvasRef}
            className={`w-full h-full ${className || ''}`}
            tabIndex={-1}
            aria-label="Virtual garden with procedurally generated plants"
        />
    );
}
