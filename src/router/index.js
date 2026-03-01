import { createRouter, createWebHistory } from 'vue-router';
import WelcomeScreen from '../components/WelcomeScreen.vue';
import QuestionnaireForm from '../components/QuestionnaireForm.vue';
import ResultsView from '../components/ResultsView.vue';
import FavoritesSummary from '../components/FavoritesSummary.vue';

const routes = [
  {
    path: '/',
    redirect: to => {
      // Keep query parameters when redirecting to welcome
      return { path: '/welcome', query: to.query }
    }
  },
  {
    path: '/welcome',
    name: 'Welcome',
    component: WelcomeScreen
  },
  {
    path: '/questionnaire/:step',
    name: 'Questionnaire',
    component: QuestionnaireForm,
    props: true
  },
  {
    path: '/results',
    name: 'Results',
    component: ResultsView
  },
  {
    path: '/summary',
    name: 'Summary',
    component: FavoritesSummary
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
