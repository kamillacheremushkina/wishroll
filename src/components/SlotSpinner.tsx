import { useRef, useState, forwardRef, useImperativeHandle } from 'react'

type SlotSpinnerProps = {
  categories: number[]
  onFinish: () => void
  canSpin: boolean
}

const slotLabels = ['1', '2', '3']

function shuffle(arr: string[]) {
  return [...arr].sort(() => Math.random() - 0.5)
}

const SlotSpinner = forwardRef(({ onFinish }: SlotSpinnerProps, ref) => {
  const doorsRef = useRef<HTMLDivElement[]>([])
  const [isSpinning, setIsSpinning] = useState(false)

  async function spin() {
    if (isSpinning) return
    setIsSpinning(true)

    for (let i = 0; i < doorsRef.current.length; i++) {
      const door = doorsRef.current[i]
      const boxes = door.querySelector('.boxes')

      if (!boxes || !(boxes instanceof HTMLDivElement)) continue

      const pool = shuffle(slotLabels)
      pool.push(slotLabels[i])

      boxes.innerHTML = ''

      pool.forEach((label) => {
        const el = document.createElement('div')
        el.style.width = '100%'
        el.style.height = '100%'
        el.style.flexShrink = '0'
        el.style.display = 'flex'
        el.style.alignItems = 'center'
        el.style.justifyContent = 'center'
        el.style.boxSizing = 'border-box'
        el.style.fontSize = 'clamp(24px, 7vw, 44px)'
        el.style.fontWeight = '700'
        el.style.lineHeight = '1'
        el.style.color = '#125BEC'
        el.textContent = label
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
    <div
      style={{
        width: '100%',
        height: '100%',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            ref={(el) => {
              if (el) doorsRef.current[i] = el
            }}
            style={{
              width: '30.6%',
              height: '100%',
              overflow: 'hidden',
              borderRadius: 12,
              background: '#FFFFFF',
              flexShrink: 0,
            }}
          >
            <div
              className="boxes"
              style={{
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