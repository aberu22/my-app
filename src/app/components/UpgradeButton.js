import { useState, useEffect } from "react";
import { useImageGeneration } from "../../context/ImageGenrationContext"; // ✅ Import context

const UpgradeButton = () => {
  const { userId } = useImageGeneration(); // ✅ Get userId from context
  const [loading, setLoading] = useState(false);

  // ✅ Replace with your actual Stripe price ID
  const priceId = "price_123"; // Make sure this is a valid Stripe price ID

  useEffect(() => {
    console.log("🔍 Checking userId in UpgradeButton:", userId);
  }, [userId]);

  const handleUpgrade = async () => {
    if (!userId || !priceId) {
      alert(`🚨 Error: Missing required fields! \n userId: ${userId} \n priceId: ${priceId}`);
      return;
    }

    setLoading(true);

    try {
      console.log("✅ Sending checkout request with:", { priceId, userId });

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, userId }),
      });

      const result = await response.json();

      if (result.success && result.url) {
        console.log("✅ Redirecting to Stripe Checkout:", result.url);
        window.location.href = result.url; // ✅ Redirect to Stripe Checkout
      } else {
        console.error("🚨 Payment failed:", result.error);
        alert("Payment failed: " + result.error);
      }
    } catch (error) {
      console.error("🚨 Error processing payment:", error);
      alert("Error processing payment.");
    }

    setLoading(false);
  };

  if (!userId) {
    return <div className="text-red-500 font-bold">🔄 Loading user data...</div>;
  }

  return (
    <div className="flex justify-center">
      <button
        onClick={handleUpgrade}
        className={`px-6 py-3 rounded-lg shadow-md font-bold ${
          loading ? "bg-gray-400 cursor-not-allowed" : "bg-yellow-500 hover:bg-yellow-600 text-black"
        }`}
        disabled={loading}
      >
        {loading ? "Processing..." : "Upgrade to Premium"}
      </button>
    </div>
  );
};

export default UpgradeButton;
