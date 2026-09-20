import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0b253c',
          light: '#163f60',
          dark: '#071a2b',
        },
        orange: {
          DEFAULT: '#ff8733',
          hover: '#e57224',
          light: '#fff2e8',
        },
        green: {
          DEFAULT: '#139b67',
          light: '#e9f8f1',
        },
        blue: {
          DEFAULT: '#2f76d2',
          light: '#eaf2ff',
        },
        red: {
          DEFAULT: '#d94b4b',
          light: '#fff1f1',
        },
        ink: '#14293a',
        muted: '#70808e',
        line: '#e5ebef',
        canvas: '#f3f6f8',
      },
      fontFamily: {
        cairo: ['Cairo', 'Tahoma', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
