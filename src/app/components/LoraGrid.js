"use client";

import { useState } from "react";
import Image from "next/image";
import { useImageGeneration } from "../../context/ImageGenrationContext";
import { FaSpinner, FaTimes } from "react-icons/fa";

const LoraGrid = ({ loras = [], onClose }) => {
  const {
    setPrompt,
    setSelectedLora,
    handleLoraSelect,
    membershipStatus,
  } = useImageGeneration();

  const [searchQuery, setSearchQuery] = useState("");
  const [loadingSelection, setLoadingSelection] = useState(null);
  const [imgErrorMap, setImgErrorMap] = useState({});

  const visibleLoras = searchQuery
    ? loras.filter((lora) =>
        lora.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : loras;

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-100 backdrop-blur-md z-[1000]">
      <div className="bg-black-900 p-6 rounded-lg shadow-xl w-[975px] h-[1100px] relative z-[1100]">
        <button
          onClick={onClose || (() => setSelectedLora(null))}
          className="absolute top-4 right-4 bg-gray-800 hover:bg-red-500 text-white p-3 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-110"
          aria-label="Close"
        >
          <FaTimes className="w-5 h-5" />
        </button>

        <h2 className="text-white text-lg font-bold mb-4">
          {visibleLoras.length} LoRAs Available
        </h2>

        <input
          type="text"
          placeholder="Search LoRAs..."
          className="w-full p-2 rounded-lg bg-gray-800 text-white outline-none mb-4"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="overflow-auto max-h-[90vh] px-6 py-4 bg-black">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 w-full">
            {visibleLoras.length === 0 ? (
              <p className="text-center text-sm text-zinc-400 mt-6 col-span-full">
                No LoRAs found.
              </p>
            ) : (
              visibleLoras.map((lora, index) => {
                const loraName = lora.name || "Unknown LoRA";
                const activationText = lora.activation_text || "";
                const thumbnail = imgErrorMap[loraName]
                  ? "/loras/default-thumbnail.png"
                  : lora.thumbnail || "/loras/default-thumbnail.png";

                const isNSFW = lora.isNSFW;

                const handleSelect = () => {
                  if (isNSFW && membershipStatus === "free") {
                    alert("⚠️ NSFW LoRAs require a PRO membership.");
                    return;
                  }

                  handleLoraSelect(loraName, activationText, thumbnail);
                  setSelectedLora({ name: loraName, activationText, thumbnail });
                  setPrompt((prev) => `${prev} ${activationText}`.trim());
                  if (onClose) onClose();
                };

                return (
                  <div
                    key={index}
                    className="relative bg-gray-900 hover:bg-gray-800 transition p-3 rounded-xl shadow-lg cursor-pointer flex flex-col items-center border border-gray-700 hover:border-blue-500"
                    onClick={handleSelect}
                  >
                    <div className="absolute top-2 left-2 bg-gradient-to-r from-blue-600 to-purple-600 text-xs text-white px-2 py-1 rounded-full shadow-md">
                      LoRA
                    </div>

                    

                    {loadingSelection === loraName ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <FaSpinner className="w-10 h-10 text-yellow-500 animate-spin" />
                        <span className="text-white text-sm mt-2">Loading...</span>
                      </div>
                    ) : (
                      <>
                        <Image
                          src={thumbnail}
                          alt={loraName}
                          width={300}
                          height={280}
                          className="rounded-lg h-auto object-cover shadow-md"
                          onError={() =>
                            setImgErrorMap((prev) => ({
                              ...prev,
                              [loraName]: true,
                            }))
                          }
                        />

                        <p className="text-white text-sm font-medium mt-2 text-center break-words w-full">
                          {loraName}
                        </p>

                        <button
                          className="bg-yellow-500 text-black px-4 py-2 rounded-lg mt-3 font-bold transition hover:bg-blue-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLoadingSelection(loraName);
                            setTimeout(() => {
                              handleSelect();
                              setLoadingSelection(null);
                            }, 1500);
                          }}
                        >
                          Add
                        </button>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoraGrid;
