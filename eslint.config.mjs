import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  ...nextVitals,
  {
    rules: {
      // These React Compiler advisory rules require broader component-state
      // refactors. The app does not enable the React Compiler; core Rules of
      // Hooks and exhaustive-deps remain enabled.
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'off',
    },
  },
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'coverage/**',
    'scripts/_seo_html/**',
    'public/service-worker.js',
  ]),
]);
