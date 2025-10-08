/**
 * Camera service for handling photo capture functionality
 */

import { spawn } from "node:child_process";
import fs from "node:fs";

/**
 * Execute rpicam-still command with array-based arguments
 * @param args Array of command arguments
 * @returns Promise that resolves when command completes
 */
export function execRpicamStill(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const process = spawn("rpicam-still", args);

    process.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`rpicam-still exited with code ${code}`));
      }
    });

    process.on("error", (error) => {
      reject(error);
    });
  });
}

/**
 * Warm up camera module to reduce initial capture time
 * Takes a small test photo to initialize the camera hardware
 */
export async function warmupCamera(): Promise<void> {
  try {
    console.log("Warming up camera...");
    const tempFile = "/tmp/warmup.jpg";

    // Take a small test photo with minimal settings using array arguments
    const args = [
      "-o",
      tempFile,
      "--timeout",
      "100",
      "--nopreview",
      "--width",
      "320",
      "--height",
      "240",
    ];

    await execRpicamStill(args);
    fs.unlink(tempFile, () => {}); // Clean up temp file (ignore errors)
    console.log("Camera warmed up successfully");
  } catch (error) {
    console.warn("Camera warmup failed:", (error as Error).message);
  }
}
