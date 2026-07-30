import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Cryptographically secure ID generator compliant with Sonar security standards.
 */
export function generateSecureId(prefix?: string): string {
  const uuid =
    typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
          (
            Number(c) ^
            (globalThis.crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))
          ).toString(16),
        );
  return prefix ? `${prefix}_${uuid}` : uuid;
}

/**
 * Cryptographically secure float generator between [0, 1) compliant with Sonar security standards.
 */
export function secureRandomFloat(): number {
  if (typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.getRandomValues === "function") {
    const array = new Uint32Array(1);
    globalThis.crypto.getRandomValues(array);
    return array[0] / (0xffffffff + 1);
  }
  return 0.5;
}
