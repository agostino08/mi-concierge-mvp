import { createRouter, createWebHistory } from 'vue-router';
import LandingView from '../views/LandingView.vue';
import WelcomeView from '../views/WelcomeView.vue';
import QuestionnaireView from '../views/QuestionnaireView.vue';
import ResultsView from '../views/ResultsView.vue';
import SummaryView from '../views/SummaryView.vue';
import AdminView from '../views/AdminView.vue';
import OnboardingView from '../views/OnboardingView.vue';
import PrivacyView from '../views/PrivacyView.vue';
import { useHotelStore } from '../stores/useHotelStore';

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: LandingView,
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
  {
    path: '/onboard',
    name: 'Onboard',
    component: OnboardingView,
  },
  {
    path: '/privacy',
    name: 'Privacy',
    component: PrivacyView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  // If landing page is accessed with a hotel param, redirect to /welcome to start the guest flow
  if (to.name === 'Landing' && to.query.hotel) {
    return { name: 'Welcome', query: to.query };
  }
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
