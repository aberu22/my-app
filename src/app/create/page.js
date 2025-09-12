"use client";

import { useState, useEffect } from "react";
import { useImageGeneration } from "../../context/ImageGenrationContext";
import CreateSidebar from "../components/CreateSidebar";
import ImageGenerationPanel from "../components/ImageGenerationPanel";
import TemplateSelection from "../components/TempleteSelection.js";
import UpgradeButton from "../components/UpgradeButton";
import UpgradePopup from "../components/UpgradePopup";

// Age gate
import { useAgeGate } from "../hooks/useAgeGate";
import AgeGateModal from "../components/AgeGateModal";

export default function CreatePage() {
  const { onSendToPrompt, credits } = useImageGeneration();
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const { checked, verified, confirm } = useAgeGate();

  useEffect(() => {
    if (credits !== null && credits <= 0) setShowUpgradePopup(true);
  }, [credits]);

  // Wait until localStorage checked to avoid flicker/mismatch
  if (!checked) return null;

  // 🔒 Block the entire page until verified (no sidebar, no content)
  if (!verified) {
    return <AgeGateModal onConfirm={confirm} />;
  }

  // ✅ Verified: render the real page
  return (
    <div className="flex min-h-screen bg-black-900 text-white">
      <CreateSidebar mode="image" />
      <main className="flex-1 p-6 overflow-auto">
        <ImageGenerationPanel mode="image" />
        <UpgradeButton onClick={() => setShowUpgradePopup(true)} />
        {showUpgradePopup && (
          <UpgradePopup onClose={() => setShowUpgradePopup(false)} />
        )}
        <TemplateSelection onSendToPrompt={onSendToPrompt} />
      </main>
    </div>
  );
}
