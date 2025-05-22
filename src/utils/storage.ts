import type { IDBPDatabase } from 'idb';
import { openDB } from 'idb';

/**
 * Plant data structure stored in IndexedDB
 */
export interface PlantData {
    id?: number;
    seed: number;
    createdAt: number;
    lastGrowthAt: number;
}

/**
 * Garden database structure
 */
export interface GardenDB {
    plants: PlantData[];
}

/**
 * Class for managing IndexedDB storage
 */
export class GardenStorage {
    private dbPromise: Promise<IDBPDatabase>;
    private static instance: GardenStorage;

    /**
     * Gets singleton instance of GardenStorage
     */
    public static getInstance(): GardenStorage {
        if (!GardenStorage.instance) {
            GardenStorage.instance = new GardenStorage();
        }
        return GardenStorage.instance;
    }

    /**
     * Creates a new GardenStorage instance
     */
    private constructor() {
        this.dbPromise = this.initDB();
    }

    /**
     * Initializes the IndexedDB database
     * @returns Promise resolving to the database
     */
    private async initDB(): Promise<IDBPDatabase> {
        return openDB('tamaguchi-garden', 1, {
            upgrade(db) {
                // Create plants object store
                if (!db.objectStoreNames.contains('plants')) {
                    const plantStore = db.createObjectStore('plants', {
                        keyPath: 'id',
                        autoIncrement: true
                    });

                    // Create indexes for faster queries
                    plantStore.createIndex('by-seed', 'seed');
                    plantStore.createIndex('by-created', 'createdAt');
                    plantStore.createIndex('by-growth', 'lastGrowthAt');
                }
            },
        });
    }

    /**
     * Gets all plants from the database
     * @returns Array of plant data
     */
    async getAllPlants(): Promise<PlantData[]> {
        const db = await this.dbPromise;
        return db.getAll('plants');
    }

    /**
     * Gets a plant by ID
     * @param id Plant ID
     * @returns Plant data or undefined if not found
     */
    async getPlant(id: number): Promise<PlantData | undefined> {
        const db = await this.dbPromise;
        return db.get('plants', id);
    }

  /**
   * Adds a new plant to the database
   * @param plant Plant data
   * @returns ID of the added plant
   */  async addPlant(plant: PlantData): Promise<number> {
        const db = await this.dbPromise;
        const id = await db.add('plants', plant);
        return typeof id === 'number' ? id : parseInt(id.toString(), 10);
    }

    /**
     * Updates an existing plant
     * @param plant Plant data with ID
     * @returns true if successful
     */
    async updatePlant(plant: PlantData): Promise<boolean> {
        if (plant.id === undefined) {
            return false;
        }

        const db = await this.dbPromise;
        await db.put('plants', plant);
        return true;
    }

    /**
     * Deletes a plant from the database
     * @param id Plant ID
     */
    async deletePlant(id: number): Promise<void> {
        const db = await this.dbPromise;
        await db.delete('plants', id);
    }

    /**
     * Updates the last growth time for all plants
     * @param timestamp New last growth timestamp
     */
    async updateAllPlantsGrowthTime(timestamp: number): Promise<void> {
        const plants = await this.getAllPlants();
        const db = await this.dbPromise;
        const tx = db.transaction('plants', 'readwrite');

        for (const plant of plants) {
            plant.lastGrowthAt = timestamp;
            await tx.store.put(plant);
        }

        await tx.done;
    }

    /**
     * Gets the total size of the database in kilobytes
     * @returns Size in kilobytes
     */
    async getDatabaseSizeEstimate(): Promise<number> {
        // Get all plants and serialize to JSON to estimate size
        const plants = await this.getAllPlants();
        const serialized = JSON.stringify(plants);
        // Size in KB (1 character is approximately 1 byte in UTF-16)
        return serialized.length / 1024;
    }
}
