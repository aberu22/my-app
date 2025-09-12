const localThumbnailPathLoras = "/loras";
const localThumbnailPathModels = "/models";
const activationTextPath = "/assets/activation_texts";

const NSFW_KEYWORDS = ["nsfw", "hentai", "porn", "adult", "hardcore", "nudity"];

function getBaseName(filePath = "") {
  return filePath.split(/[\\/]/).pop().replace(".safetensors", "");
}

function inferBaseModel(name, metadata = {}) {
  const meta = metadata || {};
  const raw = meta.ss_base_model_version || meta.base_model || "";
  const version = raw.toLowerCase();

  if (version.includes("pony")) return "Pony";
  if (version.includes("illustrious")) return "illustrious";
  if (version.includes("sdxl")) return "SDXL 1.0";
  if (version.includes("1.5") || version.includes("v1-5") || version.includes("flux") || version.includes("sd1")) return "SD 1.5";
  if (version.includes("realism")) return "SD 1.5"; // ✅ NEW!

  const n = name.toLowerCase();
  if (n.includes("pony")) return "Pony";
  if (n.includes("illustrious")) return "illustrious";
  if (n.includes("xl")) return "SDXL 1.0";
  if (n.includes("1.5") || n.includes("v1-5") || n.includes("flux") || n.includes("sd1")) return "SD 1.5";
  if (n.includes("realism")) return "SD 1.5"; // ✅ NEW!

  return "unknown";
}

export async function enrichWithThumbnailsAndActivation(lorasOrModels, type = "lora") {
  const isLora = type === "lora";
  const enriched = [];

  const activationTextFiles = await fetch("/api/list-activation-texts")
    .then(res => res.json())
    .catch(() => ({ files: [] }));

  const activationTextMap = {};
  for (const file of activationTextFiles.files || []) {
    try {
      const json = await fetch(`${activationTextPath}/${file}`).then(res => res.json());
      const key = file.replace(".json", "");
      activationTextMap[key] = json["activation text"] || "";
    } catch (err) {
      console.warn("⚠️ Could not load:", file);
    }
  }

  for (const item of lorasOrModels) {
    const name = getBaseName(item.path || item.name || item.filename);
    const thumbnail = `${isLora ? localThumbnailPathLoras : localThumbnailPathModels}/${name}.preview.png`;
    const activationText = isLora ? activationTextMap[name] || "" : undefined;
    const baseModel = inferBaseModel(name, item.metadata || {});
    const isNSFW = NSFW_KEYWORDS.some(keyword => name.toLowerCase().includes(keyword));

    enriched.push({
      ...item,
      name,
      alias: name,
      thumbnail,
      activation_text: activationText,
      baseModel,
      isNSFW,
    });
  }

  return enriched;
}
