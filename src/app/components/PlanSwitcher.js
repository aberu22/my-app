import { useState } from "react";

export default function PlanSwitcher({ userId }) {
  const [selectedPriceId, setSelectedPriceId] = useState("");
  const [previewAmount, setPreviewAmount] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const plans = [
    { name: "Basic", priceId: "price_1RCB4bGbLZ3kl4Qnbd6PlZeX" },
    { name: "Plus", priceId: "price_1RCBBoGbLZ3kl4Qnywms6TCs" },
  ];

  const previewProration = async (priceId) => {
    setLoading(true);
    try {
      const res = await fetch("/api/change-subscription", {
        method: "POST",
        body: JSON.stringify({
          userId,
          newPriceId: priceId,
          previewOnly: true,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      setPreviewAmount(data.previewAmount);
      setConfirming(true);
      setSelectedPriceId(priceId);
    } catch (err) {
      alert("Error previewing upgrade");
    }
    setLoading(false);
  };

  const confirmChange = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/change-subscription", {
        method: "POST",
        body: JSON.stringify({
          userId,
          newPriceId: selectedPriceId,
          previewOnly: false,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      if (data.success) {
        alert("✅ Plan updated!");
      } else {
        alert("⚠️ Failed to update plan");
      }
    } catch (err) {
      alert("Error updating subscription");
    }
    setLoading(false);
    setConfirming(false);
    setPreviewAmount(null);
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">Change your plan</h2>
      <div className="space-y-3">
        {plans.map((plan) => (
          <button
            key={plan.priceId}
            onClick={() => previewProration(plan.priceId)}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={loading}
          >
            Switch to {plan.name}
          </button>
        ))}
      </div>

      {confirming && previewAmount && (
        <div className="mt-4 p-3 border border-gray-300 rounded bg-gray-100">
          <p>
            🔔 You’ll be charged <strong>${previewAmount}</strong> today to switch to this plan.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={confirmChange}
              className="bg-green-600 text-white px-3 py-2 rounded"
            >
              Confirm
            </button>
            <button
              onClick={() => {
                setConfirming(false);
                setPreviewAmount(null);
              }}
              className="bg-gray-300 px-3 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
