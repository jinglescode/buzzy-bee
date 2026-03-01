/**
 * Generic object pool for reusing expensive-to-create objects.
 * Avoids GC pressure by recycling instances instead of allocating/deallocating.
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private active: Set<T> = new Set();
  private factory: () => T;
  private resetFn: (item: T) => void;

  constructor(factory: () => T, reset: (item: T) => void, initialSize: number) {
    this.factory = factory;
    this.resetFn = reset;

    // Pre-warm the pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.factory());
    }
  }

  /** Acquire an object from the pool, or create one if empty. */
  get(): T {
    const item = this.pool.length > 0 ? this.pool.pop()! : this.factory();
    this.active.add(item);
    return item;
  }

  /** Return an object to the pool after resetting it. */
  release(item: T): void {
    if (!this.active.has(item)) return;
    this.active.delete(item);
    this.resetFn(item);
    this.pool.push(item);
  }

  /** Number of objects currently checked out. */
  getActiveCount(): number {
    return this.active.size;
  }

  /** Release all active objects back into the pool. */
  releaseAll(): void {
    this.active.forEach((item) => {
      this.resetFn(item);
      this.pool.push(item);
    });
    this.active.clear();
  }
}
