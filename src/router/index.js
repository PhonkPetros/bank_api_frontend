import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated, hasRole, isApproved, clearSession } from '@/utils/sessionManager'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import WelcomeView from '../views/WelcomeView.vue'
import Atm from '@/views/customer/Atm.vue'
import Transfer from '@/views/customer/Transfer.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/welcome',
      name: 'welcome',
      component: WelcomeView,
      meta: { requiresAuth: false }
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: false }
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { requiresAuth: false }
    },
    {
      path: '/employee/dashboard',
      redirect: '/employee/customer-management'
    },
    {
      path: '/employee/customer-management',
      name: 'employee-customer-management',
      component: () => import('../views/employee/CustomerManagement.vue'),
      meta: { requiresAuth: true, role: 'EMPLOYEE' }
    },
    {
      path: '/employee/approval-queue',
      name: 'employee-approval-queue',
      component: () => import('../views/employee/ApprovalQueue.vue'),
      meta: { requiresAuth: true, role: 'EMPLOYEE' }
    },
    {
      path: '/employee/transfer',
      name: 'employee-transfer',
      component: () => import('../views/employee/EmployeeTransfer.vue'),
      meta: { requiresAuth: true, role: 'EMPLOYEE' }
    },
    {
      path: '/employee/account-settings',
      name: 'employee-account-settings',
      component: () => import('../views/employee/AccountSettings.vue'),
      meta: { requiresAuth: true, role: 'EMPLOYEE' }
    },
    {
      path: '/employee/all-transfers',
      name: 'employee-all-transfers',
      component: () => import('../views/employee/AllTransfers.vue'),
      meta: { requiresAuth: true, role: 'EMPLOYEE' }
    },
    {
      path: '/customer/atm',
      name: 'CustomerAtm',
      component: Atm,
      meta: { requiresAuth: true, role: 'CUSTOMER', requiresApproval: true }
    },
    {
      path: '/customer/transfer',
      component: Transfer
    },
    {
      path: '/',
      redirect: (to) => {
        const userString = localStorage.getItem('user');
        let user = null;
        try {
          user = userString ? JSON.parse(userString) : {};
        } catch (e) {
          user = {};
        }
        if (user && user.role === 'EMPLOYEE') {
          return '/employee/customer-management';
        } else if (user && user.role === 'CUSTOMER') {
          return '/customer/atm';
        } else {
          return '/login';
        }
      }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue')
    }
  ]
})

// Navigation guard to check authentication and roles
router.beforeEach(async (to, from, next) => {
  console.log(`Navigating to: ${to.path}`, to.meta);
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/welcome'];
  if (publicRoutes.includes(to.path)) {
    // If user is already logged in, redirect based on role and approval status
    if (isAuthenticated()) {
      if (hasRole('EMPLOYEE')) {
        return next('/employee/customer-management');
      } else if (hasRole('CUSTOMER')) {
        return next(isApproved() ? '/customer/atm' : '/welcome');
      }
    }
    return next();
  }

  // Check authentication for protected routes
  if (to.meta.requiresAuth) {
    if (!isAuthenticated()) {
      console.log('Not authenticated, redirecting to login');
      clearSession();
      return next('/login');
    }

    // Check role requirements
    if (to.meta.role && !hasRole(to.meta.role)) {
      console.log(`Role mismatch. Required: ${to.meta.role}`);
      return next('/login');
    }

    // For customers, check approval status
    if (hasRole('CUSTOMER') && !isApproved()) {
      console.log('Customer account not approved');
      // Only allow access to welcome page
      if (to.path !== '/welcome') {
        return next('/welcome');
      }
    }
  }

  // Handle root path redirect
  if (to.path === '/') {
    if (!isAuthenticated()) {
      return next('/login');
    }
    if (hasRole('EMPLOYEE')) {
      return next('/employee/customer-management');
    } else if (hasRole('CUSTOMER')) {
      return next(isApproved() ? '/customer/atm' : '/welcome');
    }
  }

  next();
});

export default router 