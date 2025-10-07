import { exec } from "node:child_process";
import fs from "node:fs";
import { promisify } from "node:util";
import express, { type Request, type Response } from "express";
import { read } from "node-dht-sensor";

const execAsync = promisify(exec);

const SENSOR_TYPE = 22;
const GPIO_PIN = 2;

function getSensorData() {
  const result = read(SENSOR_TYPE, GPIO_PIN);

  const now = new Date();
  const datetime = formatDate(now);
  const unixtime = Math.floor(now.getTime() / 1000);
  const isValid = typeof result.temperature === "number" && typeof result.humidity === "number";
  const temperature = isValid ? result.temperature.toFixed(1) : "[error]";
  const humidity = isValid ? result.humidity.toFixed(1) : "[error]";

  return { datetime, unixtime, temperature, humidity };
}

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

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/sensor`);
});

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

app.get("/photo", async (_req: Request, res: Response) => {
  console.log(`[${formatDate(new Date())}] Photo request from ${_req.ip}`);

  try {
    const timestamp = Date.now();
    const filename = `photo_${timestamp}.jpg`;
    const filepath = `/tmp/${filename}`;

    await execAsync(`rpicam-still -o ${filepath} --quality 100 --timeout 2000`);

    if (!fs.existsSync(filepath)) {
      throw new Error("Photo capture failed - file not created");
    }

    res.sendFile(filepath, (err) => {
      if (err) {
        console.error("Error sending file:", err);
      }
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
