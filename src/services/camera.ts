/**
 * Camera service for handling photo capture functionality
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import { CAPTURE_CONFIG } from "../constants";

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

/**
 * Capture a photo and save to the specified path
 * @param outputPath Path where the photo should be saved
 * @returns Promise that resolves when photo is captured
 */
export async function capturePhotoToFile(outputPath: string): Promise<void> {
  const dir = require("node:path").dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const args = ["-o", outputPath, ...CAPTURE_CONFIG];

  await execRpicamStill(args);

  if (!fs.existsSync(outputPath)) {
    throw new Error("Photo capture failed - file not created");
  }
}

/**
 * Start periodic photo capture to save recent photos
 * @param interval Interval between captures in seconds
 * @param outputPath Path where photos should be saved
 */
export function startPeriodicCapture(interval: number, outputPath: string): NodeJS.Timeout {
  console.log(`Starting periodic photo capture every ${interval}ms to ${outputPath}`);

  // Capture immediately on start
  capturePhotoToFile(outputPath).catch((error) => {
    console.error("Initial photo capture failed:", error);
  });

  // Set up periodic capture
  return setInterval(async () => {
    try {
      await capturePhotoToFile(outputPath);
      console.log(`[${new Date().toISOString()}] Periodic photo captured successfully`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Periodic photo capture failed:`, error);
    }
  }, interval);
}
