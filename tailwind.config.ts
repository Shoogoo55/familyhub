import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: "#f6f9f6",
          100: "#e3ede3",
          200: "#c6dac6",
          300: "#9dbe9d",
          400: "#6f9d6f",
          500: "#4f7d4f",
          600: "#3d643d",
          700: "#325032",
          800: "#2a402a",
          900: "#233523",
        },
        cream: {
          50: "#fefef9",
          100: "#fdfdf0",
          200: "#fafae0",
          300: "#f5f5c8",
          400: "#eeee9e",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0,0,0,0.07), 0 10px 20px -2px rgba(0,0,0,0.04)",
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
