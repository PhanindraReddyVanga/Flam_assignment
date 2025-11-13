import { generateInitialDataset } from '@/lib/dataGenerator';
import DashboardClient from './dashboard-client';

export const metadata = {
  title: 'Performance Dashboard',
  description: 'High-performance real-time data visualization dashboard',
};

async function getDashboardData() {
  // Generate initial 10k data points on the server
  const initialData = generateInitialDataset(10000);
  return initialData;
}

export default async function DashboardPage() {
  const initialData = await getDashboardData();

  return <DashboardClient initialData={initialData} />;
}
