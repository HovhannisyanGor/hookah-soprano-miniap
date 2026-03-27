import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#09090b",
        smoke: "#141414",
        brass: "#c8954d",
        ember: "#e07a2d",
        sage: "#4f7768",
        cream: "#f7efe1"
      },
      boxShadow: {
        lounge: "0 24px 80px rgba(0, 0, 0, 0.38)"
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"]
      },
      backgroundImage: {
        haze:
          "radial-gradient(circle at top, rgba(224, 122, 45, 0.28), transparent 40%), radial-gradient(circle at 20% 20%, rgba(79, 119, 104, 0.22), transparent 34%), linear-gradient(180deg, #0b0a09 0%, #14110f 35%, #09090b 100%)"
      }
    }
  },
  plugins: []
};

export default config;
