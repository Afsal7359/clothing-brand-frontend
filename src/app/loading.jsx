import { GenericSkeleton } from '@/components/Skeletons';

// Catch-all skeleton: shown on any route transition that doesn't define
// its own loading.jsx (home, cart, account, etc.).
export default function Loading() {
  return <GenericSkeleton />;
}
