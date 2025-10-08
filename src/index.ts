/**
 * AgriMonitor Raspberry Pi
 * Agricultural monitoring system using sensors and camera module
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import express, { type Request, type Response } from "express";
import { read } from "node-dht-sensor";

/**
 * Execute rpicam-still command with array-based arguments
 * @param args Array of command arguments
 * @returns Promise that resolves when command completes
 */
function execRpicamStill(args: string[]): Promise<void> {
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

// DHT22 sensor configuration
const SENSOR_TYPE = 22; // DHT22 sensor type
const GPIO_PIN = 2;     // GPIO pin number for sensor connection

/**
 * Read temperature and humidity data from DHT22 sensor
 * @returns Object containing sensor data with timestamp
 */
function getSensorData() {
  const result = read(SENSOR_TYPE, GPIO_PIN);

  const now = new Date();
  const datetime = formatDate(now);
  const unixtime = Math.floor(now.getTime() / 1000);

  // Validate sensor reading results
  const isValid = typeof result.temperature === "number" && typeof result.humidity === "number";
  const temperature = isValid ? result.temperature.toFixed(1) : "[error]";
  const humidity = isValid ? result.humidity.toFixed(1) : "[error]";

  return { datetime, unixtime, temperature, humidity };
}

/**
 * Format Date object to YYYY/MM/DD HH:mm:ss string
 * @param date Date object to format
 * @returns Formatted date string
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");

  return `${year}/${month}/${day} ${hour}:${minute}:${second}`;
}

const PORT = 3000;
const app = express();

/**
 * Warm up camera module to reduce initial capture time
 * Takes a small test photo to initialize the camera hardware
 */
async function warmupCamera() {
  try {
    console.log("Warming up camera...");
    const tempFile = "/tmp/warmup.jpg";

    // Take a small test photo with minimal settings using array arguments
    const args = [
      "-o", tempFile,
      "--timeout", "100",
      "--nopreview",
      "--width", "320",
      "--height", "240"
    ];

    await execRpicamStill(args);
    fs.unlink(tempFile, () => {}); // Clean up temp file (ignore errors)
    console.log("Camera warmed up successfully");
  } catch (error) {
    console.warn("Camera warmup failed:", (error as Error).message);
  }
}

// Start Express server and initialize camera
app.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}/sensor`);
  // Pre-warm camera module to improve response time
  await warmupCamera();
});

// API endpoint to get sensor data (temperature and humidity)
app.get("/sensor", (_req: Request, res: Response) => {
  console.log(`[${formatDate(new Date())}] Access from ${_req.ip} to /sensor`);

  try {
    const data = getSensorData();
    res.json(data);
  } catch (e) {
    res.status(500).json({
      error: (e as Error).message,
    });
  }
});

// API endpoint to capture photos (standard quality)
app.get("/photo", async (_req: Request, res: Response) => {
  console.log(`[${formatDate(new Date())}] Photo request from ${_req.ip}`);

  try {
    const timestamp = Date.now();
    const filename = `photo_${timestamp}.jpg`;
    const filepath = `/tmp/${filename}`;

    // Capture photo with optimized settings for speed and quality balance
    const args = [
      "-o", filepath,
      "--quality", "85",
      "--timeout", "1000",
      "--nopreview",
      "--width", "1920",
      "--height", "1080"
    ];

    await execRpicamStill(args);

    if (!fs.existsSync(filepath)) {
      throw new Error("Photo capture failed - file not created");
    }

    // Send photo file and clean up temporary file
    res.sendFile(filepath, (err) => {
      if (err) {
        console.error("Error sending file:", err);
      }
      // Delete temporary file after sending
      fs.unlink(filepath, (unlinkErr) => {
        if (unlinkErr) {
          console.error("Error deleting temp file:", unlinkErr);
        }
      });
    });
  } catch (error) {
    console.error("Camera capture error:", error);
    res.status(500).json({
      error: "Camera capture failed",
      details: (error as Error).message,
    });
  }
});

// API endpoint for ultra-fast photo capture (lower quality/resolution)
app.get("/photo/fast", async (_req: Request, res: Response) => {
  console.log(`[${formatDate(new Date())}] Fast photo request from ${_req.ip}`);

  try {
    const timestamp = Date.now();
    const filename = `photo_fast_${timestamp}.jpg`;
    const filepath = `/tmp/${filename}`;

    // Ultra-fast capture settings: low resolution, reduced quality, minimal timeout
    const args = [
      "-o", filepath,
      "--quality", "60",
      "--timeout", "500",
      "--nopreview",
      "--width", "640",
      "--height", "480",
      "--immediate"
    ];

    await execRpicamStill(args);

    if (!fs.existsSync(filepath)) {
      throw new Error("Fast photo capture failed - file not created");
    }

    // Send photo file and clean up temporary file
    res.sendFile(filepath, (err) => {
      if (err) {
        console.error("Error sending file:", err);
      }
      // Delete temporary file after sending
      fs.unlink(filepath, (unlinkErr) => {
        if (unlinkErr) {
          console.error("Error deleting temp file:", unlinkErr);
        }
      });
    });
  } catch (error) {
    console.error("Fast camera capture error:", error);
    res.status(500).json({
      error: "Fast camera capture failed",
      details: (error as Error).message,
    });
  }
});
