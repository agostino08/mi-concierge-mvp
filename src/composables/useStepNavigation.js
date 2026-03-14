import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

/**
 * Shared navigation logic for questionnaire step components.
 */
export function useStepNavigation() {
  const route = useRoute();
  const router = useRouter();

  const step = computed(() => parseInt(route.params.step) || 1);

  function next() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    router.push(`/questionnaire/${step.value + 1}`);
  }

  function prev() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (step.value === 1) router.push('/welcome');
    else router.push(`/questionnaire/${step.value - 1}`);
  }

  return { step, next, prev };
}
