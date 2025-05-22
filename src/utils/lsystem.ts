import { Mulberry32 } from "./prng";

/**
 * Represents an L-System rule
 */
export interface LSystemRule {
    predecessor: string;
    successor: string;
    probability?: number; // Optional probability for stochastic systems
}

/**
 * Plant generation settings
 */
export interface PlantGenerationSettings {
    axiom: string;
    rules: LSystemRule[];
    angle: number;
    iterations: number;
    length: number;
    lengthReduction: number;
    branchWidthBase: number;
    branchWidthReduction: number;
    leafSize: number;
    leafColor: string;
    stemColor: string;
}

/**
 * Generates a plant using an L-System
 */
export class LSystemGenerator {
    private prng: Mulberry32;

    /**
     * Creates a new LSystemGenerator instance
     * @param seed A 32-bit seed value
     */
    constructor(seed: number) {
        this.prng = new Mulberry32(seed);
    }

    /**
     * Generates the L-System string based on settings
     * @param settings Plant generation settings
     * @returns Generated L-System string
     */
    growString(settings: PlantGenerationSettings): string {
        let result = settings.axiom;

        // Apply L-System rules for specified number of iterations
        for (let i = 0; i < settings.iterations; i++) {
            let newResult = '';

            // Process each character in the current string
            for (let j = 0; j < result.length; j++) {
                const char = result[j];
                let replacement = char;

                // Check if there's a rule for this character
                for (const rule of settings.rules) {
                    if (rule.predecessor === char) {
                        // If rule has a probability, use it, otherwise always apply
                        if (rule.probability === undefined || this.prng.next() < rule.probability) {
                            replacement = rule.successor;
                            break;
                        }
                    }
                }

                newResult += replacement;
            }

            result = newResult;
        }

        return result;
    }

    /**
     * Generates preset plant configuration based on seed
     * @param seed The seed value
     * @param growthStage Growth stage (0-5)
     * @returns Plant generation settings
     */
    generatePlantPreset(seed: number, growthStage: number = 5): PlantGenerationSettings {
        // Create a new PRNG based on seed to ensure consistent results
        const localPrng = new Mulberry32(seed);

        // Create a random plant type based on seed
        const plantType = localPrng.nextInt(0, 3); // 4 different plant types

        // Cap iterations at growthStage (max 5)
        const iterations = Math.min(growthStage, 5);

        // Base settings
        const baseSettings: PlantGenerationSettings = {
            axiom: 'X',
            rules: [],
            angle: 25 + localPrng.nextFloat(-5, 5),
            iterations,
            length: 10 - iterations, // Length decreases as iterations increase
            lengthReduction: 0.8 + localPrng.nextFloat(-0.1, 0.1),
            branchWidthBase: 5,
            branchWidthReduction: 0.7 + localPrng.nextFloat(-0.1, 0.1),
            leafSize: 5 + localPrng.nextFloat(-1, 3),
            leafColor: `hsl(${100 + localPrng.nextInt(-20, 20)}, ${60 + localPrng.nextInt(-20, 10)}%, ${40 + localPrng.nextInt(-10, 10)}%)`,
            stemColor: `hsl(${25 + localPrng.nextInt(-10, 10)}, ${50 + localPrng.nextInt(-20, 10)}%, ${30 + localPrng.nextInt(-10, 10)}%)`,
        };

        // Customize based on plant type
        switch (plantType) {
            case 0: // Fern-like
                baseSettings.rules = [
                    { predecessor: 'X', successor: 'F+[[X]-X]-F[-FX]+X' },
                    { predecessor: 'F', successor: 'FF' }
                ];
                baseSettings.angle = 22 + localPrng.nextFloat(-3, 3);
                break;

            case 1: // Bushy plant
                baseSettings.rules = [
                    { predecessor: 'X', successor: 'F[+X][-X]FX' },
                    { predecessor: 'F', successor: 'FF' }
                ];
                baseSettings.angle = 35 + localPrng.nextFloat(-5, 5);
                baseSettings.leafSize *= 1.2;
                break;

            case 2: // Tree-like
                baseSettings.rules = [
                    { predecessor: 'X', successor: 'F[+X][-X][++X][--X]FX' },
                    { predecessor: 'F', successor: 'FF' }
                ];
                baseSettings.angle = 30 + localPrng.nextFloat(-5, 5);
                break;

            case 3: // Random branching
                baseSettings.axiom = 'FX';
                baseSettings.rules = [
                    { predecessor: 'X', successor: '[-FX][+FX]' },
                    { predecessor: 'F', successor: 'FF', probability: 0.8 }
                ];
                baseSettings.angle = 40 + localPrng.nextFloat(-8, 8);
                break;
        }

        return baseSettings;
    }
}
