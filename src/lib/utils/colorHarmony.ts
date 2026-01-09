/**
 * 색상 조화 및 가독성 유틸리티
 */

import { getContrastRatio, getRelativeLuminance } from './colorExtractor'
import type { RGB, ExtractedColor } from './colorExtractor'

export interface HSL {
  h: number
  s: number
  l: number
}

export interface BannerColors {
  background: string
  backgroundRgb: RGB
  text: string
  textRgb: RGB
  gradient?: string
  accent?: string
}

/**
 * RGB를 HSL로 변환
 */
export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return { h: h * 360, s, l }
}

/**
 * HSL을 RGB로 변환
 */
export function hslToRgb(hsl: HSL): RGB {
  const { h, s, l } = hsl
  const hue = h / 360

  if (s === 0) {
    const val = Math.round(l * 255)
    return { r: val, g: val, b: val }
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q

  return {
    r: Math.round(hue2rgb(p, q, hue + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hue) * 255),
    b: Math.round(hue2rgb(p, q, hue - 1 / 3) * 255),
  }
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
 * 색상 밝기 조정
 */
export function adjustLightness(rgb: RGB, amount: number): RGB {
  const hsl = rgbToHsl(rgb)
  hsl.l = Math.max(0, Math.min(1, hsl.l + amount))
  return hslToRgb(hsl)
}

/**
 * 색상 채도 조정
 */
export function adjustSaturation(rgb: RGB, amount: number): RGB {
  const hsl = rgbToHsl(rgb)
  hsl.s = Math.max(0, Math.min(1, hsl.s + amount))
  return hslToRgb(hsl)
}

/**
 * WCAG AA 기준 대비율을 만족하는 텍스트 색상 찾기
 * AA 기준: 일반 텍스트 4.5:1, 큰 텍스트 3:1
 */
export function findReadableTextColor(
  backgroundColor: RGB,
  minContrastRatio: number = 4.5
): RGB {
  const bgLuminance = getRelativeLuminance(backgroundColor)

  // 먼저 순수 흰색/검정 테스트
  const white: RGB = { r: 255, g: 255, b: 255 }
  const black: RGB = { r: 0, g: 0, b: 0 }

  const whiteContrast = getContrastRatio(backgroundColor, white)
  const blackContrast = getContrastRatio(backgroundColor, black)

  // 기본 흰색/검정 중 대비가 더 좋은 것 선택
  if (whiteContrast >= minContrastRatio && whiteContrast >= blackContrast) {
    return white
  }
  if (blackContrast >= minContrastRatio) {
    return black
  }

  // 대비율이 충분하지 않으면 밝기 조정
  const hsl = rgbToHsl(backgroundColor)

  // 배경이 어두우면 밝은 텍스트, 밝으면 어두운 텍스트
  if (bgLuminance < 0.5) {
    // 밝은 색상 찾기
    for (let l = 1; l >= 0.5; l -= 0.05) {
      const testColor = hslToRgb({ h: hsl.h, s: Math.min(0.1, hsl.s), l })
      if (getContrastRatio(backgroundColor, testColor) >= minContrastRatio) {
        return testColor
      }
    }
    return white
  } else {
    // 어두운 색상 찾기
    for (let l = 0; l <= 0.5; l += 0.05) {
      const testColor = hslToRgb({ h: hsl.h, s: Math.min(0.1, hsl.s), l })
      if (getContrastRatio(backgroundColor, testColor) >= minContrastRatio) {
        return testColor
      }
    }
    return black
  }
}

/**
 * 배너에 적합한 배경색 선택
 * 너무 밝거나 어두운 색상은 조정
 */
export function selectBannerBackground(
  colors: ExtractedColor[],
  preferDark: boolean = false
): ExtractedColor | null {
  if (colors.length === 0) return null

  // 점수 기반 색상 선택
  const scoredColors = colors.map(color => {
    const hsl = rgbToHsl(color.rgb)
    let score = color.percentage

    // 채도가 적당히 있는 색상 선호
    if (hsl.s > 0.2 && hsl.s < 0.8) {
      score *= 1.3
    }

    // 너무 밝거나 어두운 색상 페널티
    if (hsl.l < 0.15 || hsl.l > 0.85) {
      score *= 0.5
    }

    // 선호도에 따른 밝기 보너스
    if (preferDark && hsl.l < 0.5) {
      score *= 1.2
    } else if (!preferDark && hsl.l > 0.3 && hsl.l < 0.7) {
      score *= 1.2
    }

    return { color, score }
  })

  // 가장 높은 점수의 색상 선택
  scoredColors.sort((a, b) => b.score - a.score)
  return scoredColors[0].color
}

/**
 * 두 색상 사이의 그라데이션 CSS 생성
 */
export function createGradient(
  colors: ExtractedColor[],
  direction: 'horizontal' | 'vertical' | 'diagonal' = 'horizontal'
): string {
  if (colors.length === 0) return 'transparent'
  if (colors.length === 1) return colors[0].hex

  const directionMap = {
    horizontal: 'to right',
    vertical: 'to bottom',
    diagonal: 'to bottom right',
  }

  // 최대 3개 색상 사용
  const selectedColors = colors.slice(0, 3)
  const stops = selectedColors
    .map((c, i) => {
      const position = (i / (selectedColors.length - 1)) * 100
      return `${c.hex} ${position}%`
    })
    .join(', ')

  return `linear-gradient(${directionMap[direction]}, ${stops})`
}

/**
 * 색상의 부드러운 그라데이션 생성 (단일 색상 기반)
 */
export function createSoftGradient(
  baseColor: RGB,
  direction: 'horizontal' | 'vertical' | 'diagonal' = 'horizontal'
): string {
  const hsl = rgbToHsl(baseColor)

  // 색상의 밝기/채도 변형으로 그라데이션 생성
  const color1 = hslToRgb({
    h: hsl.h,
    s: Math.min(1, hsl.s * 1.1),
    l: Math.min(0.9, hsl.l * 1.15),
  })
  const color2 = baseColor
  const color3 = hslToRgb({
    h: (hsl.h + 10) % 360,
    s: hsl.s,
    l: Math.max(0.1, hsl.l * 0.85),
  })

  const directionMap = {
    horizontal: 'to right',
    vertical: 'to bottom',
    diagonal: 'to bottom right',
  }

  return `linear-gradient(${directionMap[direction]}, ${rgbToHex(color1)}, ${rgbToHex(color2)}, ${rgbToHex(color3)})`
}

/**
 * 추출된 색상에서 배너 색상 세트 생성
 */
export function generateBannerColors(
  extractedColors: ExtractedColor[],
  options: {
    preferDark?: boolean
    useGradient?: boolean
    gradientDirection?: 'horizontal' | 'vertical' | 'diagonal'
  } = {}
): BannerColors {
  const {
    preferDark = false,
    useGradient = true,
    gradientDirection = 'horizontal',
  } = options

  // 기본 배경색 선택
  const selectedBg = selectBannerBackground(extractedColors, preferDark)

  if (!selectedBg) {
    // 색상을 추출할 수 없으면 기본값
    return {
      background: '#1a1a1a',
      backgroundRgb: { r: 26, g: 26, b: 26 },
      text: '#ffffff',
      textRgb: { r: 255, g: 255, b: 255 },
    }
  }

  const backgroundRgb = selectedBg.rgb
  const textRgb = findReadableTextColor(backgroundRgb)

  const result: BannerColors = {
    background: selectedBg.hex,
    backgroundRgb,
    text: rgbToHex(textRgb),
    textRgb,
  }

  // 그라데이션 옵션
  if (useGradient) {
    if (extractedColors.length >= 2) {
      // 여러 색상이 있으면 추출된 색상으로 그라데이션
      result.gradient = createGradient(
        extractedColors.slice(0, 3),
        gradientDirection
      )
    } else {
      // 단일 색상 기반 부드러운 그라데이션
      result.gradient = createSoftGradient(backgroundRgb, gradientDirection)
    }
  }

  // 악센트 색상 (두 번째로 빈번한 색상)
  if (extractedColors.length >= 2) {
    result.accent = extractedColors[1].hex
  }

  return result
}

/**
 * 색상이 어두운지 판별
 */
export function isDark(rgb: RGB): boolean {
  return getRelativeLuminance(rgb) < 0.5
}

/**
 * 반투명 배경을 위한 rgba 문자열 생성
 */
export function toRgba(rgb: RGB, alpha: number): string {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}
