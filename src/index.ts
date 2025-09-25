import express, { type Request, type Response } from "express";
import { read } from "node-dht-sensor";

const SENSOR_TYPE = 22;
const GPIO_PIN = 2;

function getSensorData() {
  const result = read(SENSOR_TYPE, GPIO_PIN);

  const now = new Date();
  const datetime = formatDate(now);
  const unixtime = Math.floor(now.getTime() / 1000);
  const temperature = result.isValid ? result.temperature.toFixed(1) : "[error]";
  const humidity = result.isValid ? result.humidity.toFixed(1) : "[error]";

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
