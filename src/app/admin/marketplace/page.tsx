import { redirect } from 'next/navigation';

export default function MarketplacePage() {
  // Redirect to orders for now as it serves the same purpose for admin
  redirect('/admin/orders');
}
