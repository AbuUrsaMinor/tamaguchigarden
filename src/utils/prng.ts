/**
 * Mulberry32 PRNG implementation
 * A fast 32-bit PRNG with good statistical properties
 */
export class Mulberry32 {
  private state: number;

  /**
   * Creates a new Mulberry32 PRNG instance
   * @param seed A 32-bit seed value
   */
  constructor(seed: number) {
    // Convert seed to a 32-bit unsigned integer
    this.state = seed >>> 0;
  }

  /**
   * Generates the next random number in the sequence
   * @returns A number between 0 and 1
   */
  next(): number {
    // Algorithm from https://gist.github.com/tommyettinger/46a874533244883189143505d203312c
    let z = (this.state += 0x6D2B79F5);
    z = (z ^ (z >>> 15)) * (z | 1);
    z ^= z + (z ^ (z >>> 7)) * (z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a random integer between min (inclusive) and max (inclusive)
   * @param min Minimum value (inclusive)
   * @param max Maximum value (inclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Returns a random float between min (inclusive) and max (exclusive)
   * @param min Minimum value (inclusive)
   * @param max Maximum value (exclusive)
   */
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
}
