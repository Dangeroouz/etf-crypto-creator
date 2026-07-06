import { useState } from "react";
import { useNavigate } from "react-router-dom";
import StepOne from "./create-wizard/StepOne";
import StepTwo from "./create-wizard/StepTwo";

import { useSelectedCryptos, allCrypto } from "../store/cryptoStore";
import { useIndexStore } from "../store/indexStore";
import useAuthStore from "../store/authStore";
import { tokenIcons } from "../store/cryptoIcons";

export const CreateIndex = () => {
  const [stage, setStage] = useState(1);
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { createIndex, isLoading: isCreatingIndex } = useIndexStore();
  const [createError, setCreateError] = useState<string | null>(null);

  const stagesNames = [
    "Choose Currencies",
    "Configure Index",
    "Review & Create",
  ];

  const stagesSubNames = [
    "Select the cryptocurrencies you want to include in your index (minimum 2)",
    "Assign weights, set initial investment, and name your index",
    "Review your configuration and create the index",
  ];
  
  const nextStage = async () => {
    if (stage < 3) {
      setStage(stage + 1);
    } else if (stage === 3) {
      try {
        setCreateError(null);
        if (!token) {
          setCreateError("Not authenticated");
          return;
        }

        const newIndex = await createIndex(token, {
          name,
          selected: selectedCryptos,
          weights,
          initialInvestment,
        });

        resetForm();
        
        navigate(`/my-indices/${encodeURIComponent(newIndex.id)}`);
      } catch (error: any) {
        setCreateError(error.response?.data?.error || "Failed to create index");
      }
    }
  };

  const prevStage = () => {
    if (stage > 1) {
      setStage(stage - 1);
    }
  };

  const selectedCryptos = useSelectedCryptos((s) => s.selected);
  const total = useSelectedCryptos((s) => s.total);
  const name = useSelectedCryptos((s) => s.name);
  const weights = useSelectedCryptos((s) => s.weights);
  const initialInvestment = useSelectedCryptos((s) => s.initialInvestment);
  const resetForm = useSelectedCryptos((s) => s.resetForm);

  const isNextDisabled = 
  (stage === 1 && selectedCryptos.length < 2) || 
  (stage === 2 && (total !== 100 || name.trim() === "")) ||
  isCreatingIndex;


  return (
    <div className="container max-w-6xl mx-auto">
      <div className=" bg-white p-4 rounded-xl border border-black/10 mb-4">
        <div className="sm:grid hidden grid-cols-3 grid-rows-1">
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
        <div className="sm:hidden flex justify-center items-center gap-4">
          {stagesNames[stage - 1] && (
            <div className="text-center pb-4">
              <div
                className="inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 transition bg-indigo-600 text-white"
              >
                {stage}
              </div>
              <h2>{stagesNames[stage - 1]}</h2>
            </div>
          )}
        </div>
        <div className="sm:hidden text-center flex justify-between mt-2">
          {stagesSubNames[stage - 1] && (
            <p className="text-sm  px-1 text-gray-600">{stagesSubNames[stage - 1]}</p>
          )}
        </div>
        <div className="sm:hidden flex justify-between mt-2">
          
        </div>
      </div>  
            

      <div className="bg-white p-4 rounded-xl border border-black/10">
        <div className="mb-4">
          <h2 className="font-large font-semibold">{stagesNames[stage - 1]}</h2>
          <p className="font-medium text-gray-600">
            {stagesSubNames[stage - 1]}
          </p>
        </div>

        {createError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {createError}
          </div>
        )}

        <div className="sm:p-2 p-0">
            {stage === 1 ? <StepOne /> : null}
            {stage === 2 ? <StepTwo /> : null}
            {stage === 3 ? <ReviewStep selectedCryptos={selectedCryptos} weights={weights} name={name} initialInvestment={initialInvestment} /> : null}
        </div>
        
        <div className="">
          <div className="flex py-2 justify-between">
            <button
              onClick={prevStage}
              disabled={stage === 1 || isCreatingIndex}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-200 active:bg-gray-400"
            >
              Previous
            </button>

            <button
              onClick={nextStage}
              disabled={isNextDisabled}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-blue-800 hover:bg-blue-700 active:bg-blue-800"
            >
              {isCreatingIndex ? "Creating..." : stage === 3 ? "Create Index" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Review step component for the third stage
const ReviewStep = ({ selectedCryptos, weights, name, initialInvestment }: any) => {
  return (
    <div>
      <div className="w-full sm:mb-6 mb-4">
        <div className="p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Index Name</p>
          <p className="text-lg font-semibold">{name}</p>
        </div>
      </div>

      <div className="w-full mb-6">
        <div className="p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Initial Investment</p>
          <p className="text-lg font-semibold">${initialInvestment.toFixed(2)}</p>
        </div>
      </div>

      <div className="w-full border border-gray-100 rounded-lg sm:p-4 p-2">
        <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-2">
          <h2 className="font-semibold">Selected Currencies</h2>
          <p className="bg-gray-200 p-2 py-1 text-sm rounded-lg">{selectedCryptos.length} assets</p>
        </div>
        {selectedCryptos.map((symbol: string, index: number) => (
          <div key={symbol} className="flex items-center justify-between h-full w-full gap-2 bg-white sm:px-4 px-2 py-2 mb-2 rounded-lg border border-gray-200">
            <div className="flex items-center gap-4">
              {(() => {
                const Icon = tokenIcons[symbol];
                return Icon ? (
                  <Icon
                    variant="mono"
                    size={32}
                    color="#151515ff"
                  />
                ) : null;
              })()}
              <h2 className="text-lg flex items-center gap-2">
                <p>{allCrypto.find((c) => c.symbol === symbol)?.name}</p>
                <h2 className="text-gray-500 hidden sm:block">({symbol})</h2>
              </h2>
            </div>
            <h3 className="text-md text-gray-500">
              {weights[index]}%
            </h3>
          </div>
        ))}
      </div>
    </div>
  );
};
