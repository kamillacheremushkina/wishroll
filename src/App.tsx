import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'
import { vibes } from './constants/vibes'
import { categories } from './constants/categories'
import PlaceCard from './components/PlaceCard'
import SlotSpinner from './components/SlotSpinner'
import heroText from './assets/hero-text.svg'
import heroWheel from './assets/hero-wheel.svg'
import rulesWheel from './assets/rules-wheel.svg'
import rulesImage from './assets/rules-image.svg'
import categoriesImage from './assets/categories-image.svg'
import spinImage from './assets/spin-image.svg'


const screenBackground = 'linear-gradient(180deg, #FFFFFF 0%, #F6F6F6 100%)'

function App() {
  function getOrCreateUID() {
    let uid = localStorage.getItem('uid')

    if (!uid) {
      uid = crypto.randomUUID()
      localStorage.setItem('uid', uid)
    }

    return uid
  }

  const [places, setPlaces] = useState<any[]>([])
  const [copied, setCopied] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<number[]>([])
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null)
  const [screen, setScreen] = useState<'start' | 'rules' | 'vibe' | 'categories' | 'spinner' | 'result'>('start')
  const [isLoading, setIsLoading] = useState(false)
  const [spinsLeft, setSpinsLeft] = useState<number | null>(null)
  const [canSpin, setCanSpin] = useState(true)
  const [spinErrorMessage, setSpinErrorMessage] = useState('')
  const [uid, setUid] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(true)
  const spinnerRef = useRef<any>(null)

  async function getPlacesForSpin() {
    if (!selectedVibe || selectedCategories.length !== 3) {
      return null
    }

    setIsLoading(true)

    const { data, error } = await supabase
      .from('places')
      .select('*')
      .in('category', selectedCategories)
      .contains('vibes', [selectedVibe])

    if (error) {
      console.error(error)
      setIsLoading(false)
      return null
    }

    const allPlaces = data || []
    const resultPlaces = []

    for (const categoryId of selectedCategories) {
      const categoryPlaces = allPlaces.filter(
        (place) => place.category === categoryId
      )

      if (categoryPlaces.length === 0) {
        setIsLoading(false)
        return null
      }

      const randomIndex = Math.floor(Math.random() * categoryPlaces.length)
      const pickedPlace = categoryPlaces[randomIndex]

      resultPlaces.push(pickedPlace)
    }

    setIsLoading(false)
    return resultPlaces
  }

  useEffect(() => {
    const id = getOrCreateUID()
    setUid(id)
  }, [])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)

    check()

    window.addEventListener('resize', check)

    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!spinErrorMessage) return

    const timer = setTimeout(() => {
      setSpinErrorMessage('')
    }, 2500)

    return () => clearTimeout(timer)
  }, [spinErrorMessage])

  function handleCopy() {
    setCopied(true)

    setTimeout(() => {
      setCopied(false)
    }, 1500)
  }

  function toggleCategory(categoryValue: number) {
    const isSelected = selectedCategories.includes(categoryValue)

    if (isSelected) {
      setSelectedCategories(selectedCategories.filter((item) => item !== categoryValue))
      return
    }

    if (selectedCategories.length >= 3) {
      return
    }

    setSelectedCategories([...selectedCategories, categoryValue])
  }

  async function handleSpin() {
    setSpinErrorMessage('')

    const resultPlaces = await getPlacesForSpin()

    if (!resultPlaces) {
      setPlaces([])
      setSpinErrorMessage('К сожалению, у нас пока что нет походящих мест')
      return
    }

    const { data, error } = await supabase.rpc('use_spin', { p_uid: uid } as any)

    if (error) {
      console.error(error)
      setCanSpin(false)
      setSpinErrorMessage('На сегодня попытки закончились')
      return
    }

    if (data !== null) {
      console.log('spinsLeft:', data)
      setSpinsLeft(data)
    }

    setPlaces(resultPlaces)
    setScreen('spinner')
  }

  return (
    <div>
      {screen !== 'start' && spinsLeft !== null && (
        <div
          style={{
            position: 'fixed',
            top: 50,
            left: 15,
            background: '#125BEC',
            borderRadius: 999,
            padding: '6px 14px 6px 6px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            zIndex: 1000,
          }}
        >
          {/* КРУГ */}
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 14 }}>✦</span>
          </div>

          {/* ЧИСЛО */}
          <div
            style={{
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: 500,
              lineHeight: 1,
            }}
          >
            {spinsLeft}
          </div>
        </div>
      )}

      {screen === 'start' && (
        <div
          style={{
            minHeight: '100svh',
            display: 'flex',
            flexDirection: 'column',
            padding: '150px 0px 30px',
            boxSizing: 'border-box',
            background: '#125BEC',
          }}
        >
          {/* TOP */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 30,
                fontWeight: 600,
                color: '#fff',
                marginBottom: 15,
                marginRight: 30,
                marginLeft: 30,
              }}
            >
              Открывай город заново
            </div>

            <div
              style={{
                fontSize: 15,
                lineHeight: 1.5,
                color: 'rgb(255, 255, 255)',
                marginRight: 45,
                marginLeft: 45,
              }}
            >
              Долго не можешь выбрать место для прогулки? Доверься судьбе.
              Выбери вайб и категории, а рулетка решит всё за тебя за несколько секунд
            </div>
          </div>

          {/* CENTER */}
          <div
            style={{
              flex: 1,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {/* задний текст */}
            <img
              src={heroText}
              alt=""
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundPosition: isMobile ? 'center 50%' : 'center',
                width: isMobile ? '600vw' : '100%',
                maxWidth: 'none',
                opacity: 1,
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />

            {/* рулетка */}
            <img
              src={heroWheel}
              className="hero-wheel"
              alt="wheel"
              style={{
                position: 'relative',
                width: '110%',
                maxWidth: 500,
                zIndex: 2,
              }}
            />
          </div>

          <div style={{ marginTop: 'auto' }}>
            {/* ВОТ ЭТО контейнер только для кнопок */}
            <div style={{ padding: '0 30px 40px' }}>
              {/* BOTTOM */}
              <button
                onClick={() => setScreen('rules')}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 40,
                  border: 'none',
                  background: '#ffffff',
                  marginBottom: 10,
                  fontSize: 18,
                }}
              >
                Читать правила
              </button>

              <button
                onClick={() => setScreen('vibe')}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 40,
                  border: 'none',
                  fontSize: 18,
                  color: '#fff',
                  background: '#1C1C1F',
                }}
              >
                Начать
              </button>
            </div>
          </div>
        </div>
      )}

      {screen === 'rules' && (
        <div
          style={{
            minHeight: '100svh',
            background: '#125BEC',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '20px',
            paddingTop: 150,
            boxSizing: 'border-box',
          }}
        >
          {/* КАРТОЧКА */}
          <div
            style={{
              width: '100%',
              maxWidth: 420,
              background: '#F1F1F1',
              borderRadius: 28,
              padding: '25px 20px',
              position: 'relative',
              zIndex: 2,
            }}
          >
            {/* КРЕСТИК */}
            <button
              onClick={() => setScreen('start')}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                background: 'transparent',
                border: 'none',
                fontSize: 45,
                cursor: 'pointer',
              }}
            >
              ×
            </button>

            {/* КОНТЕНТ */}
            <div style={{ color: '#1C1C1F' }}>
              <div style={{ fontSize: 25, fontWeight: 600, marginBottom: 16 }}>
                Твоя цель
              </div>

              <div style={{ fontSize: 15, lineHeight: 1.5, marginBottom: 24 }}>
                Найти новое место для прогулки одному или компанией как можно скорее.
                Побеждает игрок, который классно провёл время
              </div>

              <div style={{ fontSize: 25, fontWeight: 600, marginBottom: 12 }}>
                Как играть?
              </div>

              <div style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
                1. Выбери вайб под настроение <br />
                2. Выбери три категории мест <br />
                3. Вращай рулетку <br />
                4. Выбирай место и отправляйся на прогулку
              </div>

              <div style={{ fontSize: 25, fontWeight: 600, marginBottom: 12 }}>
                Внимание
              </div>

              <div style={{ fontSize: 15, lineHeight: 1.5 }}>
                Каждому игроку ежедневно даётся только 3 спина, чтобы прокрутить
                рулетку. <br />
                На следующий день спины обновляются автоматически.
              </div>
            </div>
          </div>

          {/* КАРТИНКА СНИЗУ */}
          <img
            src={rulesWheel}
            alt=""
            style={{
              position: 'absolute',
              bottom: '-1%',
              left: '54%',
              transform: 'translateX(-50%)',
              width: '110%',
              maxWidth: 700,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        </div>
      )}

      {screen === 'vibe' && (
        <div
          style={{
            minHeight: '100svh',
            display: 'flex',
            flexDirection: 'column',
            background: screenBackground,
            padding: '150px 30px 30px',
            boxSizing: 'border-box',
          }}
        >
          {/* IMAGE */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 25,
            }}
          >
            <img
              src={rulesImage}
              alt=""
              style={{
                width: '100%',
                maxWidth: 320,
                height: 'auto',
              }}
            />
          </div>

          {/* TITLE */}
          <div
            style={{
              fontSize: 30,
              fontWeight: 600,
              textAlign: 'center',
              marginBottom: 15,
              color: '#1C1C1F',
            }}
          >
            Настрой свой вайб
          </div>

          {/* DESCRIPTION */}
          <div
            style={{
              fontSize: 15,
              lineHeight: 1.5,
              textAlign: 'center',
              color: '#1C1C1C',
              marginBottom: 25,
              padding: '0 10px',
            }}
          >
            Долго не можешь выбрать место для прогулки? Доверься судьбе.
            Выбери вайб и категории, а рулетка решит всё за тебя за несколько секунд
          </div>

          {/* BUTTONS GRID */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
            }}
          >
            {vibes.map((vibe) => {
              const isActive = selectedVibe === vibe.value

              return (
                <button
                  key={vibe.value}
                  onClick={() => setSelectedVibe(vibe.value)}
                  style={{
                    padding: '12px 10px',
                    borderRadius: 30,
                    border: isActive ? '1px solid #125BEC' : '1px solid #1C1C1F',
                    background: isActive ? '#125BEC' : '#FFFFFF',
                    color: isActive ? '#FFFFFF' : '#1C1C1F',
                    fontSize: 15,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  {vibe.label}
                </button>
              )
            })}
          </div>

          {/* BOTTOM BUTTONS */}
          <div style={{ marginTop: 'auto' }}>
            {/* ДАЛЕЕ */}
            <button
              onClick={() => {
                if (!selectedVibe) return
                setScreen('categories')
              }}
              disabled={!selectedVibe}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 40,
                border: 'none',
                background: '#1C1C1F',
                color: '#fff',
                fontSize: 18,
                marginBottom: 10,
                opacity: selectedVibe ? 1 : 0.5,
                cursor: selectedVibe ? 'pointer' : 'default',
              }}
            >
              Далее
            </button>

            {/* НАЗАД */}
            <button
              onClick={() => setScreen('start')}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 40,
                border: '1px solid #1C1C1F',
                background: '#FFFFFF',
                color: '#1C1C1F',
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              Назад
            </button>
          </div>
        </div>
      )}

      {screen === 'categories' && (
        <div
          style={{
            minHeight: '100svh',
            display: 'flex',
            flexDirection: 'column',
            background: screenBackground,
            padding: '150px 30px 30px',
            boxSizing: 'border-box',
          }}
        >
          {/* TITLE */}
          <div
            style={{
              fontSize: 30,
              fontWeight: 600,
              textAlign: 'center',
              marginBottom: 15,
              color: '#1C1C1F',
            }}
          >
            Выбери категорию
          </div>

          {/* DESCRIPTION */}
          <div
            style={{
              fontSize: 15,
              lineHeight: 1.5,
              textAlign: 'center',
              color: '#1C1C1C',
              marginBottom: 30,
              padding: '0 10px',
            }}
          >
            Долго не можешь выбрать место для прогулки? Доверься судьбе.
            Выбери вайб и категории, а рулетка решит всё за тебя за несколько секунд
          </div>

          {/* BUTTONS GRID */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
              marginBottom: 30,
            }}
          >
            {categories.map((category) => {
              const isActive = selectedCategories.includes(category.value)

              return (
                <button
                  key={category.value}
                  onClick={() => toggleCategory(category.value)}
                  style={{
                    padding: '12px 10px',
                    borderRadius: 30,
                    border: isActive ? '1px solid #125BEC' : '1px solid #1C1C1F',
                    background: isActive ? '#125BEC' : '#FFFFFF',
                    color: isActive ? '#FFFFFF' : '#1C1C1F',
                    fontSize: 15,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: '0.2s',
                  }}
                >
                  {category.label}
                </button>
              )
            })}
          </div>

          {/* IMAGE */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: 'auto',
              marginBottom: 10,
            }}
          >
            <img
              src={categoriesImage}
              alt=""
              style={{
                width: '85%',
                maxWidth: 360,
                height: 'auto',
              }}
            />
          </div>

          {/* NOTIFICATION */}
          {spinErrorMessage && (
            <div
              style={{
                position: 'absolute',
                bottom: 150, // регулируешь положение над кнопкой
                left: 30,
                right: 30,
                display: 'flex',
                justifyContent: 'center',
                pointerEvents: 'none', // чтобы не мешал кликам
              }}
            >
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #1C1C1F',
                  borderRadius: 0,
                  padding: '5px 10px',
                  fontSize: 15,
                  color: '#1C1C1F',
                  textAlign: 'center',
                  lineHeight: 1.3,
                  pointerEvents: 'auto',
                }}
              >
                {spinErrorMessage}
              </div>
            </div>
          )}

          {/* BOTTOM BUTTONS */}
          <div style={{ marginTop: 'auto' }}>
            {/* ДАЛЕЕ */}
            <button
              onClick={async () => {
                if (selectedCategories.length !== 3) return
                await handleSpin()
              }}
              disabled={selectedCategories.length !== 3}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 40,
                border: 'none',
                background: '#1C1C1F',
                color: '#fff',
                fontSize: 18,
                marginBottom: 10,
                opacity: selectedCategories.length === 3 ? 1 : 0.5,
                cursor: selectedCategories.length === 3 ? 'pointer' : 'default',
              }}
            >
              Далее
            </button>

            {/* НАЗАД */}
            <button
              onClick={() => setScreen('vibe')}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 40,
                border: '1px solid #1C1C1F',
                background: '#FFFFFF',
                color: '#1C1C1F',
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              Назад
            </button>
          </div>
        </div>
      )}

      {screen === 'spinner' && (
        <div
          style={{
            minHeight: '100svh',
            display: 'flex',
            flexDirection: 'column',
            background: screenBackground,
            padding: '250px 30px 30px',
            boxSizing: 'border-box',
            position: 'relative',
          }}
        >


          {/* TITLE */}
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              textAlign: 'center',
              marginBottom: 30,
              color: '#1C1C1F',
            }}
          >
            Испытай судьбу
          </div>

          {/* SPINNER BOX */}
          <div
            style={{
              background: '#2B63F6',
              borderRadius: 28,
              padding: '20px 15px',
              marginBottom: 30,
            }}
          >
            <SlotSpinner
              ref={spinnerRef}
              categories={selectedCategories}
              canSpin={canSpin}
              onFinish={() => setScreen('result')}
            />
          </div>

          {/* IMAGE */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: 'auto',
              marginBottom: -150,
              marginLeft: 'auto',
              marginRight: 5,
            }}
          >
            <img
              src={spinImage}
              alt=""
              style={{
                width: '100%',
                maxWidth: 260,
                height: 'auto',
              }}
            />
          </div>

          {/* BOTTOM BUTTONS */}
          <div style={{ marginTop: 'auto' }}>
            {/* SPIN BUTTON */}
            <button
              onClick={() => spinnerRef.current?.spin()}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 40,
                border: 'none',
                background: '#1C1C1F',
                color: '#fff',
                fontSize: 18,
                marginBottom: 10,
                opacity: 1,
                cursor: 'pointer',
              }}
            >
              Крутить
            </button>
          </div>
        </div>
      )}

      {screen === 'result' && (
        <div
          style={{
            minHeight: '100svh',
            background: screenBackground,
            display: 'flex',
            flexDirection: 'column',
            padding: '150px 30px 30px',
          }}
        >
          {/* КОНТЕНТ (СКРОЛЛЯЩИЙСЯ) */}
          <div
            style={{
              flex: 1,
              padding: '0px 0px 200px',
              boxSizing: 'border-box',
            }}
          >

            {/* КАРТОЧКИ */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              {places.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  onCopy={handleCopy}
                />
              ))}
            </div>
          </div>

          {copied && (
            <div
              style={{
                position: 'fixed',
                bottom: 150,
                left: 30,
                right: 30,
                display: 'flex',
                justifyContent: 'center',
                zIndex: 2000,
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  background: '#FFFFFF',
                  color: '#1C1C1F',
                  padding: '5px 15px',
                  border: '1px solid #1C1C1F',
                  borderRadius: 30,
                  fontSize: 14,
                }}
              >
                Адрес скопирован
              </div>
            </div>
          )}

          {/* ФИКСИРОВАННЫЙ BOTTOM */}
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '30px',
              background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, #FFFFFF 40%)',
            }}
          >
            {/* КРУТИТЬ ЕЩЕ */}
            <button
              onClick={() => {
                if (!canSpin) return
                setScreen('spinner')
              }}
              disabled={!canSpin}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 40,
                border: 'none',
                background: canSpin ? '#1C1C1F' : '#C7C7CC',
                color: '#fff',
                fontSize: 18,
                marginBottom: 10,
                cursor: canSpin ? 'pointer' : 'default',
              }}
            >
              Крутить еще
            </button>

            {/* СМЕНИТЬ */}
            <button
              onClick={() => setScreen('categories')}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 40,
                border: '1px solid #1C1C1C',
                background: '#FFFFFF',
                color: '#1C1C1F',
                fontSize: 18,
              }}
            >
              Сменить настройки
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App