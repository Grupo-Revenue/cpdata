
import { useState } from 'react';

type Step = 'selection' | 'editing';

export const useQuoteFormState = (initialStep: Step = 'selection') => {
  const [step, setStep] = useState<Step>(initialStep);

  const proceedToEdit = () => {
    setStep('editing');
  };

  const backToSelection = () => {
    setStep('selection');
  };

  return {
    step,
    setStep,
    proceedToEdit,
    backToSelection
  };
};
