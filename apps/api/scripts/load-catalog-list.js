/**
 * Load test: listagem paginada do catálogo.
 *
 * Pré-requisitos:
 * - API rodando (ex.: npm run start:dev em apps/api)
 * - k6 instalado: https://k6.io/docs/get-started/installation/
 * - seed opcional: npm run prisma:seed
 *
 * Uso:
 *   k6 run scripts/load-catalog-list.js
 *   BASE_URL=https://api.example.com k6 run scripts/load-catalog-list.js
 *   npm run load:catalog
 */
import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  vus: Number(__ENV.VUS || 10),
  duration: __ENV.DURATION || "30s",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"],
  },
};

const scenarios = [
  "/catalog/products?page=1&limit=12",
  "/catalog/products?page=2&limit=12",
  "/catalog/products?page=1&limit=12&category=Camisetas",
  "/catalog/products?page=1&limit=12&size=M",
  "/catalog/products?page=1&limit=12&priceMax=200",
  "/catalog/products?page=1&limit=12&category=Camisetas&size=M&priceMin=100&priceMax=300",
];

export default function () {
  const path = scenarios[Math.floor(Math.random() * scenarios.length)];
  const res = http.get(`${BASE_URL}${path}`);

  check(res, {
    "status is 200": (r) => r.status === 200,
    "has data array": (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.data) && body.meta != null;
      } catch {
        return false;
      }
    },
  });

  sleep(0.3);
}
