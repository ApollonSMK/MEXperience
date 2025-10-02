
import { DashboardClient } from '@/components/admin/dashboard-client';

// This remains a Server Component. 
// In the future, you could fetch server-side data here and pass it to DashboardClient.
export default function AdminDashboardPage() {
  return <DashboardClient />;
}
