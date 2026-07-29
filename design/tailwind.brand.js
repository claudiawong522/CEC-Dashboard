// Merge into tailwind.config.{js,ts} → theme.extend
module.exports = {
  colors: {
    paper: '#FFFDF9',
    page: '#FDFAF4',
    wash: '#F5F0E5',
    line: 'rgba(35,32,28,0.09)',
    lineSoft: 'rgba(35,32,28,0.07)',
    lineInput: 'rgba(35,32,28,0.14)',
    lineStrong: '#E2DACB',
    faint: '#B0A899',
    body: '#6E675C',
    strong: '#4A443C',
    ink: '#23201C',
    coral: '#E8583D',
    amber: '#E0B94A',
    teal: '#3FA789',
    blue: '#3B6FC2',
    destructive: '#B4472F',
  },
  fontFamily: {
    sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
    mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
  },
  fontWeight: { light: '300', normal: '400', medium: '500' }, // nothing heavier
  borderRadius: { chip: '6px', input: '8px', btn: '9px', card: '11px', pill: '20px', login: '24px' },
  backgroundImage: {
    cent: 'linear-gradient(95deg,#E8583D,#E0B94A,#3FA789,#3B6FC2)',
    'cent-tint': 'linear-gradient(95deg,rgba(232,88,61,.15),rgba(224,185,74,.15),rgba(63,167,137,.15),rgba(59,111,194,.15))',
    'cent-pastel': 'linear-gradient(95deg,#F3B5A6,#EFDCA8,#AEDACA,#B7CBEB)',
  },
  boxShadow: {
    primary: '0 9px 20px -10px rgba(232,88,61,.9)',
    menu: '0 12px 28px -16px rgba(35,32,28,.5)',
  },
  transitionTimingFunction: {
    brand: 'cubic-bezier(.2,.8,.2,1)',
    indicator: 'cubic-bezier(.2,.9,.2,1)',
    spring: 'cubic-bezier(.34,1.6,.4,1)',
    draw: 'cubic-bezier(.4,0,.2,1)',
    pop: 'cubic-bezier(.34,1.5,.4,1)',
  },
  keyframes: {
    riseIn: { from: { opacity: '0', transform: 'translateY(7px)' }, to: { opacity: '1', transform: 'none' } },
    fadeUp: { from: { opacity: '0', transform: 'translateY(5px)' }, to: { opacity: '1', transform: 'none' } },
    float1: { '0%,100%': { transform: 'translate(0,0) rotate(0)' }, '50%': { transform: 'translate(9px,-14px) rotate(6deg)' } },
    float2: { '0%,100%': { transform: 'translate(0,0) rotate(0)' }, '50%': { transform: 'translate(-11px,-9px) rotate(-7deg)' } },
    pop: { '0%': { transform: 'scale(1) rotate(0)' }, '35%': { transform: 'scale(1.28) rotate(14deg)' }, '70%': { transform: 'scale(.94) rotate(-6deg)' }, '100%': { transform: 'scale(1) rotate(0)' } },
  },
  animation: {
    riseIn: 'riseIn 500ms cubic-bezier(.2,.8,.2,1) both',
    fadeUp: 'fadeUp 340ms cubic-bezier(.2,.8,.2,1) both',
    float1: 'float1 13s ease-in-out infinite',
    float2: 'float2 15s ease-in-out infinite',
    pop: 'pop 620ms cubic-bezier(.34,1.5,.4,1) both',
  },
};
