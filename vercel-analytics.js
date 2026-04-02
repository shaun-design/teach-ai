/**
 * Vercel Web Analytics for static HTML (no Next.js).
 * The Next.js component `import { Analytics } from "@vercel/analytics/next"` only works in Next apps.
 * Enable "Web Analytics" for the project in the Vercel dashboard.
 */
import { inject } from 'https://esm.sh/@vercel/analytics@2.0.1';
inject();
