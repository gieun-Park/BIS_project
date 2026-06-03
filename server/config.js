import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ENV_FILES = ['.env.local', '.env'];

const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, '');

    if (!process.env[key]) process.env[key] = value;
  });
};

ENV_FILES.forEach((fileName) => loadEnvFile(path.resolve(process.cwd(), fileName)));

export const config = {
  port: Number(process.env.PORT ?? 5174),
  cityCode: process.env.CITY_CODE ?? '38010',
  serviceKey: process.env.DATA_GO_KR_SERVICE_KEY ?? process.env.VITE_DATA_GO_KR_SERVICE_KEY ?? '',
  services: {
    arrivals: 'https://apis.data.go.kr/1613000/ArvlInfoInqireService',
    stations: 'https://apis.data.go.kr/1613000/BusSttnInfoInqireService',
    locations: 'https://apis.data.go.kr/1613000/BusLcInfoInqireService',
    routes: 'https://apis.data.go.kr/1613000/BusRouteInfoInqireService'
  }
};
