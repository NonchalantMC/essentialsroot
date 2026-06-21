export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['"Circular Std"','Circular','"DM Sans"','-apple-system','BlinkMacSystemFont','"Segoe UI"','sans-serif'],
        serif: ['"Cormorant Garamond"','Georgia','serif'],
      },
      colors: {
        ink:   { DEFAULT:'#212836', mid:'#3d4a5c', soft:'#8a9bb0' },
        teal:  { DEFAULT:'#1e805f', mid:'#25a077', pale:'#e0f4ed', light:'#86e8c4' },
        bone:  '#f4f7f9',
        cream: '#edf3f0',
        border:'#dce6e2',
      },
      borderRadius: { pill:'9999px' },
      animation: {
        'fade-in':  'fadeIn .3s ease',
        'slide-up': 'slideUp .4s cubic-bezier(.4,0,.2,1)',
        'pop-in':   'popIn .3s cubic-bezier(.34,1.56,.64,1)',
      },
      keyframes: {
        fadeIn:  { from:{opacity:0},                                     to:{opacity:1} },
        slideUp: { from:{transform:'translateY(20px)',opacity:0},         to:{transform:'translateY(0)',opacity:1} },
        popIn:   { from:{transform:'scale(.9)',opacity:0},                to:{transform:'scale(1)',opacity:1} },
      },
      boxShadow: {
        card:  '0 4px 24px rgba(33,40,54,.07)',
        hover: '0 16px 40px rgba(33,40,54,.10)',
        modal: '0 24px 80px rgba(33,40,54,.18)',
      },
    },
  },
  plugins: [],
};
