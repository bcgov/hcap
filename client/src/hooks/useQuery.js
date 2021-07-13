import { useLocation } from 'react-router-dom';

// Custom Hook
export function useQuery() {
  return new URLSearchParams(useLocation().search);
}
