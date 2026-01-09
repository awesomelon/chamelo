/**
 * K-means 색상 추출 Web Worker
 * 메인 스레드 블로킹을 방지하기 위해 색상 추출 연산을 별도 스레드에서 수행
 */

interface RGB {
  r: number
  g: number
  b: number
}

interface ExtractedColor {
  rgb: RGB
  hex: string
  population: number
  percentage: number
}

interface WorkerMessage {
  type: 'extract'
  imageData: ImageData
  options: {
    colorCount: number
    quality: number
    maxIterations: number
    sampleSize: number
  }
}

interface WorkerResponse {
  type: 'result' | 'error'
  colors?: ExtractedColor[]
  error?: string
}

function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`
}

function colorDistance(c1: RGB, c2: RGB): number {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  )
}

function getPixelsFromImageData(
  imageData: ImageData,
  quality: number,
  sampleSize: number
): RGB[] {
  const pixels: RGB[] = []
  const data = imageData.data
  const pixelCount = imageData.width * imageData.height
  const step = Math.max(1, Math.floor(pixelCount / sampleSize) * quality)

  for (let i = 0; i < data.length; i += 4 * step) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]

    if (a >= 125) {
      if (!(r > 250 && g > 250 && b > 250) && !(r < 5 && g < 5 && b < 5)) {
        pixels.push({ r, g, b })
      }
    }
  }

  return pixels
}

function initializeCentroidsKMeansPlusPlus(pixels: RGB[], k: number): RGB[] {
  if (pixels.length === 0) return []

  const centroids: RGB[] = []
  const firstIndex = Math.floor(Math.random() * pixels.length)
  centroids.push({ ...pixels[firstIndex] })

  while (centroids.length < k) {
    const distances: number[] = []
    let totalDistance = 0

    for (const pixel of pixels) {
      let minDist = Infinity
      for (const centroid of centroids) {
        const dist = colorDistance(pixel, centroid)
        if (dist < minDist) minDist = dist
      }
      distances.push(minDist * minDist)
      totalDistance += minDist * minDist
    }

    const random = Math.random() * totalDistance
    let sum = 0
    for (let i = 0; i < pixels.length; i++) {
      sum += distances[i]
      if (sum >= random) {
        centroids.push({ ...pixels[i] })
        break
      }
    }

    if (centroids.length < Math.min(k, pixels.length)) {
      centroids.push({ ...pixels[pixels.length - 1] })
    }
  }

  return centroids
}

function assignToClusters(pixels: RGB[], centroids: RGB[]): number[] {
  return pixels.map(pixel => {
    let minDist = Infinity
    let closestIndex = 0

    for (let i = 0; i < centroids.length; i++) {
      const dist = colorDistance(pixel, centroids[i])
      if (dist < minDist) {
        minDist = dist
        closestIndex = i
      }
    }

    return closestIndex
  })
}

function updateCentroids(
  pixels: RGB[],
  assignments: number[],
  k: number
): { centroids: RGB[]; counts: number[] } {
  const sums: { r: number; g: number; b: number }[] = Array.from(
    { length: k },
    () => ({ r: 0, g: 0, b: 0 })
  )
  const counts: number[] = Array(k).fill(0)

  for (let i = 0; i < pixels.length; i++) {
    const clusterIndex = assignments[i]
    sums[clusterIndex].r += pixels[i].r
    sums[clusterIndex].g += pixels[i].g
    sums[clusterIndex].b += pixels[i].b
    counts[clusterIndex]++
  }

  const centroids: RGB[] = sums.map((sum, i) => {
    if (counts[i] === 0) {
      return { r: 128, g: 128, b: 128 }
    }
    return {
      r: Math.round(sum.r / counts[i]),
      g: Math.round(sum.g / counts[i]),
      b: Math.round(sum.b / counts[i]),
    }
  })

  return { centroids, counts }
}

function kMeansClustering(
  pixels: RGB[],
  k: number,
  maxIterations: number
): { centroids: RGB[]; counts: number[] } {
  if (pixels.length === 0) {
    return { centroids: [], counts: [] }
  }

  const actualK = Math.min(k, pixels.length)
  let centroids = initializeCentroidsKMeansPlusPlus(pixels, actualK)
  let assignments: number[] = []
  let counts: number[] = []

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const newAssignments = assignToClusters(pixels, centroids)

    if (
      assignments.length > 0 &&
      newAssignments.every((a, i) => a === assignments[i])
    ) {
      break
    }

    assignments = newAssignments
    const result = updateCentroids(pixels, assignments, actualK)
    centroids = result.centroids
    counts = result.counts
  }

  return { centroids, counts }
}

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

function extractColorsFromImageData(
  imageData: ImageData,
  options: WorkerMessage['options']
): ExtractedColor[] {
  const pixels = getPixelsFromImageData(
    imageData,
    options.quality,
    options.sampleSize
  )

  if (pixels.length === 0) {
    return []
  }

  const { centroids, counts } = kMeansClustering(
    pixels,
    options.colorCount,
    options.maxIterations
  )

  const totalPixels = counts.reduce((a, b) => a + b, 0)

  const colors: ExtractedColor[] = centroids
    .map((centroid, i) => ({
      rgb: centroid,
      hex: rgbToHex(centroid),
      population: counts[i],
      percentage: totalPixels > 0 ? (counts[i] / totalPixels) * 100 : 0,
    }))
    .filter(c => c.population > 0)
    .sort((a, b) => {
      const scoreA = a.percentage * (0.7 + 0.3 * getSaturation(a.rgb))
      const scoreB = b.percentage * (0.7 + 0.3 * getSaturation(b.rgb))
      return scoreB - scoreA
    })

  return colors
}

// Worker 메시지 핸들러
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, imageData, options } = event.data

  if (type === 'extract') {
    try {
      const colors = extractColorsFromImageData(imageData, options)
      const response: WorkerResponse = { type: 'result', colors }
      self.postMessage(response)
    } catch (error) {
      const response: WorkerResponse = {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
      self.postMessage(response)
    }
  }
}

export {}
