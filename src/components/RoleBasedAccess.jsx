import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

// Role hierarchy for access control
export const ROLES = {
  FIELD_AGENT: 'field_agent',
  COORDINATOR: 'coordinator',
  CEO: 'ceo',
  COO: 'coo',
  CFO: 'cfo',
  DEV_TEAM: 'dev_team'
};

// Check if user has specific role
export const hasRole = (user, role) => {
  if (!user) return false;
  return user.user_role === role || user.role === 'admin';
};

// Check if user is official (CEO, COO, CFO)
export const isOfficial = (user) => {
  if (!user) return false;
  return [ROLES.CEO, ROLES.COO, ROLES.CFO].includes(user.user_role) || user.role === 'admin';
};

// Check if user is coordinator or higher
export const isCoordinatorOrHigher = (user) => {
  if (!user) return false;
  return [ROLES.COORDINATOR, ROLES.CEO, ROLES.COO, ROLES.CFO, ROLES.DEV_TEAM].includes(user.user_role) || user.role === 'admin';
};

// Check if user is dev team or admin
export const isDevTeam = (user) => {
  if (!user) return false;
  return user.user_role === ROLES.DEV_TEAM || user.role === 'admin';
};

// Component to conditionally render based on role
export const RoleGuard = ({ user, allowedRoles, children, fallback = null }) => {
  if (!user) return fallback;
  
  const hasAccess = allowedRoles.includes(user.user_role) || user.role === 'admin';
  return hasAccess ? children : fallback;
};

// Hook to get current user with role info
export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false
  });
};