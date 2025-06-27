// // tailwind.config.js
// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   content: [
//     './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
//     './src/components/**/*.{js,ts,jsx,tsx,mdx}',
//     './src/app/**/*.{js,ts,jsx,tsx,mdx}',
//   ],
//   theme: {
//     extend: {
//       colors: {
//         primary: {
//           50: '#eff6ff',
//           100: '#dbeafe',
//           200: '#bfdbfe',
//           300: '#93c5fd',
//           400: '#60a5fa',
//           500: '#3b82f6',
//           600: '#2563eb',
//           700: '#1d4ed8',
//           800: '#1e40af',
//           900: '#1e3a8a',
//         },
//         gray: {
//           50: '#f9fafb',
//           100: '#f3f4f6',
//           200: '#e5e7eb',
//           300: '#d1d5db',
//           400: '#9ca3af',
//           500: '#6b7280',
//           600: '#4b5563',
//           700: '#374151',
//           800: '#1f2937',
//           900: '#111827',
//         }
//       },
//       spacing: {
//         '18': '4.5rem',
//         '88': '22rem',
//         '128': '32rem',
//       },
//       borderRadius: {
//         '4xl': '2rem',
//         '5xl': '2.5rem',
//       },
//       animation: {
//         'fade-in': 'fadeIn 0.5s ease-out',
//         'slide-in': 'slideIn 0.3s ease-out',
//         'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
//         'bounce-slow': 'bounce 2s infinite',
//       },
//       keyframes: {
//         fadeIn: {
//           '0%': { opacity: '0', transform: 'translateY(10px)' },
//           '100%': { opacity: '1', transform: 'translateY(0)' },
//         },
//         slideIn: {
//           '0%': { transform: 'translateX(-100%)' },
//           '100%': { transform: 'translateX(0)' },
//         },
//       },
//       backdropBlur: {
//         xs: '2px',
//       },
//       boxShadow: {
//         'inner-lg': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
//         'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
//       }
//     },
//   },
//   plugins: [
//     require('@tailwindcss/forms'),
//     require('@tailwindcss/typography'),
//   ],
// }

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      animation: {
        'spin': 'spin 1s linear infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        spin: {
          to: { transform: 'rotate(360deg)' }
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' }
        }
      }
    },
  },
  plugins: [],
}