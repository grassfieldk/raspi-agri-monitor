/**
 * Sensor service for handling DHT22 temperature and humidity sensor
 */

import { read } from "node-dht-sensor";
import { GPIO_PIN, SENSOR_TYPE } from "../constants";
import { formatDate } from "../utils";

/**
 * Read temperature and humidity data from DHT22 sensor
 * @returns Object containing sensor data with timestamp
 */
export function getSensorData() {
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
