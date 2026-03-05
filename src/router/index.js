import { createRouter, createWebHistory } from 'vue-router';
import WelcomeView from '../views/WelcomeView.vue';
import QuestionnaireView from '../views/QuestionnaireView.vue';
import ResultsView from '../views/ResultsView.vue';
import SummaryView from '../views/SummaryView.vue';
import AdminView from '../views/AdminView.vue';
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
  {
    path: '/admin',
    name: 'Admin',
    component: AdminView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  if (!to.meta.requiresHotel) return true;
  const hotelStore = useHotelStore();
  if (!hotelStore.hotelData) {
    return { name: 'Welcome', query: to.query };
  }
  return true;
});

export default router;
