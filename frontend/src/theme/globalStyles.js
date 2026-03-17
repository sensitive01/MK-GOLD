// @mui
import { GlobalStyles as MUIGlobalStyles } from '@mui/material';

// ----------------------------------------------------------------------

export default function GlobalStyles() {
  const inputGlobalStyles = (
    <MUIGlobalStyles
      styles={{
        '*': {
          boxSizing: 'border-box',
        },
        html: {
          margin: 0,
          padding: 0,
          width: '100%',
          height: '100%',
          WebkitOverflowScrolling: 'touch',
        },
        body: {
          margin: 0,
          padding: 0,
          width: '100%',
          height: '100%',
        },
        '#root': {
          width: '100%',
          height: '100%',
        },
        input: {
          '&[type=number]': {
            MozAppearance: 'textfield',
            '&::-webkit-outer-spin-button': {
              margin: 0,
              WebkitAppearance: 'none',
            },
            '&::-webkit-inner-spin-button': {
              margin: 0,
              WebkitAppearance: 'none',
            },
          },
        },
        img: {
          display: 'block',
          maxWidth: '100%',
        },
        ul: {
          margin: 0,
          padding: 0,
        },
        '@keyframes credPulse': {
          '0%': { boxShadow: '0 0 0 0 rgba(138, 27, 159, 0.4)' },
          '70%': { boxShadow: '0 0 0 10px rgba(138, 27, 159, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(138, 27, 159, 0)' },
        },
        '@keyframes credGlow': {
          'from': { filter: 'drop-shadow(0 0 2px #FFD700)' },
          'to': { filter: 'drop-shadow(0 0 8px #FFD700)' },
        },
        '.cred-success-glow': {
          animation: 'credPulse 2s infinite',
          borderRadius: '12px',
        }
      }}
    />
  );

  return inputGlobalStyles;
}
