import React from "react";

const ProgressBar = ({ percent = 0, label = "", visible = true }) => {
  if (!visible) return null;

  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className="w-full mt-2">
      {label && (
        <div className="mb-1 text-sm text-zinc-300 font-medium">
          {label}
        </div>
      )}
      <div className="w-full h-4 bg-zinc-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-purple-500 transition-all duration-500 ease-in-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <div className="text-xs text-zinc-400 mt-1 text-right">{clamped}%</div>
    </div>
  );
};

export default ProgressBar;
