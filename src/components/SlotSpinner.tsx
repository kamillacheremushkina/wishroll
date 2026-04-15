import { useRef, useState, forwardRef, useImperativeHandle } from 'react'

import bridgeImg from '../assets/spinner/bridge.svg'
import isaacImg from '../assets/spinner/isaac.svg'
import lightImg from '../assets/spinner/light.svg'
import petropavlovImg from '../assets/spinner/petropavlov.svg'
import statueImg from '../assets/spinner/statue.svg'

type SlotSpinnerProps = {
  categories: number[]
  onFinish: () => void
  canSpin: boolean
}

const spinnerImages = [
  bridgeImg,
  isaacImg,
  lightImg,
  petropavlovImg,
  statueImg,
]

function shuffle<T>(arr: T[]) {
  return [...arr].sort(() => Math.random() - 0.5)
}

function pickRandom<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}

const SlotSpinner = forwardRef(({ onFinish }: SlotSpinnerProps, ref) => {
  const doorsRef = useRef<HTMLDivElement[]>([])
  const [isSpinning, setIsSpinning] = useState(false)

  async function spin() {
    if (isSpinning) return

    setIsSpinning(true)

    const winningImage = pickRandom(spinnerImages)

    for (let i = 0; i < doorsRef.current.length; i++) {
      const door = doorsRef.current[i]
      const boxes = door.querySelector('.boxes')

      if (!boxes || !(boxes instanceof HTMLDivElement)) continue

      const cyclesCount = 4 + i
      let pool: string[] = []

      for (let cycle = 0; cycle < cyclesCount; cycle++) {
        pool.push(...shuffle(spinnerImages))
      }

      pool.push(winningImage)

      boxes.innerHTML = ''

      pool.forEach((imageSrc) => {
        const el = document.createElement('div')
        el.style.width = '100%'
        el.style.height = '100%'
        el.style.flexShrink = '0'
        el.style.display = 'flex'
        el.style.alignItems = 'flex-end'
        el.style.justifyContent = 'center'
        el.style.boxSizing = 'border-box'
        el.style.padding = '12% 10% 4%'

        const img = document.createElement('img')
        img.src = imageSrc
        img.alt = ''
        img.style.width = '100%'
        img.style.height = '100%'
        img.style.objectFit = 'contain'
        img.style.display = 'block'
        img.draggable = false

        el.appendChild(img)
        boxes.appendChild(el)
      })

      const height = door.clientHeight
      const finalPosition = height * (pool.length - 1)

      boxes.style.transition = 'none'
      boxes.style.transform = 'translateY(0)'

      setTimeout(() => {
        boxes.style.transition = `transform ${3 + i * 1.2}s cubic-bezier(0.2, 0.8, 0.2, 1)`
        boxes.style.transform = `translateY(-${finalPosition}px)`
      }, 50)
    }

    setTimeout(() => {
      setTimeout(() => {
        setIsSpinning(false)
        onFinish()
      }, 1000)
    }, 5600)
  }

  useImperativeHandle(ref, () => ({
    spin,
  }))

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div
        style={{
          display: 'flex',
          gap: '4%',
          width: '100%',
          maxWidth: 340,
          justifyContent: 'center',
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            ref={(el) => {
              if (el) doorsRef.current[i] = el
            }}
            style={{
              flex: 1,
              aspectRatio: '9 / 16',
              overflow: 'hidden',
              borderRadius: 12,
              position: 'relative',
            }}
          >
            <div
              className="boxes"
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                willChange: 'transform',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
})

export default SlotSpinner