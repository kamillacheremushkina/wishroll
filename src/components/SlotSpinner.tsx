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
          el.className = 'box'
          el.innerHTML = `<img src="${categoryImages[cat]}" />`
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

    // 🔑 Делаем spin доступным снаружи
    useImperativeHandle(ref, () => ({
      spin,
    }))

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              ref={(el) => {
                if (el) doorsRef.current[i] = el
              }}
              style={{
                width: 100,
                height: 100,
                overflow: 'hidden',
                borderRadius: 20,
                background: '#fff',
              }}
            >
              <div className="boxes" />
            </div>
          ))}
        </div>
      </div>
    )
  }
)

export default SlotSpinner