export const IMAGE_PROVIDERS = [
  {
    id: "stable-diffusion",
    name: "Stable Diffusion",
    badge: null,
    thumbnail: "/thumbnails/stable-diffusion.png",
    description:
      "Advanced image generation with models, samplers, and templates.",
    type: "sd",
    features: {
      templates: true,
      browseModels: true,
      sampler: true,
      aspect: true,
      resolution: true,
    },
  },
  {
    id: "nano-banana-pro",
    name: "Nano Banana Pro",
    badge: "NE",
    thumbnail: "/thumbnails/nano-banana.png",
    description:
      "Fast, high-quality image generation with minimal configuration.",
    type: "nano",
    features: {
      templates: false,
      browseModels: false,
      sampler: false,
      aspect: true,
      resolution: true,
    },
  },
];
