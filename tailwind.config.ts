import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050B1F", // Deep Space Navy
        foreground: "#F8FAFC",
        cyber: {
          blue: "#00E5FF", // Electric Blue
          pink: "#FF007A", // Hot Pink
          green: "#00FF94", // Cyber Green
          yellow: "#FFD600", // Vibrant Yellow
          purple: "#BC00FF", // Neon Purple
        },
        surface: {
          DEFAULT: "#0D152E",
          lighter: "#162245",
          border: "#1E2D5A",
        }
      },
      fontFamily: {
        heading: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      boxShadow: {
        'cyber-blue': '0 0 20px rgba(0, 229, 255, 0.3)',
        'cyber-pink': '0 0 20px rgba(255, 0, 122, 0.3)',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
};
export default config;
