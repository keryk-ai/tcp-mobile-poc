import type { FormState } from '@/types/estimate';

const FORM_KEY = 'tcp-estimate-form';

export function getFormState(): FormState {
  if (typeof window === 'undefined') return emptyFormState();
  try {
    const raw = sessionStorage.getItem(FORM_KEY);
    if (!raw) return emptyFormState();
    return JSON.parse(raw) as FormState;
  } catch {
    return emptyFormState();
  }
}

export function setFormState(state: Partial<FormState>) {
  if (typeof window === 'undefined') return;
  const current = getFormState();
  sessionStorage.setItem(FORM_KEY, JSON.stringify({ ...current, ...state }));
}

export function clearFormState() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(FORM_KEY);
}

function emptyFormState(): FormState {
  return {
    workOrderId: '',
    address: '',
    timeOfDay: '',
    constructionType: '',
    pinA: null,
    pinB: null,
    distance: null,
    direction: '',
    workType: null,
    selectedLane: null,
  };
}
