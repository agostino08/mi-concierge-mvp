import { createRouter, createWebHistory } from 'vue-router';
import WelcomeView from '../views/WelcomeView.vue';
import QuestionnaireView from '../views/QuestionnaireView.vue';
import ResultsView from '../views/ResultsView.vue';
import SummaryView from '../views/SummaryView.vue';
import AdminView from '../views/AdminView.vue';
import OnboardingView from '../views/OnboardingView.vue';
import { useHotelStore } from '../stores/useHotelStore';

const routes = [
  {
    path: '/',
    name: 'Welcome',
    alias: '/welcome',
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
  {
    path: '/onboard',
    name: 'Onboard',
    component: OnboardingView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  if (!to.meta.requiresHotel) return true;
  const hotelStore = useHotelStore();
  if (hotelStore.hotelData) return true;
  // Allow if we have a saved hotel session — init() will restore hotel data on mount
  const savedHotel = localStorage.getItem('mc_hotel');
  if (savedHotel) return true;
  // No hotel context — redirect to welcome, preserving query params
  return { name: 'Welcome', query: to.query };
});

export default router;
