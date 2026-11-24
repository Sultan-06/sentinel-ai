tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
          },
          colors: {
            cream: '#FAF9F7',
            ink: '#1F2937',
            muted: '#6B7280',
            hairline: '#EAECEF',
            brand: {
              DEFAULT: '#2563EB',
              soft: '#EFF6FF',
              hover: '#1D4ED8',
            },
            safe: {
              text: '#059669',
              bg: '#ECFDF5',
              border: '#A7F3D0',
            },
            caution: {
              text: '#D97706',
              bg: '#FFFBEB',
              border: '#FDE68A',
            },
            danger: {
              text: '#DC2626',
              bg: '#FEF2F2',
              border: '#FECACA',
            },
          },
          boxShadow: {
            soft: '0 10px 35px -10px rgba(31, 41, 55, 0.06), 0 2px 8px -2px rgba(31, 41, 55, 0.03)',
            subtle: '0 2px 10px -2px rgba(31, 41, 55, 0.04)',
          }
        }
      }
    };
