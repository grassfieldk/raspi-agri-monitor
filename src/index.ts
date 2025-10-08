/**
 * AgriMonitor Raspberry Pi
 * Agricultural monitoring system using sensors and camera module
 */

import fs from "node:fs";
import express, { type Request, type Response } from "express";
import { PORT } from "./constants";
import { execRpicamStill, warmupCamera } from "./services/camera";
import { getSensorData } from "./services/sensor";
import { formatDate } from "./utils";

const app = express();

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
      "-o",
      filepath,
      "--quality",
      "85",
      "--timeout",
      "1000",
      "--nopreview",
      "--width",
      "1920",
      "--height",
      "1080",
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
      "-o",
      filepath,
      "--quality",
      "60",
      "--timeout",
      "500",
      "--nopreview",
      "--width",
      "640",
      "--height",
      "480",
      "--immediate",
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
