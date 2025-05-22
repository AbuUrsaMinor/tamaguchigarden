import type { PlantGenerationSettings } from "./lsystem";

/**
 * Position and state of the turtle for drawing
 */
interface TurtleState {
    x: number;
    y: number;
    angle: number;
    length: number;
    width: number;
}

/**
 * Renders an L-System string using turtle graphics
 */
export class TurtleRenderer {
    private memoizedPaths: Map<string, Path2D> = new Map();

    /**
     * Draws an L-System using turtle graphics
     * @param ctx Canvas 2D context
     * @param lSystemString The L-System string to draw
     * @param settings Plant generation settings
     * @param noise Optional noise value for swaying (-1 to 1)
     */
    drawLSystem(
        ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
        lSystemString: string,
        settings: PlantGenerationSettings,
        noise: number = 0
    ): void {
        // Check if we already have a memoized path for this combination
        // We don't include noise in the key as it changes every frame
        const memoKey = `${lSystemString}_${settings.iterations}_${settings.angle}`;

        // Check if path exists in memo
        if (!this.memoizedPaths.has(memoKey)) {
            // If not, create and store it
            const path = this.createPath(lSystemString, settings);
            this.memoizedPaths.set(memoKey, path);
        }

        // Get the path
        const path = this.memoizedPaths.get(memoKey)!;

        // Save context state
        ctx.save();

        // Move to bottom center of canvas
        ctx.translate(ctx.canvas.width / 2, ctx.canvas.height);

        // Apply sway based on noise
        // Scale noise effect based on height - affects top more than bottom
        ctx.translate(noise * 20, 0);

        // Set stem color
        ctx.strokeStyle = settings.stemColor;
        ctx.fillStyle = settings.leafColor;
        ctx.lineWidth = settings.branchWidthBase;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Draw the path
        ctx.stroke(path);

        // Restore context
        ctx.restore();
    }

    /**
     * Creates a Path2D object for the L-System
     * @param lSystemString The L-System string
     * @param settings Plant generation settings
     * @returns Path2D object representing the L-System
     */
    private createPath(
        lSystemString: string,
        settings: PlantGenerationSettings
    ): Path2D {
        const path = new Path2D();
        const stateStack: TurtleState[] = [];

        // Initialize turtle state
        let state: TurtleState = {
            x: 0,
            y: 0,
            angle: -90, // Start pointing up
            length: settings.length,
            width: settings.branchWidthBase
        };

        // Start path
        path.moveTo(state.x, state.y);

        // Process each character in the L-System string
        for (let i = 0; i < lSystemString.length; i++) {
            const cmd = lSystemString[i];

            // Process command
            switch (cmd) {
                case 'F': // Draw forward
                    // Calculate new position
                    const radians = (state.angle * Math.PI) / 180;
                    const newX = state.x + state.length * Math.cos(radians);
                    const newY = state.y + state.length * Math.sin(radians);

                    // Draw line
                    path.lineTo(newX, newY);

                    // Update position
                    state.x = newX;
                    state.y = newY;
                    break;

                case '+': // Turn right
                    state.angle += settings.angle;
                    break;

                case '-': // Turn left
                    state.angle -= settings.angle;
                    break;

                case '[': // Push state
                    stateStack.push({ ...state });
                    // Reduce size for branches
                    state.length *= settings.lengthReduction;
                    state.width *= settings.branchWidthReduction;
                    break;

                case ']': // Pop state
                    if (stateStack.length > 0) {
                        const prevState = stateStack.pop()!;

                        // Move to the previous position without drawing
                        path.moveTo(prevState.x, prevState.y);

                        // Restore previous state
                        state = prevState;
                    }
                    break;
            }
        }

        return path;
    }

    /**
     * Clears the memoized paths
     */
    clearMemoizedPaths(): void {
        this.memoizedPaths.clear();
    }
}
