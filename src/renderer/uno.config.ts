import {
  defineConfig,
  presetUno,
  presetIcons,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss';

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons({
      scale: 1.2,
      warn: true,
      extraProperties: {
        display: 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],
  transformers: [transformerDirectives(), transformerVariantGroup()],
  theme: {
    colors: {
      primary: '#1677ff',
    },
  },
  shortcuts: {
    'flex-center': 'flex items-center justify-center',
    'btn-icon': 'p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
  },
});
