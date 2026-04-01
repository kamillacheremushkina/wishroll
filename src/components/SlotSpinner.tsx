import { useRef, useState, forwardRef, useImperativeHandle } from 'react'
import foodIcon from '../assets/еда.svg'
import barsIcon from '../assets/бары.svg'
import cultureIcon from '../assets/культура.svg'
import shoppingIcon from '../assets/шоппинг.svg'
import coworkIcon from '../assets/ко_ворк.svg'
import walksIcon from '../assets/пешие_прогулки.svg'
import funIcon from '../assets/развлечение.svg'
import nightlifeIcon from '../assets/ночная_жизнь.svg'

type SlotSpinnerProps = {
  categories: number[]
  onFinish: () => void
  canSpin: boolean
}

const categoryImages: Record<number, string> = {
  1: foodIcon,
  2: barsIcon,
  3: cultureIcon,
  4: shoppingIcon,
  5: coworkIcon,
  6: walksIcon,
  7: funIcon,
  8: nightlifeIcon,
}

function shuffle(arr: number[]) {
  return [...arr].sort(() => Math.random() - 0.5)
}

const SlotSpinner = forwardRef(
  ({ categories, onFinish, canSpin }: SlotSpinnerProps, ref) => {
    const doorsRef = useRef<HTMLDivElement[]>([])
    const [isSpinning, setIsSpinning] = useState(false)

    async function spin() {
      if (isSpinning) return
      setIsSpinning(true)

      const allCategories = Object.keys(categoryImages).map(Number)

      for (let i = 0; i < doorsRef.current.length; i++) {
        const door = doorsRef.current[i]
        const boxes = door.querySelector('.boxes')

        if (!boxes || !(boxes instanceof HTMLDivElement)) continue

        let pool = shuffle(allCategories)
        pool = pool.filter((cat) => cat !== categories[i])
        pool.push(categories[i])

        boxes.innerHTML = ''

        pool.forEach((cat) => {
          const el = document.createElement('div')
          // Force strict dimensions so the translation math is perfect
          el.style.width = '100%'
          el.style.height = '100%'
          el.style.flexShrink = '0'
          el.style.display = 'flex'
          el.style.alignItems = 'center'
          el.style.justifyContent = 'center'
          el.style.padding = '20%' // Inner spacing for icons
          el.style.boxSizing = 'border-box'

          const img = document.createElement('img')
          img.src = categoryImages[cat]
          img.style.width = '100%'
          img.style.height = '100%'
          img.style.objectFit = 'contain'

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
        setTimeout(onFinish, 1000)
      }, 5600)
    }

    useImperativeHandle(ref, () => ({
      spin,
    }))

    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: '4%', width: '100%', maxWidth: 340, justifyContent: 'center' }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              ref={(el) => {
                if (el) doorsRef.current[i] = el
              }}
              style={{
                flex: 1,
                aspectRatio: '1 / 1', // Perfect square regardless of screen width
                maxWidth: 100,
                overflow: 'hidden',   // Masks the spinning track
                borderRadius: 20,
                background: '#fff',
                position: 'relative',
              }}
            >
              <div
                className="boxes"
                style={{
                  height: '100%', // Each child will match this height
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
  }
)

export default SlotSpinner