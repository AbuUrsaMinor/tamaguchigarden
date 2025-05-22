import { useEffect, useState } from 'react';
import { FocusManager } from '../utils/focusManager';
import type { PlantData } from '../utils/storage';
import { GardenStorage } from '../utils/storage';
import { PlantCanvas } from './PlantCanvas';

export function Garden() {
    const [plants, setPlants] = useState<PlantData[]>([]);
    const [isInFocusMode, setIsInFocusMode] = useState(false);
    const [lastGrowthUpdate, setLastGrowthUpdate] = useState(Date.now());
    const [dbSize, setDbSize] = useState<number | null>(null);

    // Initialize focus manager and storage
    useEffect(() => {
        const focusManager = FocusManager.getInstance();
        const storage = GardenStorage.getInstance();

        // Load existing plants
        const loadPlants = async () => {
            const storedPlants = await storage.getAllPlants();
            setPlants(storedPlants);

            // Update database size estimate
            const size = await storage.getDatabaseSizeEstimate();
            setDbSize(size);
        };

        loadPlants();

        // Set up focus mode listener
        const handleFocusModeChange = (inFocusMode: boolean) => {
            setIsInFocusMode(inFocusMode);

            // If entering focus mode, update last growth time
            if (inFocusMode) {
                setLastGrowthUpdate(Date.now());
            }
            // If exiting focus mode, process growth
            else {
                processFocusTimeGrowth();
            }
        };

        // Register listener
        focusManager.addListener(handleFocusModeChange);

        // Initial focus mode check
        setIsInFocusMode(focusManager.isInFocusMode());

        return () => {
            focusManager.removeListener(handleFocusModeChange);
        };
    }, []);

    // Process plant growth during focus mode
    const processFocusTimeGrowth = async () => {
        const storage = GardenStorage.getInstance();
        const now = Date.now();

        // Calculate time spent in focus mode in milliseconds
        const focusTimeMs = now - lastGrowthUpdate;

        // Only update if significant time passed (at least 1 minute)
        if (focusTimeMs < 60000) return;

        // Update all plants' growth time
        await storage.updateAllPlantsGrowthTime(now);

        // Reload plants to get updated data
        const updatedPlants = await storage.getAllPlants();
        setPlants(updatedPlants);

        // Update database size estimate
        const size = await storage.getDatabaseSizeEstimate();
        setDbSize(size);

        // Reset growth update time
        setLastGrowthUpdate(now);
    };

    // Add a new random plant
    const addRandomPlant = async () => {
        const storage = GardenStorage.getInstance();

        // Generate random 32-bit seed
        const seed = Math.floor(Math.random() * 0xFFFFFFFF);

        const now = Date.now();

        // Create new plant
        const newPlant: PlantData = {
            seed,
            createdAt: now,
            lastGrowthAt: now
        };

        // Add to storage
        await storage.addPlant(newPlant);

        // Reload plants
        const updatedPlants = await storage.getAllPlants();
        setPlants(updatedPlants);

        // Update database size estimate
        const size = await storage.getDatabaseSizeEstimate();
        setDbSize(size);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Garden status bar */}
            <div className="bg-gray-800 p-4 text-white flex justify-between items-center">
                <div className="flex items-center">
                    <span className={`w-3 h-3 rounded-full mr-2 ${isInFocusMode ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>{isInFocusMode ? 'Focus Mode: Plants Growing' : 'Regular Mode: Growth Paused'}</span>
                </div>
                <div className="text-xs">
                    {dbSize !== null && `Garden Size: ${dbSize.toFixed(2)} KB`}
                </div>
            </div>

            {/* Main garden area */}
            <div className="flex-grow relative">
                <PlantCanvas plants={plants} className="absolute inset-0" />
            </div>

            {/* Controls */}
            <div className="bg-gray-800 p-4 flex justify-center">
                <button
                    onClick={addRandomPlant}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full"
                    aria-label="Plant a new seed"
                >
                    Plant a Seed
                </button>
            </div>
        </div>
    );
}
