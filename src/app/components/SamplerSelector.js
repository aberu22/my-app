"use client";

import { useEffect, useState } from "react";
import { useImageGeneration } from "../../context/ImageGenrationContext"; // Import context
import { fetchSamplers } from "../utils/api"; // Import API function

const SamplerSelector = () => {
  const { selectedSampler, setSelectedSampler } = useImageGeneration(); // ✅ Get from context
  const [samplers, setSamplers] = useState([]);

  useEffect(() => {
    const loadSamplers = async () => {
      try {
        const fetchedSamplers = await fetchSamplers();
        if (!Array.isArray(fetchedSamplers)) return; // Ensure valid array
        setSamplers(fetchedSamplers);

        // ✅ Ensure default selection when data is loaded
        if (fetchedSamplers.length > 0 && !selectedSampler) {
          setSelectedSampler(fetchedSamplers[0].name);
        }
      } catch (error) {
        console.error("Error fetching samplers:", error);
      }
    };

    loadSamplers();
  }, [setSelectedSampler, selectedSampler]); // ✅ Ensure re-run if needed

  return (
    <div className="glassmorphism bg-gray-900 p-4 rounded-lg mt-5">
      <h3 className="text-sm text-purple-400 mb-2">Select Sampler</h3>
      <select
        value={selectedSampler || ""}
        onChange={(e) => setSelectedSampler(e.target.value)}
        className="w-full bg-gray-900 p-2 rounded-lg text-white border border-red-100"
      >
        {samplers.length === 0 ? (
          <option disabled>Loading samplers...</option>
        ) : (
          samplers.map((sampler) => (
            <option key={sampler.name} value={sampler.name}>
              {sampler.name}
            </option>
          ))
        )}
      </select>
    </div>
  );
};

export default SamplerSelector;
