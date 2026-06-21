import React from 'react';
import { Check, Package, Sparkles } from 'lucide-react';

interface EscrowStepperProps {
  currentStep: 'created' | 'funded' | 'progress' | 'delivered' | 'released';
}

export const EscrowStepper: React.FC<EscrowStepperProps> = ({ currentStep }) => {
  const steps = [
    { key: 'created', label: 'Created' },
    { key: 'funded', label: 'Funded' },
    { key: 'progress', label: 'In Progress' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'released', label: 'Released' }
  ];

  const getStepLevel = (step: string) => {
    switch (step) {
      case 'created': return 1;
      case 'funded': return 2;
      case 'progress': return 3;
      case 'delivered': return 4;
      case 'released': return 5;
      default: return 1;
    }
  };

  const activeLevel = getStepLevel(currentStep);

  return (
    <section className="w-full overflow-hidden py-6 rounded-xl bg-white p-4 border border-slate-200 select-none">
      <div className="flex items-center justify-between w-full">
        {steps.map((step, index) => {
          const stepLevel = index + 1;
          const isCompleted = stepLevel < activeLevel;
          const isActive = stepLevel === activeLevel;
          
          return (
            <React.Fragment key={step.key}>
              {/* Step indicator */}
              <div className="flex flex-col items-center gap-2 flex-1">
                {isCompleted ? (
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-sm">
                    <Check className="w-4 h-4" />
                  </div>
                ) : isActive ? (
                  <div className="w-9 h-9 rounded-full border-4 border-blue-200 bg-primary text-white flex items-center justify-center relative shadow-sm">
                    {step.key === 'delivered' ? (
                      <Package className="w-4 h-4 text-white" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-white" />
                    )}
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center text-xs font-bold">
                    {stepLevel}
                  </div>
                )}
                <span
                  className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wider ${
                    isActive ? 'text-primary' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={`h-[2px] flex-grow transition-all duration-500 mx-1 md:mx-3 ${
                    stepLevel < activeLevel ? 'bg-primary' : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
};
