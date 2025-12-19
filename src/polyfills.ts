// Polyfills for production deployment
// This ensures Web APIs are available in environments that don't have them

// Load whatwg-fetch synchronously to prevent timing issues with React hooks
import 'whatwg-fetch';

console.log('🔧 Initializing polyfills...');

// Critical: Ensure React is available before loading any polyfills that might interfere
if (typeof window !== 'undefined' && (window as any).React) {
  console.log('✅ React is already available');
}

// Verify critical APIs are available immediately
if (typeof globalThis.Request === 'undefined' ||
    typeof globalThis.Response === 'undefined' ||
    typeof globalThis.Headers === 'undefined') {
  console.warn('⚠️ Critical fetch APIs not immediately available, may load asynchronously');
  // Check again after a short delay
  setTimeout(() => {
    if (typeof globalThis.Request === 'undefined' ||
        typeof globalThis.Response === 'undefined' ||
        typeof globalThis.Headers === 'undefined') {
      console.error('❌ Critical fetch APIs still not available after delay');
    } else {
      console.log('✅ Critical fetch APIs available after delay:', {
        Request: typeof globalThis.Request,
        Response: typeof globalThis.Response,
        Headers: typeof globalThis.Headers
      });
    }
  }, 100);
} else {
  console.log('✅ Critical fetch APIs available immediately:', {
    Request: typeof globalThis.Request,
    Response: typeof globalThis.Response,
    Headers: typeof globalThis.Headers
  });
}

// Polyfill global objects if they don't exist
if (typeof globalThis !== 'undefined') {
  // Ensure globalThis is available
  if (typeof global === 'undefined') {
    (globalThis as any).global = globalThis;
  }

  // Ensure fetch is available immediately
  if (typeof globalThis.fetch === 'undefined') {
    console.warn('⚠️ fetch not available yet, will be polyfilled by whatwg-fetch');
  }

  // Polyfill AbortController if missing
  if (typeof globalThis.AbortController === 'undefined') {
    try {
      // Use a simple polyfill or native implementation
      const AbortControllerPolyfill = class AbortController {
        signal = { aborted: false };
        abort() {
          this.signal.aborted = true;
        }
      };
      globalThis.AbortController = AbortControllerPolyfill as any;
      globalThis.AbortSignal = { prototype: { aborted: false } } as any;
      console.log('✅ AbortController polyfilled');
    } catch (e) {
      console.warn('Failed to polyfill AbortController');
    }
  }

  // Polyfill crypto if missing (for Supabase)
  if (typeof globalThis.crypto === 'undefined') {
    try {
      // Use Node.js crypto module if available
      const nodeCrypto = require('crypto');
      globalThis.crypto = {
        getRandomValues: (array: Uint8Array) => {
          const buffer = nodeCrypto.randomBytes(array.length);
          array.set(new Uint8Array(buffer));
          return array;
        },
        subtle: nodeCrypto.webcrypto?.subtle
      } as any;
      console.log('✅ Crypto polyfilled');
    } catch (e) {
      console.warn('Failed to polyfill crypto');
    }
  }

  // Polyfill btoa/atob if missing
  if (typeof globalThis.btoa === 'undefined') {
    globalThis.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
  }
  if (typeof globalThis.atob === 'undefined') {
    globalThis.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
  }
}

// Ensure process.env is available
if (typeof process === 'undefined') {
  (globalThis as any).process = { env: {} };
}

// Ensure Buffer is available (for compatibility)
if (typeof Buffer === 'undefined') {
  try {
    (globalThis as any).Buffer = require('buffer').Buffer;
  } catch (e) {
    console.warn('Buffer not available');
  }
}

console.log('🔧 Polyfill initialization complete');
