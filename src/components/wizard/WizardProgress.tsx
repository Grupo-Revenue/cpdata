import React from 'react';
import { CheckCircle } from 'lucide-react';

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
}

const stepLabels = [
  'Información de Contacto',
  'Información de Empresa',
  'Información del Evento'
];

export const WizardProgress: React.FC<WizardProgressProps> = ({
  currentStep,
  totalSteps
}) => {
  return (
    <div className="mb-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Crear Nuevo Negocio</h2>
      <div className="flex items-center space-x-4">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          return (
            <div key={stepNumber} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                stepNumber === currentStep ? 'bg-blue-600 text-white' :
                stepNumber < currentStep ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {stepNumber < currentStep ? <CheckCircle className="w-4 h-4" /> : stepNumber}
              </div>
              {stepNumber < totalSteps && <div className="w-16 h-0.5 bg-gray-300 mx-2" />}
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-sm text-gray-600">
        Paso {currentStep} de {totalSteps}: {stepLabels[currentStep - 1]}
      </div>
    </div>
  );
};