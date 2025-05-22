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
    | { type: 'initWithoutTransfer' } & CanvasSize
    | { type: 'updatePlants'; plants: WorkerPlantData[] }
    | { type: 'setVisible'; isVisible: boolean }
    | { type: 'resize'; } & CanvasSize;

let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;
let plants: WorkerPlantData[] = [];
let isVisible = true;
let animationFrameId: number | null = null;
let canvasSize: CanvasSize | null = null;

// Initialize noise generator with a random seed
const simplex = createNoise2D();
const turtleRenderer = new TurtleRenderer();
const lSystemGenerator = new LSystemGenerator(Date.now());

// Use a flag to track if we're using direct canvas or message-based drawing
let useDirectCanvas = true;

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

        case 'initWithoutTransfer':
            // Fallback initialization without OffscreenCanvas
            useDirectCanvas = false;
            canvasSize = {
                width: message.width,
                height: message.height,
                cssWidth: message.cssWidth,
                cssHeight: message.cssHeight
            };

            // Create a virtual canvas context for calculations
            canvas = new OffscreenCanvas(message.width, message.height);
            ctx = canvas.getContext('2d', { alpha: true });

            if (ctx) {
                initializeCanvas();
                startRenderLoop();
            } else {
                console.error('Failed to get 2D context from fallback canvas');
            }
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

// Initialize canvas settings
function initializeCanvas() {
    if (!ctx) return;

    // Set initial canvas settings
    ctx.fillStyle = '#242424';
    ctx.fillRect(0, 0, canvasSize?.width || 0, canvasSize?.height || 0);
}

// Start the render loop
function startRenderLoop() {
    if (!isVisible || animationFrameId !== null) return;

    const frame = () => {
        render();
        animationFrameId = requestAnimationFrame(frame);
    };

    animationFrameId = requestAnimationFrame(frame);
}

// Stop the render loop
function stopRenderLoop() {
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

// Main render function
function render() {
    if (!ctx || !canvas || !canvasSize) return;

    // Clear canvas
    ctx.fillStyle = '#242424';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Render all plants
    for (const plant of plants) {
        renderPlant(plant);
    }

    // If we're not using direct canvas, send the drawing data back to the main thread
    if (!useDirectCanvas) {
        const imageData = canvas.transferToImageBitmap();
        self.postMessage({
            type: 'drawCommands',
            image: imageData
        }, [imageData]);
    }
}

// Render a single plant
function renderPlant(plant: WorkerPlantData) {
    if (!ctx || !canvas || !canvasSize) return;

    // Set up the L-system for this plant
    lSystemGenerator.setSeed(plant.seed);
    const rules = lSystemGenerator.generatePlantRules(plant.settings);
    const iterations = Math.min(5, Math.max(1, Math.floor(plant.ageInDays / 3) + 1));
    const lSystem = lSystemGenerator.generateFromRules(rules, iterations);

    // Calculate plant position based on its ID for deterministic placement
    const xPos = ((plant.id * 123) % 100) / 100 * canvasSize.width;
    const yPos = canvasSize.height * 0.8; // Place plants near the bottom

    // Set up turtle renderer
    turtleRenderer.setContext(ctx);
    turtleRenderer.render(lSystem, xPos, yPos, plant.ageInDays);
}
