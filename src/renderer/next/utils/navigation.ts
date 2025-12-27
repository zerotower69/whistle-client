/**
 * Navigation utilities to bridge Electron main process and React Router
 */

// Navigation reference for Electron main process
let navigateRef: ((path: string) => void) | null = null;

// Valid route names for navigation
export const VALID_ROUTES = ['network', 'rules', 'values', 'plugins'] as const;

/**
 * Set the navigate function reference
 * Called from App.tsx to enable navigation from main process
 */
export const setNavigateRef = (navigate: (path: string) => void) => {
  navigateRef = navigate;
};

/**
 * Global function to switch pages
 * Called by Electron main process via window.showWhistleWebUI()
 */
export const initGlobalNavigation = () => {
  (window as any).showWhistleWebUI = (name: string) => {
    if (!navigateRef) {
      console.warn('Navigation reference not yet initialized');
      return;
    }

    const normalizedName = name.toLowerCase();

    // Validate the route name
    if (!VALID_ROUTES.includes(normalizedName as any)) {
      console.warn(`Invalid route name: ${name}. Valid routes are: ${VALID_ROUTES.join(', ')}`);
      return;
    }

    const path = `/${normalizedName}`;
    navigateRef(path);
  };
};
