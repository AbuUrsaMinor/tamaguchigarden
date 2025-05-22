import { useEffect, useState } from 'react';
import { FocusManager } from '../utils/focusManager';
import type { PlantData } from '../utils/storage';
import { GardenStorage } from '../utils/storage';
import { PlantCanvas } from './PlantCanvas';

// Debug mode settings
interface DebugModeSettings {
    enabled: boolean;
    // Growth speed multiplier (1 = normal, higher = faster)
    growthMultiplier: number;
    // Update interval in milliseconds
    updateIntervalMs: number;
}

// Default debug settings
const DEFAULT_DEBUG_SETTINGS: DebugModeSettings = {
    enabled: false,
    growthMultiplier: 10, // 10x faster growth by default in debug mode
    updateIntervalMs: 500, // Update every half second in debug mode
};

export function Garden() {
    const [plants, setPlants] = useState<PlantData[]>([]);
    const [isInFocusMode, setIsInFocusMode] = useState(false);
    const [debugMode, setDebugMode] = useState<DebugModeSettings>(DEFAULT_DEBUG_SETTINGS);
    const [lastGrowthUpdate, setLastGrowthUpdate] = useState(Date.now());
    const [dbSize, setDbSize] = useState<number | null>(null);
    const [showDebugControls, setShowDebugControls] = useState(false);

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

            // If entering focus mode or in debug mode, update last growth time
            if (inFocusMode) {
                setLastGrowthUpdate(Date.now());
            }
            // If exiting focus mode and not in debug mode, process growth
            else if (!debugMode.enabled) {
                processFocusTimeGrowth();
            }
        };

        // Register listener
        focusManager.addListener(handleFocusModeChange);

        // Initial focus mode check
        setIsInFocusMode(focusManager.isInFocusMode());

        // Initial debug mode check
        setDebugMode(prevDebugMode => ({
            ...prevDebugMode,
            enabled: focusManager.isInDebugMode()
        }));

        return () => {
            focusManager.removeListener(handleFocusModeChange);
        };
    }, []);

    // Effect for debug mode rapid growth
    useEffect(() => {
        if (!debugMode.enabled) return;

        // In debug mode, process growth at the specified interval
        const interval = setInterval(() => {
            processFocusTimeGrowth();
        }, debugMode.updateIntervalMs);

        return () => clearInterval(interval);
    }, [debugMode.enabled, debugMode.updateIntervalMs]);

    // Toggle debug mode
    const toggleDebugMode = () => {
        const focusManager = FocusManager.getInstance();
        const newDebugEnabled = !debugMode.enabled;

        setDebugMode(prev => ({
            ...prev,
            enabled: newDebugEnabled
        }));

        focusManager.setDebugMode(newDebugEnabled);
    };

    // Toggle debug controls visibility
    const toggleDebugControls = () => {
        setShowDebugControls(prev => !prev);
    };

    // Update growth speed multiplier
    const updateGrowthMultiplier = (multiplier: number) => {
        setDebugMode(prev => ({
            ...prev,
            growthMultiplier: multiplier
        }));
    };

    // Update debug update interval
    const updateDebugInterval = (intervalMs: number) => {
        setDebugMode(prev => ({
            ...prev,
            updateIntervalMs: intervalMs
        }));
    };

    // Process plant growth during focus mode
    const processFocusTimeGrowth = async () => {
        const storage = GardenStorage.getInstance();
        const now = Date.now();

        // Calculate time spent in focus mode in milliseconds
        let focusTimeMs = now - lastGrowthUpdate;

        // Apply growth multiplier in debug mode
        if (debugMode.enabled) {
            focusTimeMs *= debugMode.growthMultiplier;
        }

        // Only update if significant time passed (at least 1 minute, or as configured in debug mode)
        const minTimeMs = debugMode.enabled ? 100 : 60000; // Much lower threshold in debug mode
        if (focusTimeMs < minTimeMs) return;

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

    // Add a fully grown plant (for debugging)
    const addFullGrownPlant = async () => {
        const storage = GardenStorage.getInstance();

        // Generate random 32-bit seed
        const seed = Math.floor(Math.random() * 0xFFFFFFFF);

        // Create plant with date 6 days ago (fully grown)
        const sixDaysInMs = 6 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        const createdAt = now - sixDaysInMs;

        const newPlant: PlantData = {
            seed,
            createdAt: createdAt,
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
        <div className="flex flex-col h-full overflow-hidden">
            {/* Garden status bar */}
            <div className="bg-gray-800 p-4 text-white flex justify-between items-center flex-none">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                        <span className={`w-3 h-3 rounded-full mr-2 ${isInFocusMode || debugMode.enabled ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span>
                            {debugMode.enabled
                                ? `Debug Mode: ${debugMode.growthMultiplier}x Growth Speed`
                                : isInFocusMode
                                    ? 'Focus Mode: Plants Growing'
                                    : 'Regular Mode: Growth Paused'}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={toggleDebugMode}
                            className={`px-2 py-1 rounded text-xs ${debugMode.enabled ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                            aria-label="Toggle debug mode"
                        >
                            {debugMode.enabled ? '🐞 Debug On' : '🐞 Debug Off'}
                        </button>
                        {debugMode.enabled && (
                            <button
                                onClick={toggleDebugControls}
                                className="px-2 py-1 rounded text-xs bg-blue-600 hover:bg-blue-700"
                                aria-label="Toggle debug controls"
                            >
                                ⚙️ Settings
                            </button>
                        )}
                    </div>
                </div>
                <div className="text-xs">
                    {dbSize !== null && `Garden Size: ${dbSize.toFixed(2)} KB`}
                </div>
            </div>

            {/* Debug controls panel (only shown when debug mode is on and controls are toggled) */}
            {debugMode.enabled && showDebugControls && (
                <div className="bg-gray-700 p-4 flex flex-wrap gap-4 items-center">
                    <div>
                        <label className="block text-xs text-white mb-1">Growth Speed</label>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => updateGrowthMultiplier(1)}
                                className={`px-2 py-1 text-xs rounded ${debugMode.growthMultiplier === 1 ? 'bg-blue-600' : 'bg-gray-600'}`}
                            >
                                1x
                            </button>
                            <button
                                onClick={() => updateGrowthMultiplier(10)}
                                className={`px-2 py-1 text-xs rounded ${debugMode.growthMultiplier === 10 ? 'bg-blue-600' : 'bg-gray-600'}`}
                            >
                                10x
                            </button>
                            <button
                                onClick={() => updateGrowthMultiplier(50)}
                                className={`px-2 py-1 text-xs rounded ${debugMode.growthMultiplier === 50 ? 'bg-blue-600' : 'bg-gray-600'}`}
                            >
                                50x
                            </button>
                            <button
                                onClick={() => updateGrowthMultiplier(100)}
                                className={`px-2 py-1 text-xs rounded ${debugMode.growthMultiplier === 100 ? 'bg-blue-600' : 'bg-gray-600'}`}
                            >
                                100x
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-white mb-1">Update Interval</label>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => updateDebugInterval(2000)}
                                className={`px-2 py-1 text-xs rounded ${debugMode.updateIntervalMs === 2000 ? 'bg-blue-600' : 'bg-gray-600'}`}
                            >
                                2s
                            </button>
                            <button
                                onClick={() => updateDebugInterval(1000)}
                                className={`px-2 py-1 text-xs rounded ${debugMode.updateIntervalMs === 1000 ? 'bg-blue-600' : 'bg-gray-600'}`}
                            >
                                1s
                            </button>
                            <button
                                onClick={() => updateDebugInterval(500)}
                                className={`px-2 py-1 text-xs rounded ${debugMode.updateIntervalMs === 500 ? 'bg-blue-600' : 'bg-gray-600'}`}
                            >
                                500ms
                            </button>
                            <button
                                onClick={() => updateDebugInterval(100)}
                                className={`px-2 py-1 text-xs rounded ${debugMode.updateIntervalMs === 100 ? 'bg-blue-600' : 'bg-gray-600'}`}
                            >
                                100ms
                            </button>
                        </div>
                    </div>
                    <div>
                        <button
                            onClick={addFullGrownPlant}
                            className="px-2 py-1 rounded text-xs bg-purple-600 hover:bg-purple-700"
                            aria-label="Add mature plant"
                        >
                            Add Mature Plant
                        </button>
                    </div>
                </div>
            )}            {/* Main garden area */}
            <div className="flex-1 min-h-0 relative w-full">
                <PlantCanvas plants={plants} className="absolute inset-0 w-full h-full" />
            </div>

            {/* Controls */}
            <div className="bg-gray-800 p-4 flex justify-center flex-none">
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
