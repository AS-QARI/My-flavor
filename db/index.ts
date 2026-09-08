import { env } from 'cloudflare:workers';
export function database() {
  if (!env.DB) throw new Error('Database unavailable');
  return env.DB;
}
export function files() {
  if (!env.FILES) throw new Error('Files unavailable');
  return env.FILES;
}
