/// <reference types="vite/client" />

import type { AjApi } from '../preload/preload';

declare global {
  interface Window {
    aj: AjApi;
  }
}

export {};
