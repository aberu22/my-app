"use client";

import { useEffect, useState } from "react";
import { useImageGeneration } from "../../context/ImageGenrationContext";
import ImageGenerationPanel from "../components/ImageGenerationPanel";
import UpgradeButton from "../components/UpgradeButton";
import UpgradePopup from "../components/UpgradePopup";
import { useAgeGate } from "../hooks/useAgeGate";
import AgeGateModal from "../components/AgeGateModal";

export default function CreatePage() {
  const { credits } = useImageGeneration();
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const { checked, verified, confirm } = useAgeGate();

  useEffect(() => {
    if (credits !== null && credits <= 0) {
      setShowUpgradePopup(true);
    }
  }, [credits]);

  if (!checked) return null;
  if (!verified) return <AgeGateModal onConfirm={confirm} />;

  return (
    <main
      className="p-6 overflow-auto"
      role="main"
      aria-label="Image creation workspace"
    >
      <ImageGenerationPanel mode="image" />

      
      {showUpgradePopup && (
        <UpgradePopup onClose={() => setShowUpgradePopup(false)} />
      )}
    </main>
  );
}
