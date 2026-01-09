import { useState, useEffect, useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useColorExtraction } from '../hooks/useColorExtraction'
import { toRgba } from '../utils/colorHarmony'

export interface ChameloProps {
  /** 이미지 소스 URL */
  imageSrc: string
  /** 배너 텍스트 */
  text?: string
  /** 배너 위치 */
  position?: 'top' | 'bottom'
  /** 추출할 색상 수 (기본: 5) */
  colorCount?: number
  /** 배너 스타일 */
  bannerStyle?: 'solid' | 'gradient' | 'blur'
  /** 그라데이션 방향 */
  gradientDirection?: 'horizontal' | 'vertical' | 'diagonal'
  /** 배너 높이 (px 또는 %) */
  bannerHeight?: number | string
  /** 텍스트 크기 */
  fontSize?: number | string
  /** 텍스트 정렬 */
  textAlign?: 'left' | 'center' | 'right'
  /** 배너 투명도 (0-1) */
  opacity?: number
  /** 커스텀 렌더 함수 */
  renderContent?: (colors: { background: string; text: string }) => ReactNode
  /** 어두운 배경 선호 */
  preferDark?: boolean
  /** 이미지 alt 텍스트 */
  imageAlt?: string
  /** 컨테이너 className */
  className?: string
  /** 이미지 className */
  imageClassName?: string
  /** 배너 className */
  bannerClassName?: string
  /** 이미지 object-fit */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none'
  /** 로딩 중 표시 여부 */
  showLoading?: boolean
  /** 색상 추출 완료 콜백 */
  onColorsExtracted?: (colors: { background: string; text: string }) => void
}

export function Chamelo({
  imageSrc,
  text,
  position = 'bottom',
  colorCount = 5,
  bannerStyle = 'gradient',
  gradientDirection = 'horizontal',
  bannerHeight = 80,
  fontSize = 16,
  textAlign = 'center',
  opacity = 0.6,
  renderContent,
  preferDark = false,
  imageAlt = '',
  className = '',
  imageClassName = '',
  bannerClassName = '',
  objectFit = 'cover',
  showLoading = true,
  onColorsExtracted,
}: ChameloProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [currentSrc, setCurrentSrc] = useState<string | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const { bannerColors, isLoading, colors: extractedColors } = useColorExtraction(currentSrc, {
    colorCount,
    preferDark,
    useGradient: bannerStyle === 'gradient',
    gradientDirection,
  })

  // 이미지 로드 완료 후 색상 추출 시작
  useEffect(() => {
    if (imageLoaded && imageSrc) {
      setCurrentSrc(imageSrc)
    }
  }, [imageLoaded, imageSrc])

  // 색상 추출 완료 콜백
  useEffect(() => {
    if (bannerColors && onColorsExtracted) {
      onColorsExtracted({
        background: bannerColors.background,
        text: bannerColors.text,
      })
    }
  }, [bannerColors, onColorsExtracted])

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  // 반투명 그라데이션 생성
  const createTransparentGradient = (): string => {
    if (!extractedColors || extractedColors.length === 0) {
      return `rgba(0, 0, 0, ${opacity})`
    }

    const directionMap = {
      horizontal: 'to right',
      vertical: 'to bottom',
      diagonal: 'to bottom right',
    }

    const selectedColors = extractedColors.slice(0, 3)
    const stops = selectedColors
      .map((c, i) => {
        const position = (i / (selectedColors.length - 1)) * 100
        return `rgba(${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b}, ${opacity}) ${position}%`
      })
      .join(', ')

    return `linear-gradient(${directionMap[gradientDirection]}, ${stops})`
  }

  // 배너 배경 스타일 계산
  const getBannerBackground = (): string => {
    if (!bannerColors) return `rgba(0, 0, 0, ${opacity})`

    switch (bannerStyle) {
      case 'gradient':
        return createTransparentGradient()
      case 'blur':
        return toRgba(bannerColors.backgroundRgb, opacity * 0.5)
      case 'solid':
      default:
        return toRgba(bannerColors.backgroundRgb, opacity)
    }
  }

  const containerStyle: CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
  }

  const imageStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit,
    display: 'block',
  }

  const bannerStyle_: CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    [position]: 0,
    height: typeof bannerHeight === 'number' ? `${bannerHeight}px` : bannerHeight,
    background: getBannerBackground(),
    color: bannerColors?.text || '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      textAlign === 'left'
        ? 'flex-start'
        : textAlign === 'right'
          ? 'flex-end'
          : 'center',
    padding: '0 20px',
    fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize,
    transition: 'background 0.3s ease, color 0.3s ease',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  }

  const loadingOverlayStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.3)',
    opacity: isLoading ? 1 : 0,
    transition: 'opacity 0.3s ease',
    pointerEvents: 'none',
  }

  return (
    <div className={`chamelo ${className}`} style={containerStyle}>
      <img
        ref={imgRef}
        src={imageSrc}
        alt={imageAlt}
        onLoad={handleImageLoad}
        className={imageClassName}
        style={imageStyle}
        crossOrigin="anonymous"
      />

      {imageLoaded && (
        <div className={`chamelo__overlay ${bannerClassName}`} style={bannerStyle_}>
          {renderContent ? (
            renderContent({
              background: bannerColors?.background || '#000000',
              text: bannerColors?.text || '#ffffff',
            })
          ) : (
            <span
              style={{
                textAlign,
                width: '100%',
                textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                fontWeight: 500,
              }}
            >
              {text}
            </span>
          )}
        </div>
      )}

      {showLoading && isLoading && (
        <div style={loadingOverlayStyle}>
          <div
            className="chamelo__spinner"
            style={{
              width: 24,
              height: 24,
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#ffffff',
              borderRadius: '50%',
              animation: 'chamelo-spin 0.8s linear infinite',
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes chamelo-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
