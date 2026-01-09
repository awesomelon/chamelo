import { useState, useEffect, useCallback, useRef } from 'react'
import { extractColors } from '../utils/colorExtractor'
import type { ExtractedColor, ColorExtractionOptions } from '../utils/colorExtractor'
import { generateBannerColors } from '../utils/colorHarmony'
import type { BannerColors } from '../utils/colorHarmony'

export interface UseColorExtractionOptions extends ColorExtractionOptions {
  preferDark?: boolean
  useGradient?: boolean
  gradientDirection?: 'horizontal' | 'vertical' | 'diagonal'
}

export interface UseColorExtractionResult {
  colors: ExtractedColor[]
  bannerColors: BannerColors | null
  isLoading: boolean
  error: Error | null
  refresh: () => void
}

/**
 * 이미지에서 색상을 추출하는 React 훅
 */
export function useColorExtraction(
  imageSrc: string | HTMLImageElement | null,
  options: UseColorExtractionOptions = {}
): UseColorExtractionResult {
  const [colors, setColors] = useState<ExtractedColor[]>([])
  const [bannerColors, setBannerColors] = useState<BannerColors | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const lastSrcRef = useRef<string | HTMLImageElement | null>(null)
  const mountedRef = useRef(true)

  const {
    preferDark = false,
    useGradient = true,
    gradientDirection = 'horizontal',
    ...extractionOptions
  } = options

  const extract = useCallback(async () => {
    if (!imageSrc) {
      setColors([])
      setBannerColors(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const extractedColors = await extractColors(imageSrc, extractionOptions)

      if (!mountedRef.current) return

      setColors(extractedColors)

      const bannerColorSet = generateBannerColors(extractedColors, {
        preferDark,
        useGradient,
        gradientDirection,
      })

      if (!mountedRef.current) return

      setBannerColors(bannerColorSet)
    } catch (err) {
      if (!mountedRef.current) return
      setError(err instanceof Error ? err : new Error('Color extraction failed'))
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [imageSrc, preferDark, useGradient, gradientDirection])

  useEffect(() => {
    mountedRef.current = true

    // imageSrc가 변경되었을 때만 추출
    const srcKey = typeof imageSrc === 'string' ? imageSrc : imageSrc?.src
    const lastSrcKey =
      typeof lastSrcRef.current === 'string'
        ? lastSrcRef.current
        : lastSrcRef.current?.src

    if (srcKey !== lastSrcKey) {
      lastSrcRef.current = imageSrc
      extract()
    }

    return () => {
      mountedRef.current = false
    }
  }, [imageSrc, extract])

  const refresh = useCallback(() => {
    extract()
  }, [extract])

  return {
    colors,
    bannerColors,
    isLoading,
    error,
    refresh,
  }
}
