import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import WelcomeView from '../views/WelcomeView.vue'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true, requiresApproval: true, role: 'CUSTOMER' }
    },
    {
      path: '/welcome',
      name: 'welcome',
      component: WelcomeView,
      meta: { requiresAuth: false }
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView
    },
    {
      path: '/employee/dashboard',
      name: 'employee-dashboard',
      component: () => import('../views/employee/EmployeeDashboard.vue'),
      meta: { requiresAuth: true, role: 'EMPLOYEE' },
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
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue')
    }
  ]
})

// Navigation guard to check authentication and roles
router.beforeEach((to, from, next) => {
  console.log(`Navigating to: ${to.path}`, to.meta);
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  let user = null;
  try {
    user = userString ? JSON.parse(userString) : {};
  } catch (e) {
    console.error("Error parsing user from localStorage", e);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    user = {};
  }

  const isLoggedIn = !!token;
  const userRole = user && user.role ? user.role : null;
  const isUserApproved = user && user.approved;
  console.log(`User status: isLoggedIn=${isLoggedIn}, userRole=${userRole}, isUserApproved=${isUserApproved}`);

  if (to.meta.requiresAuth) {
    if (!isLoggedIn) {
      console.log('Decision: Not logged in, redirecting to /login');
      next('/login');
    } else {
      if (to.meta.role) {
        if (userRole === to.meta.role) {
          if (to.meta.role === 'CUSTOMER' && to.meta.requiresApproval && !isUserApproved) {
            console.log('Decision: Role CUSTOMER, needs approval, not approved, redirecting to /welcome');
            next('/welcome');
          } else {
            console.log('Decision: Auth ok, role match, proceeding.');
            next();
          }
        } else {
          console.log(`Decision: Role mismatch. Expected ${to.meta.role}, got ${userRole}. Redirecting to /login`);
          next('/login'); 
        }
      } else if (to.meta.requiresApproval && !isUserApproved) {
        console.log('Decision: Needs approval, not approved, redirecting to /welcome');
        next('/welcome');
      } else {
        console.log('Decision: Auth ok, no specific role/approval conflict, proceeding.');
        next();
      }
    }
  } else if (isLoggedIn && (to.path === '/login' || to.path === '/register')) {
    console.log(`Decision: Logged in, trying to access ${to.path}. Redirecting based on role.`);
    if (userRole === 'EMPLOYEE') {
      console.log('Redirecting EMPLOYEE to /employee/dashboard');
      next('/employee/dashboard');
    } else if (userRole === 'CUSTOMER') {
      const redirectTo = isUserApproved ? '/' : '/welcome';
      console.log(`Redirecting CUSTOMER to ${redirectTo}`);
      next(redirectTo);
    } else {
      console.log('Redirecting (unknown role) to /');
      next('/');
    }
  } else {
    console.log('Decision: Public route or no conflicting conditions, proceeding.');
    next();
  }
});

export default router 