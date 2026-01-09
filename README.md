# Chamelo

A chameleon-like adaptive banner component for React. Extracts dominant colors from images using K-means clustering and generates beautifully blended translucent banners.

## Features

- **K-means++ Clustering**: Accurate color extraction powered by ml-kmeans
- **Adaptive Translucent Banner**: Glassmorphism effect that naturally blends with images
- **WCAG Contrast Ratio**: Automatic text color selection for optimal readability
- **Multiple Styles**: Solid, gradient, and blur effects
- **TypeScript Support**: Full type definitions included
- **React 18/19 Compatible**: Works with latest React versions

## Installation

```bash
npm install chamelo
```

## Usage

### Basic Usage

```tsx
import { Chamelo } from 'chamelo'
import type { ChameloProps } from 'chamelo'

function App() {
  return (
    <Chamelo
      imageSrc="/path/to/image.jpg"
      text="Image description text"
      position="bottom"
    />
  )
}
```

### Advanced Options

```tsx
<Chamelo
  imageSrc="/photo.jpg"
  text="Beautiful landscape"
  position="bottom"           // 'top' | 'bottom'
  bannerStyle="gradient"      // 'solid' | 'gradient' | 'blur'
  gradientDirection="horizontal" // 'horizontal' | 'vertical' | 'diagonal'
  colorCount={5}              // Number of colors to extract
  bannerHeight={80}           // Banner height (px)
  fontSize={16}               // Text size
  textAlign="center"          // 'left' | 'center' | 'right'
  opacity={0.6}               // Banner opacity
  preferDark={false}          // Prefer dark background
  onColorsExtracted={(colors) => {
    console.log('Extracted colors:', colors)
  }}
/>
```

### Custom Content

```tsx
<Chamelo
  imageSrc="/photo.jpg"
  renderContent={({ background, text }) => (
    <div className="flex items-center gap-4">
      <span style={{ color: text }}>Custom content</span>
      <button style={{ backgroundColor: background, color: text }}>
        Button
      </button>
    </div>
  )}
/>
```

### Using the Color Extraction Hook

```tsx
import { useColorExtraction } from 'chamelo'

function CustomComponent() {
  const { colors, bannerColors, isLoading } = useColorExtraction(
    '/path/to/image.jpg',
    { colorCount: 5 }
  )

  if (isLoading) return <div>Loading...</div>

  return (
    <div style={{ backgroundColor: bannerColors?.background }}>
      <span style={{ color: bannerColors?.text }}>
        Auto color applied
      </span>
    </div>
  )
}
```

### Direct Color Extraction

```tsx
import { extractColors } from 'chamelo'

async function getColors() {
  const colors = await extractColors('/path/to/image.jpg', {
    colorCount: 5,
    quality: 10
  })

  colors.forEach(color => {
    console.log(`${color.hex}: ${color.percentage.toFixed(1)}%`)
  })
}
```

## Props

### ChameloProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `imageSrc` | `string` | Required | Image URL |
| `text` | `string` | - | Banner text |
| `position` | `'top' \| 'bottom'` | `'bottom'` | Banner position |
| `colorCount` | `number` | `5` | Number of colors to extract |
| `bannerStyle` | `'solid' \| 'gradient' \| 'blur'` | `'gradient'` | Banner style |
| `gradientDirection` | `'horizontal' \| 'vertical' \| 'diagonal'` | `'horizontal'` | Gradient direction |
| `bannerHeight` | `number \| string` | `80` | Banner height |
| `fontSize` | `number \| string` | `16` | Text size |
| `textAlign` | `'left' \| 'center' \| 'right'` | `'center'` | Text alignment |
| `opacity` | `number` | `0.6` | Banner opacity (0-1) |
| `preferDark` | `boolean` | `false` | Prefer dark background |
| `renderContent` | `(colors) => ReactNode` | - | Custom render function |
| `onColorsExtracted` | `(colors) => void` | - | Callback when colors are extracted |
| `showLoading` | `boolean` | `true` | Show loading indicator |

## API

### extractColors(imageSource, options)

Extracts dominant colors from an image.

```typescript
interface ColorExtractionOptions {
  colorCount?: number      // Number of colors to extract (default: 5)
  quality?: number         // Sampling quality (default: 10)
  maxIterations?: number   // K-means max iterations (default: 100)
  sampleSize?: number      // Sample size (default: 10000)
}

interface ExtractedColor {
  rgb: { r: number; g: number; b: number }
  hex: string
  population: number
  percentage: number
}
```

### useColorExtraction(imageSrc, options)

React hook for color extraction.

```typescript
interface UseColorExtractionResult {
  colors: ExtractedColor[]
  bannerColors: BannerColors | null
  isLoading: boolean
  error: Error | null
  refresh: () => void
}
```

## License

MIT
