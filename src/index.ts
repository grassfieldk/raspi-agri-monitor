import { read } from 'node-dht-sensor';

const SENSOR_TYPE = 22;
const GPIO_PIN = 2;
const INTERVAL = 1000;

console.log('datetime,temperature,humidity');
setInterval(readSensor, INTERVAL);

function readSensor() {
  const result = read(SENSOR_TYPE, GPIO_PIN);

  const now = formatDate(new Date());
  const temperature = result.isValid ? result.temperature.toFixed(1) : '[error]';
  const humidity = result.isValid ? result.humidity.toFixed(1) : '[error]';

  console.log(`${now},${temperature},${humidity}`);
}

function formatDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd} ${hh}:${mi}:${ss}`;
}
