import React from "react";
import { CheckCircle, Upload, Brain, Settings, Download } from "lucide-react";

export type BulkUploadStep = "upload" | "mapping" | "rates" | "labels";

interface BulkUploadProgressBarProps {
  currentStep: BulkUploadStep;
  completedSteps: BulkUploadStep[];
  className?: string; // Added to accommodate the sticky top positioning wrapper
}

const steps = [
  {
    id: "upload" as const,
    title: "Upload CSV",
    description: "Select and upload your CSV file",
    icon: Upload,
  },
  {
    id: "mapping" as const,
    title: "AI Mapping",
    description: "Smart header mapping with AI",
    icon: Brain,
  },
  {
    id: "rates" as const,
    title: "Select Rates",
    description: "Choose carriers and services",
    icon: Settings,
  },
  {
    id: "labels" as const,
    title: "Generate Labels",
    description: "Create and download labels",
    icon: Download,
  },
];

const BulkUploadProgressBar: React.FC<BulkUploadProgressBarProps> = ({
  currentStep,
  completedSteps,
  className = "",
}) => {
  const getStepStatus = (stepId: BulkUploadStep) => {
    if (completedSteps.includes(stepId)) return "completed";
    if (stepId === currentStep) return "current";
    return "upcoming";
  };

  return (
    // Applied sticky top wrapper from the first component
    <div className={`w-full py-4 sticky top-0 z-50 ${className}`}>
      <div className="mx-auto max-w-4xl px-0">
        {/* Applied Glassy Translucent Container Style */}
        <div className="bg-white/30 backdrop-blur-xl shadow-xl border border-white/20 p-4 transition-all duration-300 hover:bg-white/40 mx-0 rounded-3xl">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const status = getStepStatus(step.id);
              const Icon = status === "completed" ? CheckCircle : step.icon; // Use CheckCircle for completed steps

              const isCompleted = status === "completed";
              const isCurrent = status === "current";

              return (
                <div key={step.id} className="flex items-center flex-1 py-0">
                  <div className="flex flex-col items-center">
                    {/* Step Circle with glassy effect */}
                    <div
                      className={`
                      w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500 relative shadow-lg backdrop-blur-sm
                      ${
                        isCompleted
                          ? "bg-blue-600/80 border-blue-500 text-white shadow-blue-500/30"
                          : isCurrent
                            ? "bg-blue-100/60 border-blue-600 text-blue-700 ring-4 ring-blue-100/30 shadow-blue-500/20"
                            : "bg-white/50 border-gray-300/50 text-gray-400 shadow-gray-200/30"
                      }
                    `}
                    >
                      <Icon className="w-5 h-5" />
                      {/* Current Step pulse animation */}
                      {isCurrent && <div className="absolute -inset-1 rounded-full bg-blue-500/20 animate-pulse" />}
                    </div>

                    {/* Step Text with translucent background */}
                    <div className="mt-2 text-center">
                      <div
                        className={`text-xs font-bold transition-colors duration-300 px-2 py-1 rounded-lg backdrop-blur-sm
                        ${
                          isCurrent
                            ? "text-blue-700 bg-blue-100/40"
                            : isCompleted
                              ? "text-blue-600 bg-blue-50/40"
                              : "text-gray-500 bg-gray-50/40"
                        }
                      `}
                      >
                        {step.title}
                      </div>
                      <div
                        className={`text-xs mt-1 transition-colors duration-300 hidden sm:block
                        ${isCurrent ? "text-blue-600" : isCompleted ? "text-blue-500" : "text-gray-400"}
                      `}
                      >
                        {step.description}
                      </div>
                    </div>
                  </div>

                  {/* Connector Line with glassy effect */}
                  {index < steps.length - 1 && (
                    <div
                      className={`
                      flex-1 h-1 mx-4 rounded-full transition-all duration-500 backdrop-blur-sm 
                      ${isCompleted ? "bg-blue-500/60" : "bg-gray-200/40"}
                    `}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadProgressBar;
