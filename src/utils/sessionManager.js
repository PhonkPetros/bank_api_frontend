// Session management utilities
import { useEventBus } from '@/composables/useEventBus'
import router from '@/router'

const eventBus = useEventBus()

export const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const logout = () => {
  clearSession();
  // Emit logout event for components that need to update their state
  eventBus.emit('user-logged-out');
  // Redirect to login page
  router.push('/login');
};

export const getSession = () => {
  const token = localStorage.getItem('token');
  let user = null;
  try {
    const userString = localStorage.getItem('user');
    user = userString ? JSON.parse(userString) : null;
  } catch (e) {
    console.error('Error parsing user data:', e);
    clearSession();
    return { token: null, user: null };
  }
  return { token, user };
};

export const isAuthenticated = () => {
  const { token, user } = getSession();
  return !!token && !!user;
};

export const hasRole = (role) => {
  const { user } = getSession();
  return user?.role === role;
};

export const isApproved = () => {
  const { user } = getSession();
  return user?.approved === true;
};

export const validateSession = () => {
  const { token, user } = getSession();
  if (!token || !user) {
    clearSession();
    return false;
  }
  return true;
}; 