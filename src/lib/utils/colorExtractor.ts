/**
 * K-means clustering based color extraction using ml-kmeans
 */

import { kmeans } from 'ml-kmeans'

export interface RGB {
  r: number
  g: number
  b: number
}

export interface ExtractedColor {
  rgb: RGB
  hex: string
  population: number
  percentage: number
}

export interface ColorExtractionOptions {
  colorCount?: number
  quality?: number
  maxIterations?: number
  sampleSize?: number
  useWorker?: boolean
}

const DEFAULT_OPTIONS: Required<ColorExtractionOptions> = {
  colorCount: 5,
  quality: 10,
  maxIterations: 100,
  sampleSize: 10000,
  useWorker: false,
}

/**
 * RGB를 HEX로 변환
 */
function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`
}

/**
 * 이미지에서 픽셀 데이터 추출
 */
function getPixelsFromImage(
  imageData: ImageData,
  quality: number,
  sampleSize: number
): number[][] {
  const pixels: number[][] = []
  const data = imageData.data
  const pixelCount = imageData.width * imageData.height
  const step = Math.max(1, Math.floor(pixelCount / sampleSize) * quality)

  for (let i = 0; i < data.length; i += 4 * step) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]

    // 투명하지 않은 픽셀만 포함
    if (a >= 125) {
      // 거의 흰색이나 검은색 제외 (배경색 가능성 높음)
      if (!(r > 250 && g > 250 && b > 250) && !(r < 5 && g < 5 && b < 5)) {
        pixels.push([r, g, b])
      }
    }
  }

  return pixels
}

/**
 * 채도 계산 (HSL 기준)
 */
function getSaturation(rgb: RGB): number {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2

  if (max === min) return 0

  const d = max - min
  return l > 0.5 ? d / (2 - max - min) : d / (max + min)
}

/**
 * ml-kmeans를 사용한 색상 클러스터링
 */
function kMeansClusteringWithLib(
  pixels: number[][],
  k: number,
  maxIterations: number
): { centroids: RGB[]; counts: number[] } {
  if (pixels.length === 0) {
    return { centroids: [], counts: [] }
  }

  const actualK = Math.min(k, pixels.length)

  // ml-kmeans 실행
  const result = kmeans(pixels, actualK, {
    initialization: 'kmeans++',
    maxIterations,
  })

  // 각 클러스터의 픽셀 수 계산
  const counts: number[] = new Array(actualK).fill(0)
  for (const clusterIndex of result.clusters) {
    counts[clusterIndex]++
  }

  // centroids를 RGB 객체로 변환
  const centroids: RGB[] = result.centroids.map(centroid => ({
    r: Math.round(centroid[0]),
    g: Math.round(centroid[1]),
    b: Math.round(centroid[2]),
  }))

  return { centroids, counts }
}

/**
 * ImageData에서 직접 색상 추출
 */
export function extractColorsFromImageData(
  imageData: ImageData,
  options: Required<Omit<ColorExtractionOptions, 'useWorker'>>
): ExtractedColor[] {
  const pixels = getPixelsFromImage(imageData, options.quality, options.sampleSize)

  if (pixels.length === 0) {
    return []
  }

  // 픽셀이 너무 적으면 colorCount 조정
  const actualColorCount = Math.min(options.colorCount, pixels.length)

  const { centroids, counts } = kMeansClusteringWithLib(
    pixels,
    actualColorCount,
    options.maxIterations
  )

  const totalPixels = counts.reduce((a, b) => a + b, 0)

  return centroids
    .map((centroid, i) => ({
      rgb: centroid,
      hex: rgbToHex(centroid),
      population: counts[i],
      percentage: totalPixels > 0 ? (counts[i] / totalPixels) * 100 : 0,
    }))
    .filter(c => c.population > 0)
    .sort((a, b) => {
      // 채도와 빈도를 조합한 점수로 정렬
      const scoreA = a.percentage * (0.7 + 0.3 * getSaturation(a.rgb))
      const scoreB = b.percentage * (0.7 + 0.3 * getSaturation(b.rgb))
      return scoreB - scoreA
    })
}

/**
 * 이미지에서 주요 색상 추출
 */
export async function extractColors(
  imageSource: HTMLImageElement | HTMLCanvasElement | string,
  options: ColorExtractionOptions = {}
): Promise<ExtractedColor[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // 이미지 로드
  let image: HTMLImageElement | HTMLCanvasElement

  if (typeof imageSource === 'string') {
    image = await loadImage(imageSource)
  } else {
    image = imageSource
  }

  // Canvas에서 픽셀 데이터 추출
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  // 성능을 위해 이미지 크기 제한
  const maxDimension = 200
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height))
  canvas.width = Math.floor(image.width * scale)
  canvas.height = Math.floor(image.height * scale)

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

  // Worker는 ml-kmeans와 호환되지 않으므로 메인 스레드에서 처리
  return extractColorsFromImageData(imageData, {
    colorCount: opts.colorCount,
    quality: opts.quality,
    maxIterations: opts.maxIterations,
    sampleSize: opts.sampleSize,
  })
}

/**
 * URL에서 이미지 로드
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * 색상의 상대적 밝기 계산 (WCAG)
 */
export function getRelativeLuminance(rgb: RGB): number {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * 두 색상 간 대비율 계산 (WCAG)
 */
export function getContrastRatio(rgb1: RGB, rgb2: RGB): number {
  const l1 = getRelativeLuminance(rgb1)
  const l2 = getRelativeLuminance(rgb2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}
