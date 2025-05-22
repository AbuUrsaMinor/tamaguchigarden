import React, { useEffect, useRef, useState } from 'react';
import { PlantData } from '../utils/storage';
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
  
  // Effect to initialize worker when canvas is ready
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Create the worker
    const worker = new CanvasWorker();
    workerRef.current = worker;
    
    // Create OffscreenCanvas from the canvas element
    const offscreenCanvas = canvas.transferControlToOffscreen();
    
    // Initialize worker with the offscreen canvas
    worker.postMessage(
      { type: 'init', canvas: offscreenCanvas },
      [offscreenCanvas]
    );
    
    setIsInitialized(true);
    
    // Cleanup on unmount
    return () => {
      worker.terminate();
      workerRef.current = null;
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
  };
  
  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return;
      
      // Set canvas size to match display size
      const canvas = canvasRef.current;
      const parent = canvas.parentElement;
      
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    
    // Initial size
    handleResize();
    
    // Listen for resize
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef}
      className={`w-full h-full ${className || ''}`}
      tabIndex={-1}
      aria-label="Virtual garden with procedurally generated plants"
    />
  );
}
