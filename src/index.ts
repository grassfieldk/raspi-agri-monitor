/**
 * AgriMonitor Raspberry Pi
 * Agricultural monitoring system using sensors and camera module
 */

import fs from "node:fs";
import express, { type Request, type Response } from "express";
import jsonServer from "json-server";
import { CAPTURE_CONFIG, CAPTURE_INTERVAL, PORT, LATEST_PHOTO_PATH } from "./constants";
import { execRpicamStill, startPeriodicCapture, warmupCamera } from "./services/camera";
import { getSensorData } from "./services/sensor";
import { formatDate } from "./utils";

const app = express();
const jsonRouter = jsonServer.router("json/db.json");

// Serve static files from public directory
app.use("/public", express.static("public"));

// Provide CRUD API for JSON Server
app.use("/data", jsonRouter);

// Start Express server and initialize camera
app.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Sensor API:        /sensor`);
  console.log(`Photo API:         /photo`);
  console.log(`JSON CRUD API:     /data`);

  // Pre-warm camera module to improve response time
  await warmupCamera();

  // Start periodic photo capture
  startPeriodicCapture(CAPTURE_INTERVAL, LATEST_PHOTO_PATH);
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

// API endpoint to capture photos (fast capture)
app.get("/photo", async (_req: Request, res: Response) => {
  console.log(`[${formatDate(new Date())}] Photo request from ${_req.ip}`);

  try {
    const timestamp = Date.now();
    const filename = `photo_${timestamp}.jpg`;
    const filepath = `/tmp/${filename}`;

    const args = ["-o", filepath, ...CAPTURE_CONFIG];

    await execRpicamStill(args);

    if (!fs.existsSync(filepath)) {
      throw new Error("Photo capture failed - file not created");
    }

    // Send photo file and clean up the temporary file
    res.sendFile(filepath, (err) => {
      if (err) {
        console.error("Error sending file:", err);
      }
      // Delete the temporary file after sending
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
