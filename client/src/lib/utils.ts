import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely access an array that might be undefined.
 * Returns the array if defined, or an empty array if not.
 * 
 * @example
 * // Instead of: (cartridge.items || []).map(...)
 * safeArray(cartridge.items).map(...)
 */
export function safeArray<T>(arr: T[] | undefined | null): T[] {
  return arr ?? [];
}

/**
 * Safely access a Set that might be undefined.
 * Returns the set if defined, or a new empty Set if not.
 */
export function safeSet<T>(set: Set<T> | undefined | null): Set<T> {
  return set ?? new Set<T>();
}

/**
 * Safely access a Map that might be undefined.
 * Returns the map if defined, or a new empty Map if not.
 */
export function safeMap<K, V>(map: Map<K, V> | undefined | null): Map<K, V> {
  return map ?? new Map<K, V>();
}
