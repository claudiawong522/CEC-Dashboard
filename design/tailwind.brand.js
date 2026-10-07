// Reference only. This project uses Tailwind v4's CSS-first config: the real
// theme lives in the @theme block of app/globals.css and reads
// design/brand-tokens.css. Kept so the values are greppable in one place.
module.exports = {
  colors: {
    white: '#FFFFFF',
    black: '#000000',
    mint: '#3DFFA2',
    'mint-dark': '#00CC6A',
    'mint-soft': '#A8FFD4',
    subtle: '#4A4A4A',
    muted: '#E5E5E5',
    line: 'rgba(0,0,0,0.12)',
    red: '#FF0000',
    coral: '#D95070',
    amber: '#E8B830',
    teal: '#2A9D8F',
    blue: '#3B6FC2',
  },
  fontFamily: {
    sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
    display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
    mono: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
  },
  fontWeight: { normal: '400', medium: '500', semibold: '600', bold: '700' },
  borderRadius: { none: '0' },
  boxShadow: {
    soft: '0 1px 2px rgba(0,0,0,0.05), 0 10px 28px -14px rgba(0,0,0,0.14)',
    mint: '4px 4px 0 0 #3DFFA2',
    'mint-sm': '2px 2px 0 0 #3DFFA2',
    'mint-lg': '8px 8px 0 0 #3DFFA2',
  },
  transitionTimingFunction: {
    fluid: 'cubic-bezier(.22,1,.36,1)',
    intro: 'cubic-bezier(.76,0,.24,1)',
    pop: 'cubic-bezier(.34,1.5,.4,1)',
  },
  keyframes: {
    riseIn: { from: { opacity: '0', transform: 'translateY(7px)' }, to: { opacity: '1', transform: 'none' } },
    fadeUp: { from: { opacity: '0', transform: 'translateY(5px)' }, to: { opacity: '1', transform: 'none' } },
    marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-33.333%)' } },
    introLift: { from: { transform: 'translateY(0)' }, to: { transform: 'translateY(-100%)' } },
    introMark: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'none' } },
    pop: { '0%': { transform: 'scale(1) rotate(0)' }, '35%': { transform: 'scale(1.28) rotate(14deg)' }, '70%': { transform: 'scale(.94) rotate(-6deg)' }, '100%': { transform: 'scale(1) rotate(0)' } },
  },
};
