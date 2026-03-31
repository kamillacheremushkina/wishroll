import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { vibes } from './constants/vibes'
import { categories } from './constants/categories'
import PlaceCard from './components/PlaceCard'
import SlotSpinner from './components/SlotSpinner'
import logo from './assets/logo.svg'

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
  const [screen, setScreen] = useState<'start' | 'vibe' | 'categories' | 'spinner' | 'result'>('start')
  const [isLoading, setIsLoading] = useState(false)
  const [spinsLeft, setSpinsLeft] = useState<number | null>(null)
  const [canSpin, setCanSpin] = useState(true)
  const [spinErrorMessage, setSpinErrorMessage] = useState('')
  const [uid, setUid] = useState<string | null>(null)

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
      setSpinErrorMessage('По выбранным настройкам сейчас ничего не найдено')
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
            top: 16,
            right: 16,
            background: '#1C1C1F',
            color: '#fff',
            padding: '6px 12px',
            borderRadius: 12,
            fontSize: 14,
            zIndex: 1000,
          }}
        >
          {spinsLeft} 🪙
        </div>
      )}

      {screen === 'start' && (
        <div
          style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '24px 16px',
            boxSizing: 'border-box',
            background: screenBackground,
          }}
        >
          <div
            style={{
              borderRadius: 20,
              height: 750,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              background: '#ffffff00',
            }}
          >
            <img
              src={logo}
              alt="logo"
              style={{
                maxWidth: '80%',
                maxHeight: '80%',
                objectFit: 'contain',
              }}
            />
          </div>

          <div>
            <button
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 20,
                border: 'none',
                background: '#f2f2f2',
                marginBottom: 12,
                fontSize: 16,
              }}
            >
              <span
                style={{
                  background:
                    'linear-gradient(90deg, #F7D420 0%, #FA804B 25%, #FA6E5E 50%, #F75B8B 75%, #A96BD8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Читать правила
              </span>
            </button>

            <button
              onClick={() => setScreen('vibe')}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 20,
                border: 'none',
                fontSize: 18,
                color: '#fff',
                background:
                  'linear-gradient(90deg, #F7D420 0%, #FA804B 25%, #FA6E5E 50%, #F75B8B 75%, #A96BD8 100%)',
              }}
            >
              Начать
            </button>
          </div>
        </div>
      )}

      {screen === 'vibe' && (
        <div
          style={{
            minHeight: '100vh',
            padding: '24px 16px',
            boxSizing: 'border-box',
            background: screenBackground,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <button
            onClick={() => setScreen('start')}
            style={{
              alignSelf: 'flex-start',
              marginBottom: 24,
              background: 'transparent',
              border: 'none',
              padding: 0,
              fontSize: 16,
              color: '#565864',
              cursor: 'pointer',
            }}
          >
            Назад
          </button>

          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                lineHeight: 1.2,
                marginBottom: 8,
                color: '#1C1C1F',
                textAlign: 'center',
              }}
            >
              Выбери вайб
            </div>

            <div
              style={{
                fontSize: 15,
                lineHeight: 1.4,
                color: '#565864',
                textAlign: 'center',
              }}
            >
              Выбери один настрой, и мы подберём места под него.
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}
          >
            {vibes.map((vibe) => {
              const isActive = selectedVibe === vibe.value

              return (
                <button
                  key={vibe.value}
                  onClick={() => setSelectedVibe(vibe.value)}
                  style={{
                    minHeight: 88,
                    borderRadius: 20,
                    border: isActive ? 'none' : '1px solid #E6E6EB',
                    background: isActive
                      ? 'linear-gradient(90deg, #F7D420 0%, #FA804B 25%, #FA6E5E 50%, #F75B8B 75%, #A96BD8 100%)'
                      : '#FFFFFF',
                    color: isActive ? '#FFFFFF' : '#1C1C1F',
                    fontSize: 16,
                    fontWeight: 600,
                    padding: '16px 12px',
                    cursor: 'pointer',
                    boxShadow: isActive
                      ? '0 10px 24px rgba(249, 104, 105, 0.22)'
                      : 'none',
                  }}
                >
                  {vibe.label}
                </button>
              )
            })}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: 24 }}>
            <button
              onClick={() => {
                if (!selectedVibe) return
                setScreen('categories')
              }}
              disabled={!selectedVibe}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 20,
                border: 'none',
                fontSize: 18,
                fontWeight: 600,
                color: '#fff',
                cursor: selectedVibe ? 'pointer' : 'default',
                opacity: selectedVibe ? 1 : 0.5,
                background:
                  'linear-gradient(90deg, #F7D420 0%, #FA804B 25%, #FA6E5E 50%, #F75B8B 75%, #A96BD8 100%)',
              }}
            >
              Продолжить
            </button>
          </div>
        </div>
      )}

      {screen === 'categories' && (
        <div
          style={{
            minHeight: '100vh',
            padding: '24px 16px',
            boxSizing: 'border-box',
            background: screenBackground,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <button
            onClick={() => setScreen('vibe')}
            style={{
              alignSelf: 'flex-start',
              marginBottom: 24,
              background: 'transparent',
              border: 'none',
              padding: 0,
              fontSize: 16,
              color: '#565864',
              cursor: 'pointer',
            }}
          >
            Назад
          </button>

          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                lineHeight: 1.2,
                marginBottom: 8,
                color: '#1C1C1F',
                textAlign: 'center',
              }}
            >
              Выбери 3 категории
            </div>

            <div
              style={{
                fontSize: 15,
                lineHeight: 1.4,
                color: '#565864',
                textAlign: 'center',
              }}
            >
              Выбери три направления, по которым будем искать места.
            </div>
          </div>

          <div
            style={{
              marginBottom: 16,
              fontSize: 14,
              color: '#565864',
              textAlign: 'center',
            }}
          >
            Выбрано: {selectedCategories.length} из 3
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}
          >
            {categories.map((category) => {
              const isActive = selectedCategories.includes(category.value)

              return (
                <button
                  key={category.value}
                  onClick={() => toggleCategory(category.value)}
                  style={{
                    minHeight: 88,
                    borderRadius: 20,
                    border: isActive ? 'none' : '1px solid #E6E6EB',
                    background: isActive
                      ? 'linear-gradient(90deg, #F7D420 0%, #FA804B 25%, #FA6E5E 50%, #F75B8B 75%, #A96BD8 100%)'
                      : '#FFFFFF',
                    color: isActive ? '#FFFFFF' : '#1C1C1F',
                    fontSize: 16,
                    fontWeight: 600,
                    padding: '16px 12px',
                    cursor: 'pointer',
                    boxShadow: isActive
                      ? '0 10px 24px rgba(249, 104, 105, 0.22)'
                      : 'none',
                  }}
                >
                  {category.label}
                </button>
              )
            })}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: 24 }}>
            {spinErrorMessage && (
              <div
                style={{
                  marginBottom: 12,
                  padding: '12px 16px',
                  borderRadius: 16,
                  background: '#1C1C1F',
                  color: '#FFFFFF',
                  fontSize: 14,
                  lineHeight: 1.4,
                  textAlign: 'center',
                }}
              >
                {spinErrorMessage}
              </div>
            )}
            <button
              onClick={async () => {
                if (selectedCategories.length !== 3) return
                await handleSpin()
              }}
              disabled={selectedCategories.length !== 3}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 20,
                border: 'none',
                fontSize: 18,
                fontWeight: 600,
                color: '#fff',
                cursor: selectedCategories.length === 3 ? 'pointer' : 'default',
                opacity: selectedCategories.length === 3 ? 1 : 0.5,
                background:
                  'linear-gradient(90deg, #F7D420 0%, #FA804B 25%, #FA6E5E 50%, #F75B8B 75%, #A96BD8 100%)',
              }}
            >
              Продолжить
            </button>
          </div>
        </div>
      )}

      {screen === 'spinner' && (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: screenBackground,
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              marginBottom: 24,
            }}
          >
            Крутим...
          </div>

          <SlotSpinner
            categories={selectedCategories}
            canSpin={canSpin}
            onFinish={() => setScreen('result')}
          />
        </div>
      )}

      {screen === 'result' && (
        <div
          style={{
            minHeight: '100vh',
            padding: '24px 16px',
            boxSizing: 'border-box',
            background: screenBackground,
          }}
        >
          <button
            onClick={() => setScreen('categories')}
            style={{
              alignSelf: 'flex-start',
              marginBottom: 20,
              background: 'transparent',
              border: 'none',
              padding: 0,
              fontSize: 16,
              color: '#565864',
              cursor: 'pointer',
            }}
          >
            Сменить настройки
          </button>

          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: 8,
              color: '#1C1C1F',
              textAlign: 'center',
            }}
          >
            Вот что нашлось
          </div>

          <div
            style={{
              fontSize: 15,
              lineHeight: 1.4,
              color: '#565864',
              textAlign: 'center',
              marginBottom: 24,
            }}
          >
            Подборка мест по выбранному вайбу и категориям.
          </div>

          {isLoading ? (
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 20,
                padding: 20,
                color: '#565864',
                fontSize: 15,
                lineHeight: 1.5,
                textAlign: 'center',
              }}
            >
              Подбираем места...
            </div>
          ) : places.length > 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
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
          ) : (
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 20,
                padding: 20,
                color: '#565864',
                fontSize: 15,
                lineHeight: 1.5,
                textAlign: 'center',
              }}
            >
              Кажется, у нас какие то проблемы. Мы не смогли подобрать места.
            </div>
          )}
        </div>
      )}

      {copied && (
        <div
          style={{
            position: 'fixed',
            bottom: 60,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1C1C1F',
            color: '#fff',
            padding: '3px 15px',
            borderRadius: 15,
            fontSize: 13,
            zIndex: 1000,
          }}
        >
          Адрес скопирован
        </div>
      )}
    </div>
  )
}

export default App