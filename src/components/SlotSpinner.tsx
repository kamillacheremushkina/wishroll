import { useRef, useState } from 'react'
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
  setCanSpin: (value: boolean) => void
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

export default function SlotSpinner({ categories, onFinish, canSpin }: SlotSpinnerProps) {
  const doorsRef = useRef<HTMLDivElement[]>([])
  const [isSpinning, setIsSpinning] = useState(false)

  async function spin() {
    if (isSpinning || !canSpin) return

    setIsSpinning(true)

    const allCategories = Object.keys(categoryImages).map(Number)

    for (let i = 0; i < doorsRef.current.length; i++) {
      const door = doorsRef.current[i]
      const boxes = door.querySelector('.boxes') as HTMLDivElement

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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
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

      <button
        onClick={spin}
        disabled={isSpinning || !canSpin}
        style={{
          marginTop: 32,
          width: '100%',
          maxWidth: 240,
          padding: '16px',
          borderRadius: 20,
          border: 'none',
          fontSize: 18,
          fontWeight: 600,
          color: '#fff',
          cursor: isSpinning ? 'default' : 'pointer',
          opacity: isSpinning ? 0.5 : 1,
          background:
            'linear-gradient(90deg, #F7D420 0%, #FA804B 25%, #FA6E5E 50%, #F75B8B 75%, #A96BD8 100%)',
        }}
      >
        {isSpinning ? 'Что же...' : 'Крутить'}
      </button>
    </div>
  )
}