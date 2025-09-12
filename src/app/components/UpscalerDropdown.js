import { useImageGeneration } from "@/context/ImageGenrationContext";

const UpscalerDropdown = () => {
  const { allUpscalers, setSelectedUpscaler, setSelectedLatentUpscaler,selectedUpscaler,selectedLatentUpscaler  } = useImageGeneration();

  return (
    <div className="mb-4 ">
      <label className="block text-sm font-medium text-w-700 mb-1">
        Upscaler
      </label>
      <select
    value={selectedUpscaler?.name || selectedLatentUpscaler?.name || ""}
    onChange={(e) => {
    const selectedName = e.target.value;
    const found = allUpscalers.find((u) => u.name === selectedName);
    if (found?.type === "latent") {
      setSelectedLatentUpscaler(found);
      setSelectedUpscaler(null);
    } else {
      setSelectedUpscaler(found);
      setSelectedLatentUpscaler(null);
    }
  }}
  className="w-full p-3 bg-zinc-800 border border-zinc-700 text-white rounded-md"
>
  <option value="">Select Upscaler</option>
  {allUpscalers.map((u) => (
    <option key={u.name} value={u.name}>
      {u.name}
    </option>
  ))}
</select>
      
    </div>
  );
};

export default UpscalerDropdown;
