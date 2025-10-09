/**
 * Configuration constants for the AgriMonitor system
 */

// Server configuration
export const PORT = 3000;

// DHT22 sensor configuration
export const SENSOR_TYPE = 22; // DHT22 sensor type
export const GPIO_PIN = 2; // GPIO pin number for sensor connection

// Camera configuration
export const CAPTURE_INTERVAL = 5000;
export const LATEST_PHOTO_PATH = "public/latest.jpg";
export const CAPTURE_CONFIG = [
  "--quality",
  "80",
  "--timeout",
  "500",
  "--nopreview",
  "--width",
  "1280",
  "--height",
  "720",
  "--immediate",
] as const;
