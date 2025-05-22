import { createNoise2D } from 'simplex-noise';
import { type PlantGenerationSettings, LSystemGenerator } from '../utils/lsystem';
import { TurtleRenderer } from '../utils/turtleRenderer';

/**
 * The plant data structure for the worker
 */
interface WorkerPlantData {
    id: number;
    seed: number;
    ageInDays: number;
    settings?: PlantGenerationSettings;
}

/**
 * Message types from main thread to worker
 */
interface CanvasSize {
    width: number;
    height: number;
    cssWidth?: number;
    cssHeight?: number;
}

type WorkerMessage =
    | { type: 'init'; canvas: OffscreenCanvas } & CanvasSize
    | { type: 'updatePlants'; plants: WorkerPlantData[] }
    | { type: 'setVisible'; isVisible: boolean }
    | { type: 'resize'; } & CanvasSize;

let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;
let plants: WorkerPlantData[] = [];
let isVisible = true;
let animationFrameId: number | null = null;

// Initialize noise generator with a random seed
const simplex = createNoise2D();
const turtleRenderer = new TurtleRenderer();
const lSystemGenerator = new LSystemGenerator(Date.now());

/**
 * Initialize the worker with a canvas
 * @param offscreenCanvas The OffscreenCanvas transferred from main thread
 * @param size The initial canvas size
 */
function initialize(offscreenCanvas: OffscreenCanvas, size: CanvasSize): void {
    canvas = offscreenCanvas;
    canvas.width = size.width;
    canvas.height = size.height;

    // Get 2D context
    ctx = canvas.getContext('2d', { alpha: false }) as OffscreenCanvasRenderingContext2D;

    if (!ctx) {
        console.error('Failed to get 2D context from OffscreenCanvas');
        return;
    }

    // Start the render loop
    startRenderLoop();
}

/**
 * Update the plants data
 * @param newPlants Array of plant data
 */
function updatePlants(newPlants: WorkerPlantData[]): void {
    plants = newPlants.map(plant => {
        // Calculate growth stage (min of 5 and ageInDays)
        const growthStage = Math.min(5, plant.ageInDays);

        // Generate settings if not present
        if (!plant.settings) {
            plant.settings = lSystemGenerator.generatePlantPreset(plant.seed, growthStage);
        }

        return plant;
    });
}

/**
 * Set visibility state of the canvas
 * @param visible Whether canvas is visible
 */
function setVisible(visible: boolean): void {
    isVisible = visible;

    if (isVisible && !animationFrameId) {
        startRenderLoop();
    } else if (!isVisible && animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

/**
 * Handle canvas resize
 * @param width New width
 * @param height New height
 */
function handleResize({ width, height }: CanvasSize): void {
    if (!canvas || !ctx) return;

    // Update canvas resolution while maintaining visual size
    canvas.width = width;
    canvas.height = height;

    // Clear the turtle renderer's path cache since we need to regenerate for new size
    turtleRenderer.clearMemoizedPaths();

    // Force a redraw immediately
    if (isVisible) {
        renderFrame(performance.now(), 0);
    }
}

/**
 * Start the render loop
 */
function startRenderLoop(): void {
    let lastTime = performance.now();

    const render = (time: number): void => {
        // Calculate delta time in seconds
        const deltaTime = (time - lastTime) / 1000;
        lastTime = time;

        // Only render if canvas is visible
        if (isVisible && ctx && canvas) {
            renderFrame(time, deltaTime);
        }

        // Request next frame
        animationFrameId = requestAnimationFrame(render);
    };

    // Start the render loop
    animationFrameId = requestAnimationFrame(render);
}

/**
 * Render a single frame
 * @param time Current time
 * @param deltaTime Time since last frame in seconds
 */
function renderFrame(time: number, _deltaTime: number): void {
    if (!ctx || !canvas) return;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');  // Sky blue
    gradient.addColorStop(1, '#8FBC8F');  // Dark sea green

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all plants
    plants.forEach((plant, index) => {
        // Skip if no settings
        if (!plant.settings) return;
        if (!canvas) return;

        // Calculate position based on index
        const x = (index % 3) * (canvas.width / 3) + (canvas.width / 6);

        // Calculate noise offset for this plant
        // Use seed and time to ensure different plants sway differently
        const noiseX = simplex(plant.seed / 1000, time / 2000) * 0.5;

        // Save context
        ctx!.save();

        if (!canvas || !ctx) return;

        // Move to plant position
        ctx.translate(x, 0);

        // Draw the plant
        const lSystemString = lSystemGenerator.growString(plant.settings);
        turtleRenderer.drawLSystem(ctx, lSystemString, plant.settings, noiseX);

        // Restore context
        ctx.restore();
    });
}

// Listen for messages from the main thread
self.onmessage = (event: MessageEvent<WorkerMessage>): void => {
    const message = event.data;

    switch (message.type) {
        case 'init':
            initialize(message.canvas, message);
            break;

        case 'updatePlants':
            updatePlants(message.plants);
            break;

        case 'setVisible':
            setVisible(message.isVisible);
            break;

        case 'resize':
            handleResize(message);
            break;
    }
};
