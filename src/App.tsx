import { useState } from 'react'
import { Chamelo } from './lib'
import './App.css'

// 샘플 이미지 URL들
const sampleImages = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
  'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800',
]

function App() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [bannerStyle, setBannerStyle] = useState<'solid' | 'gradient' | 'blur'>('gradient')
  const [position, setPosition] = useState<'top' | 'bottom'>('bottom')
  const [customUrl, setCustomUrl] = useState('')

  const currentImage = customUrl || sampleImages[currentImageIndex]

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % sampleImages.length)
    setCustomUrl('')
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + sampleImages.length) % sampleImages.length)
    setCustomUrl('')
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-center">Chamelo</h1>
        <p className="text-gray-400 text-center mb-8">
          카멜레온처럼 이미지에 적응하는 배너 컴포넌트
        </p>

        {/* 컨트롤 패널 */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 배너 스타일 */}
            <div>
              <label className="block text-sm font-medium mb-2">배너 스타일</label>
              <select
                value={bannerStyle}
                onChange={(e) => setBannerStyle(e.target.value as 'solid' | 'gradient' | 'blur')}
                className="w-full bg-gray-700 rounded px-3 py-2"
              >
                <option value="solid">단색</option>
                <option value="gradient">그라데이션</option>
                <option value="blur">블러</option>
              </select>
            </div>

            {/* 위치 */}
            <div>
              <label className="block text-sm font-medium mb-2">배너 위치</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as 'top' | 'bottom')}
                className="w-full bg-gray-700 rounded px-3 py-2"
              >
                <option value="bottom">하단</option>
                <option value="top">상단</option>
              </select>
            </div>

            {/* 이미지 네비게이션 */}
            <div>
              <label className="block text-sm font-medium mb-2">샘플 이미지</label>
              <div className="flex gap-2">
                <button
                  onClick={prevImage}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 rounded px-3 py-2"
                >
                  이전
                </button>
                <button
                  onClick={nextImage}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 rounded px-3 py-2"
                >
                  다음
                </button>
              </div>
            </div>
          </div>

          {/* 커스텀 URL 입력 */}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">커스텀 이미지 URL</label>
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="이미지 URL을 입력하세요..."
              className="w-full bg-gray-700 rounded px-3 py-2"
            />
          </div>
        </div>

        {/* 메인 배너 데모 */}
        <div className="rounded-lg overflow-hidden shadow-2xl mb-8">
          <Chamelo
            imageSrc={currentImage}
            text="이미지에서 자동으로 추출된 색상으로 배너가 생성됩니다"
            position={position}
            bannerStyle={bannerStyle}
            bannerHeight={100}
            fontSize={16}
            colorCount={5}
            imageAlt="Demo image"
            onColorsExtracted={(colors) => {
              console.log('추출된 색상:', colors)
            }}
          />
        </div>

        {/* 다양한 스타일 비교 */}
        <h2 className="text-xl font-semibold mb-4">스타일 비교</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg overflow-hidden">
            <p className="text-sm text-gray-400 mb-2">단색 (Solid)</p>
            <Chamelo
              imageSrc={currentImage}
              text="단색 배너"
              bannerStyle="solid"
              bannerHeight={60}
              fontSize={14}
              colorCount={3}
            />
          </div>
          <div className="rounded-lg overflow-hidden">
            <p className="text-sm text-gray-400 mb-2">그라데이션 (Gradient)</p>
            <Chamelo
              imageSrc={currentImage}
              text="그라데이션 배너"
              bannerStyle="gradient"
              bannerHeight={60}
              fontSize={14}
              colorCount={5}
            />
          </div>
          <div className="rounded-lg overflow-hidden">
            <p className="text-sm text-gray-400 mb-2">블러 (Blur)</p>
            <Chamelo
              imageSrc={currentImage}
              text="블러 배너"
              bannerStyle="blur"
              bannerHeight={60}
              fontSize={14}
              colorCount={5}
            />
          </div>
        </div>

        {/* 사용법 */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">사용법</h2>
          <pre className="bg-gray-900 rounded p-4 overflow-x-auto text-sm">
{`import { Chamelo } from 'chamelo'

<Chamelo
  imageSrc="/your-image.jpg"
  text="이미지 설명 텍스트"
  position="bottom"
  bannerStyle="gradient"
  colorCount={5}
/>`}
          </pre>
        </div>
      </div>
    </div>
  )
}

export default App
