import { useAuth } from "@/context/AuthContext";

export function usePlanStatus() {
  const {
    membershipStatus,
    credits,
    stripePriceId,
    loading,
    nextBillingDate,
    user,
  } = useAuth();

  const plan = membershipStatus || "free";
  const isPremium = plan !== "free";
  const canUpgrade = plan !== "plus"; // assuming "plus" is highest tier

  return {
    user,
    plan,
    credits,
    priceId: stripePriceId,
    isPremium,
    canUpgrade,
    nextBillingDate,
    loading,
  };
}
