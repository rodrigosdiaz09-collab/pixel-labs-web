/**
 * Variables que existen en la página pero que no se declaran en script.js.
 * Este archivo NO se publica ni afecta al sitio: solo sirve para que el
 * editor sepa qué son y deje de marcarlas en rojo.
 */

interface Window {
  /** Cola de eventos de Google Tag Manager (la crea el snippet del <head>). */
  dataLayer?: Array<Record<string, unknown>>;

  /** Google Analytics 4, solo si algún día se instala sin pasar por GTM. */
  gtag?: (...args: unknown[]) => void;

  /** Píxel de Meta, si se carga por fuera de GTM. */
  fbq?: (...args: unknown[]) => void;

  /**
   * Nombres de las piezas del probador, en el mismo orden que las miniaturas.
   * Lo arma script.js al iniciar el probador; el visor ampliado lo usa con
   * indexOf() para saber si la pieza que estás mirando se puede probar.
   */
  PROBADOR_NOMBRES?: string[];
}

/** Lo que le llega al worker desde Cloudflare (base de datos, archivos, clave). */
interface Env {
  DB: D1Database;
  ASSETS: { fetch(request: Request): Promise<Response> };
  PANEL_CLAVE?: string;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<unknown>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
}
