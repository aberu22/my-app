import defaultTheme from 'tailwindcss/defaultTheme';

export default {
  darkMode: ["class"],
  

  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  // ✅ keep “glass” arbitrary utilities from being purged in prod
  safelist: [
    // arbitrary background + box-shadow + mask-image we used for the glass look
    { pattern: /\[background-image:.*\]/ },
    { pattern: /\[box-shadow:.*\]/ },
    { pattern: /\[mask-image:.*\]/ },
    // support-variant with backdrop-filter (exact class we used)
    "supports-[backdrop-filter]:backdrop-saturate-150",
  ],

  theme: {
    extend: {
      fontFamily: {
  sans: ["Sora", "var(--font-inter)", ...defaultTheme.fontFamily.sans],
  mono: ["var(--font-geist-mono)", "monospace"],
},

      /* —— your AI palette (unchanged) —— */
      colors: {
        darkBg: "#000000ff",
        cardBg: "#131315",
        neonPink: "#ff4da6",
        neonPurple: "#9f6eff",
        neonBlue: "#79c6ff",
        borderDark: "#2c2c2c",
        glassBg: "rgba(255, 255, 255, 0.05)",

        background: "#000000ff",
        foreground: "#f5f5f5",

        card: {
          DEFAULT: "#131315",
          foreground: "#f5f5f5",
        },

        popover: {
          DEFAULT: "#1e1e21",
          foreground: "#f5f5f5",
        },

        primary: {
          DEFAULT: "#383737ff",
          foreground: "#ffffff",
        },

        secondary: {
          DEFAULT: "#050505ff",
          foreground: "#ffffff",
        },

        accent: {
          DEFAULT: "#000000ff",
          foreground: "#ffffff",
        },

        destructive: {
          DEFAULT: "#ff4da6",
          foreground: "#ffffff",
        },

        border: "#2c2c2c",
        input: "#2c2c2c",
        ring: "#8b5cf6",

        muted: {
          DEFAULT: "#71717a",
          foreground: "#a1a1aa",
        },

        chart: {
          '1': "#8b5cf6",
          '2': "#79c6ff",
          '3': "#ff4da6",
          '4': "#4CAF50",
          '5': "#FF9800",
        },
      },

      /* —— subtle but modern shadows —— */
      boxShadow: {
        neon: "0px 0px 12px rgba(139, 92, 246, 0.8)",
        "neon-pink": "0px 4px 10px rgba(187, 79, 133, 0.5)",
        "neon-purple": "0px 4px 10px rgba(159, 110, 255, 0.5)",
        glow: "0 0 20px rgba(139, 92, 246, 0.6)",
        "inner-card": "inset 0 1px 0 rgba(255,255,255,.03)",
      },

      spacing: {
        18: "4.5rem",
      },

      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      /* —— tasteful animations + keyframes —— */
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "zoom-in-95": { from: { transform: "scale(.95)" }, to: { transform: "scale(1)" } },
        "slide-up": { from: { transform: "translateY(8px)", opacity: 0 }, to: { transform: "translateY(0)", opacity: 1 } },
      },
      animation: {
        "fade-in": "fade-in .2s ease-out both",
        "zoom-in-95": "zoom-in-95 .18s ease-out both",
        "slide-up": "slide-up .22s ease-out both",
      },
    },
  },

  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
    require("daisyui"),
  ],

  daisyui: {
    themes: [
      {
        mytheme: {
          primary: "#000000ff",
          secondary: "#27272a",
          accent: "#1e1e21",
          neutral: "#131315",
          "base-100": "#0d0d0d",
          info: "#79c6ff",
          success: "#4CAF50",
          warning: "#FF9800",
          error: "#ff4da6",
        },
      },
    ],
  },
};
