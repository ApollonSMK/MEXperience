
import { redirect } from 'next/navigation';

export default function AdminRootPage() {
  // Redirect to the main dashboard of the admin panel
  redirect('/admin/dashboard');
}
