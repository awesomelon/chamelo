// Chamelo - Chameleon-like adaptive banner
// K-means clustering based image color extraction

// Main Component
export { Chamelo } from './components/Chamelo'
export type { ChameloProps } from './components/Chamelo'

// Hooks
export { useColorExtraction } from './hooks/useColorExtraction'
export type {
  UseColorExtractionOptions,
  UseColorExtractionResult,
} from './hooks/useColorExtraction'

// Color Extraction Utilities
export {
  extractColors,
  getContrastRatio,
  getRelativeLuminance,
} from './utils/colorExtractor'
export type {
  RGB,
  ExtractedColor,
  ColorExtractionOptions,
} from './utils/colorExtractor'

// Color Harmony Utilities
export {
  generateBannerColors,
  findReadableTextColor,
  rgbToHsl,
  hslToRgb,
  adjustLightness,
  adjustSaturation,
  createGradient,
  createSoftGradient,
  isDark,
  toRgba,
} from './utils/colorHarmony'
export type { HSL, BannerColors } from './utils/colorHarmony'
