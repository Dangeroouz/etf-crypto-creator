import { useState } from "react";
import StepOne from "./create-wizard/StepOne";
import StepTwo from "./create-wizard/StepTwo";
import StepThree from "./create-wizard/StepThree";
import StepFour from "./create-wizard/StepFour";
import { useSelectedCryptos } from "../store/cryptoStore";
export const CreateIndex = () => {
  const [stage, setStage] = useState(1);
  const stagesNames = [
    "Choose Cryptocurrencies",
    "Assign Weights",
    "Backtest Settings",
    "Summary",
  ];

  const stagesSubNames = [
    "Select the cryptocurrencies you want to include in your index (minimum 2)",
    "Assign weight percentages to each selected cryptocurrency",
    "Configure backtest parameters and rebalancing strategy",
    "Review your index configuration before creating",
  ];
  const nextStage = () => {
    if (stage < 4) {
      setStage(stage + 1);
    }
  };
  const prevStage = () => {
    if (stage > 1) {
      setStage(stage - 1);
    }
  };
  const selectedCryptos = useSelectedCryptos((s) => s.selected);
  const total = useSelectedCryptos((s) => s.total);
  const isNextDisabled = 
  (stage === 1 && selectedCryptos.length <2) || 
  stage === 2 && total !== 100 ||
  stage === 4;
  return (
    <div className="container max-w-6xl mx-auto">
      <div className=" bg-white p-4 rounded-xl border border-black/10 mb-4">
        <div className="grid grid-cols-4 grid-rows-1">
          {stagesNames.map((name, index) => (
            <div
              key={index}
              className={` text-center pb-4 ${
                stage > index + 1
                  ? "border-b-4 border-gray-900 "
                  : stage === index + 1
                  ? "border-b-4 border-gray-400 "
                  : "border-b-4 border-gray-200 "
              }`}
            >
              <div
                className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 transition ${
                  stage > index + 1
                    ? "bg-green-500 text-white"
                    : stage === index + 1
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {index + 1}
              </div>

              <h2>{name}</h2>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-black/10">
        <div className="mb-4">
          <h2 className="font-large font-semibold">{stagesNames[stage - 1]}</h2>
          <p className="font-medium text-gray-600">
            {stagesSubNames[stage - 1]}
          </p>
        </div>
        <div className="p-4">
            {stage === 1 ? <StepOne /> : null}
            {stage === 2 ? <StepTwo /> : null}
            {stage === 3 ? <StepThree /> : null}
            {stage === 4 ? <StepFour /> : null}
        </div>
        
        <div className="">
          <div className="flex justify-between">
            <button
              onClick={prevStage}
              disabled={stage === 1}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-200 active:bg-gray-400"
            >
              Previous
            </button>

            <button
              onClick={nextStage}
              disabled={isNextDisabled}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-blue-800 hover:bg-blue-700 active:bg-blue-800"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
