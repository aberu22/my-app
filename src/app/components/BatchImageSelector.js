import { useState } from "react";

const BatchImageSelector = ({ onSelect }) => {
  const [selectedBatch, setSelectedBatch] = useState(1);

  // List of batch options
  const batchOptions = [1, 2, 3, 4];

  const handleSelect = (batch) => {
    setSelectedBatch(batch);
    onSelect(batch); // ✅ Pass selected value to parent component
  };

  return (
    <div className="flex flex-col items-center">
      <label className="text-white text-sm font-semibold mb-2 flex items-center gap-1">
        Number of Images <span className="text-gray-400 text-xs">❓</span>
      </label>
      <div className="flex gap-2">
        {batchOptions.map((batch) => (
          <button
            key={batch}
            onClick={() => handleSelect(batch)}
            className={`px-4 py-2 rounded-lg border border-gray-500 transition-all duration-200 ${
              selectedBatch === batch
                ? "bg-purple-500 text-white border-purple-500"
                : "bg-transparent text-gray-300 hover:bg-gray-700"
            }`}
          >
            {batch}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BatchImageSelector;
