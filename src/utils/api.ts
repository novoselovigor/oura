/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Resolves the correct backend API URL based on the current app runtime environment.
 * If running under a native mobile shell (Capacitor/Android/iOS/Local Assets), 
 * it proxies requests to our live deployed server. Otherwise, it uses the local relative path.
 */
export function getApiUrl(endpoint: string): string {
  if (typeof window === 'undefined') {
    return endpoint;
  }

  const origin = window.location.origin;
  const protocol = window.location.protocol;

  // Detect local development environment
  const isLocalHost = 
    origin.includes('localhost') || 
    origin.includes('127.0.0.1') || 
    origin.includes('0.0.0.0') || 
    origin.includes('192.168.');

  // Is this running on our pre-deployed Cloud Run instance?
  const isCloudRun = origin.includes('725244677094.europe-west2.run.app');

  // Detect native wrapper contexts or static production environments like GitHub Pages
  const isCapacitor = 
    protocol.startsWith('capacitor') || 
    protocol.startsWith('file') || 
    (!isLocalHost && !isCloudRun);

  if (isCapacitor) {
    const prodServerUrl = 'https://ais-pre-dm7yxak63mnpcrfpzyd5q6-725244677094.europe-west2.run.app';
    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${prodServerUrl}${formattedEndpoint}`;
  }

  return endpoint;
}
