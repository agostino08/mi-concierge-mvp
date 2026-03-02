import { createRouter, createWebHistory } from 'vue-router';
import WelcomeView from '../views/WelcomeView.vue';
import QuestionnaireView from '../views/QuestionnaireView.vue';
import ResultsView from '../views/ResultsView.vue';
import SummaryView from '../views/SummaryView.vue';
import { useHotelStore } from '../stores/useHotelStore';

const routes = [
  {
    path: '/',
    redirect: (to) => ({ path: '/welcome', query: to.query }),
  },
  {
    path: '/welcome',
    name: 'Welcome',
    component: WelcomeView,
  },
  {
    path: '/questionnaire/:step',
    name: 'Questionnaire',
    component: QuestionnaireView,
    props: true,
    meta: { requiresHotel: true },
  },
  {
    path: '/results',
    name: 'Results',
    component: ResultsView,
    meta: { requiresHotel: true },
  },
  {
    path: '/summary',
    name: 'Summary',
    component: SummaryView,
    meta: { requiresHotel: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Guard: redirect to /welcome if a protected route is accessed without hotel data loaded.
// This prevents blank/broken views when users bookmark or share deep links directly.
router.beforeEach((to) => {
  if (!to.meta.requiresHotel) return true;
  const hotelStore = useHotelStore();
  if (!hotelStore.hotelData) {
    return { name: 'Welcome', query: to.query };
  }
  return true;
});

export default router;
