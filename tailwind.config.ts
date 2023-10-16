import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      backgroundImage: () => ({
        'radial-gradient': 'radial-gradient(circle, var(--tw-gradient-stops))',
      }),
    },
  },
  plugins: [],
} satisfies Config;
