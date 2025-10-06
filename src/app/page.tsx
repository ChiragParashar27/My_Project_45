// src/app/page.tsx
import { redirect } from 'next/navigation';

/**
 * The default root page component. It simply redirects users to the login page 
 * since the EMS application requires authentication to access any content.
 */
export default function HomePage() {
  redirect('/login');
}