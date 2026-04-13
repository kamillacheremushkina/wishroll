import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'
import { vibes } from './constants/vibes'
import { categories } from './constants/categories'
import { vibeCriteriaMap, getPriorityTier } from './constants/vibeCriteria'
import PlaceCard from './components/PlaceCard'
import SlotSpinner from './components/SlotSpinner'
import logoTxt from './assets/logo-txt.svg'
import cityImage from './assets/hero-city.svg'
import rulesWheel from './assets/rules-wheel.svg'
import rulesImage from './assets/rules-image.svg'
import spinImage from './assets/spin-image.svg'


const screenBackground = '#FFFFFF'
const APP_MAX_WIDTH = 420

function MobileScreen({ children, background = screenBackground }: any) {
  return (
    <div
      style={{
        height: '100dvh',
        minHeight: '100dvh',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        background,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: APP_MAX_WIDTH,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          paddingTop: 'max(12px, env(safe-area-inset-top))',
          paddingRight: 20,
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
          paddingLeft: 20,
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {children}
      </div>
    </div>
  )
}

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
  const spinnerRef = useRef<any>(null)


  function scorePlaceForVibe(placeCriteria: string[], vibeKey: string) {
    const vibeConfig = vibeCriteriaMap[vibeKey as keyof typeof vibeCriteriaMap]

    if (!vibeConfig) {
      return {
        positiveMatches: 0,
        antiMatches: 0,
        priorityTier: 0,
        matchPercent: 0,
      }
    }

    const positiveCriteria = [...vibeConfig.positive] as string[]
    const antiCriteria = [...vibeConfig.anti] as string[]

    const positiveMatches = placeCriteria.filter((criterion) =>
      positiveCriteria.includes(criterion)
    ).length

    const antiMatches = placeCriteria.filter((criterion) =>
      antiCriteria.includes(criterion)
    ).length

    const priorityTier = getPriorityTier(positiveMatches, antiMatches)

    const totalPositive = positiveCriteria.length || 1
    const rawPercent = Math.round((positiveMatches / totalPositive) * 100 - antiMatches * 15)
    const matchPercent = Math.max(0, Math.min(100, rawPercent))

    return {
      positiveMatches,
      antiMatches,
      priorityTier,
      matchPercent,
    }
  }

  function comparePlacesByVibeScore(
    a: { positiveMatches: number; antiMatches: number; priorityTier: number },
    b: { positiveMatches: number; antiMatches: number; priorityTier: number }
  ) {
    if (b.priorityTier !== a.priorityTier) {
      return b.priorityTier - a.priorityTier
    }

    if (b.positiveMatches !== a.positiveMatches) {
      return b.positiveMatches - a.positiveMatches
    }

    return a.antiMatches - b.antiMatches
  }

  async function loadUserSpins(currentUid: string) {
    const { data, error } = await supabase
      .from('users')
      .select('spins_left')
      .eq('uid', currentUid)
      .maybeSingle()

    if (error) {
      console.error(error)
      return
    }

    const nextSpinsLeft = data?.spins_left ?? 3

    setSpinsLeft(nextSpinsLeft)
    setCanSpin(nextSpinsLeft > 0)
  }

  async function handleShareApp() {
  const appUrl = 'https://wishroll.vercel.app/'

  try {
    if (navigator.share) {
      await navigator.share({ url: appUrl })
      return
    }

    await navigator.clipboard.writeText(appUrl)
    alert('Ссылка скопирована')
  } catch (error) {
    console.error(error)
  }
}


  const showSpinsBadge =
    screen === 'vibe' ||
    screen === 'categories' ||
    screen === 'spinner' ||
    screen === 'result'

  async function getPlacesForSpin() {
    if (!selectedVibe || selectedCategories.length < 1 || selectedCategories.length > 3) {
      return null
    }

    const { data, error } = await supabase
      .from('places_v2')
      .select('*')
      .in('category', selectedCategories)
      .eq('is_active', true)

    if (error) {
      console.error(error)
      return null
    }

    const allPlaces = data || []
    const resultPlaces = []

    for (const categoryId of selectedCategories) {
      const categoryPlaces = allPlaces.filter(
        (place) => place.category === categoryId
      )

      if (categoryPlaces.length === 0) {
        return null
      }

      const scoredPlaces = categoryPlaces
        .map((place) => {
          const score = scorePlaceForVibe(place.criteria ?? [], selectedVibe)

          return {
            ...place,
            ...score,
          }
        })
        .sort(comparePlacesByVibeScore)

      const strongMatches = scoredPlaces.filter((place) => place.matchPercent >= 65)
      const closeMatches = scoredPlaces.filter((place) => place.matchPercent >= 45)

      const pool =
        strongMatches.length > 0
          ? strongMatches
          : closeMatches.length > 0
            ? closeMatches
            : scoredPlaces

      const topPool = pool.slice(0, Math.min(3, pool.length))
      const randomIndex = Math.floor(Math.random() * topPool.length)
      const pickedPlace = topPool[randomIndex]

      resultPlaces.push(pickedPlace)
    }

    return resultPlaces
  }

  useEffect(() => {
    const id = getOrCreateUID()
    setUid(id)
    loadUserSpins(id)
  }, [])

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible' && uid) {
        loadUserSpins(uid)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [uid])

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

  async function handleGoToSpinner() {
    if (selectedCategories.length < 1 || selectedCategories.length > 3) return

    setSpinErrorMessage('')
    setIsLoading(true)

    const resultPlaces = await getPlacesForSpin()

    setIsLoading(false)

    if (!resultPlaces) {
      setSpinErrorMessage('К сожалению, у нас пока что нет подходящих мест')
      return
    }

    setScreen('spinner')
  }

  async function handleSpin() {
    setSpinErrorMessage('')
    setIsLoading(true)

    const resultPlaces = await getPlacesForSpin()

    if (!resultPlaces) {
      setPlaces([])
      setSpinErrorMessage('К сожалению, у нас пока что нет подходящих мест')
      setIsLoading(false)
      return
    }

    const { data, error } = await supabase.rpc('use_spin', { p_uid: uid } as any)

    if (error) {
      console.error(error)
      setCanSpin(false)
      setSpinErrorMessage('На сегодня попытки закончились')
      setIsLoading(false)
      return
    }

    if (data !== null) {
      setSpinsLeft(data)
      setCanSpin(data > 0)
    }

    setPlaces(resultPlaces)
    spinnerRef.current?.spin()
  }

  return (
    <div>
      {/* TOP ACTIONS */}
      {showSpinsBadge && spinsLeft !== null && (
        <div
          style={{
            position: 'fixed',
            top: 'max(16px, env(safe-area-inset-top))',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: APP_MAX_WIDTH,
            padding: '0 20px',
            boxSizing: 'border-box',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#125BEC',
              borderRadius: 40,
              padding: '2px 16px 2px 2px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#FFFFFF',
              fontSize: 15,
              fontWeight: 500,
              pointerEvents: 'auto',
            }}
          >
            <div
              style={{
                background: '#FFFFFF',
                color: '#1C1C1F',
                borderRadius: '50%',
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                lineHeight: 1,
              }}
            >
              ✦
            </div>
            <span>{spinsLeft}</span>
          </div>

          <button
            onClick={handleShareApp}
            style={{
              background: '#125BEC',
              borderRadius: 40,
              padding: '2px 16px 2px 2px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#FFFFFF',
              fontSize: 15,
              fontWeight: 500,
              pointerEvents: 'auto',
            }}
            aria-label="Поделиться приложением"
          >
            ↗
          </button>
        </div>
      )}

      {screen === 'start' && (
        <MobileScreen background="#125BEC">
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                flexShrink: 0,
                textAlign: 'center',
                paddingTop: 'clamp(45px, 6vh, 60px)',
              }}
            >
              <img
                src={logoTxt}
                alt="ВШРОЛЛ"
                style={{
                  width: '100%',
                  maxWidth: 283,
                  height: 'auto',
                  margin: '0 auto 28px',
                }}
              />

              <div
                style={{
                  fontSize: 'clamp(28px, 7vw, 30px)',
                  fontWeight: 500,
                  lineHeight: 1.2,
                  color: '#FFFFFF',
                  maxWidth: 347,
                  margin: '0 auto',
                }}
              >
                Не думай — крути
                <br />
                город уже всё решил
              </div>
            </div>

            <div
              style={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                margin: '16px 0',
              }}
            >
              <img
                src={cityImage}
                alt=""
                style={{
                  width: '100%',
                  maxWidth: 660,
                  height: 'auto',
                  objectFit: 'contain',
                  pointerEvents: 'none',
                }}
              />
            </div>

            <div
              style={{
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                paddingBottom: 4,
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  lineHeight: 1.2,
                  fontWeight: 500,
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.5)',
                  marginBottom: 0,
                }}
              >
                Попробуй особый сценарий
              </div>

              <button
                onClick={() => setScreen('rules')}
                style={{
                  width: '100%',
                  height: 54,
                  borderRadius: 40,
                  border: 'none',
                  background: '#FFFFFF',
                  color: '#1C1C1F',
                  fontSize: 18,
                  cursor: 'pointer',
                }}
              >
                Персонаж дня
              </button>

              <button
                onClick={() => setScreen('vibe')}
                style={{
                  width: '100%',
                  height: 54,
                  borderRadius: 40,
                  border: 'none',
                  background: '#1C1C1F',
                  color: '#FFFFFF',
                  fontSize: 18,
                  cursor: 'pointer',
                }}
              >
                Начать игру
              </button>
            </div>
          </div>
        </MobileScreen>
      )}

      {screen === 'rules' && (
        <MobileScreen background="#125BEC">
          <div
            style={{
              flex: 1,
              minHeight: 0,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: 20,
              paddingBottom: 12,
              overflow: 'hidden',
            }}
          >
            <img
              src={rulesWheel}
              alt=""
              style={{
                position: 'absolute',
                bottom: -20,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '115%',
                maxWidth: 560,
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />

            <div
              style={{
                width: '100%',
                maxWidth: 380,
                maxHeight: '100%',
                overflowY: 'auto',
                background: '#F1F1F1',
                borderRadius: 28,
                padding: '24px 20px',
                position: 'relative',
                zIndex: 2,
              }}
            >
              <button
                onClick={() => setScreen('start')}
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  width: 40,
                  height: 40,
                  background: 'transparent',
                  border: 'none',
                  fontSize: 34,
                  lineHeight: 1,
                  cursor: 'pointer',
                }}
              >
                ×
              </button>

              <div style={{ color: '#1C1C1F', paddingRight: 18 }}>
                <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>
                  Цель игры
                </div>

                <div style={{ fontSize: 15, lineHeight: 1.5, marginBottom: 24 }}>
                  Найти новое место для прогулки одному или компанией как можно скорее.
                  Побеждает игрок, который классно провёл время
                </div>

                <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>
                  Как играть?
                </div>

                <div style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
                  1. Выбери вайб под настроение <br />
                  2. Выбери три категории мест <br />
                  3. Вращай рулетку <br />
                  4. Выбирай место и отправляйся на прогулку
                </div>

                <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>
                  Внимание
                </div>

                <div style={{ fontSize: 15, lineHeight: 1.5 }}>
                  Каждому игроку ежедневно даётся только 3 спина, чтобы прокрутить
                  рулетку. <br />
                  На следующий день спины обновляются автоматически.
                </div>
              </div>
            </div>
          </div>
        </MobileScreen>
      )}

      {screen === 'vibe' && (
        <MobileScreen background={screenBackground}>
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              paddingTop: 45,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: 14,
                flexShrink: 0,
              }}
            >
              <img
                src={rulesImage}
                alt=""
                style={{
                  width: '100%',
                  maxWidth: 300,
                  height: 'auto',
                }}
              />
            </div>

            <div
              style={{
                fontSize: 28,
                fontWeight: 600,
                textAlign: 'center',
                marginBottom: 10,
                color: '#1C1C1F',
                flexShrink: 0,
              }}
            >
              Каждому настроению свой маршрут
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.4,
                textAlign: 'center',
                color: '#1C1C1F',
                marginBottom: 18,
                padding: '0 6px',
                flexShrink: 0,
              }}
            >
              Выбери свое, и фортуна откроет, куда тебе отправиться сегодня...
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                flexShrink: 0,
              }}
            >
              {vibes.map((vibe) => {
                const isActive = selectedVibe === vibe.value

                return (
                  <button
                    key={vibe.value}
                    onClick={() => setSelectedVibe(vibe.value)}
                    style={{
                      height: 44,
                      borderRadius: 30,
                      border: isActive ? '1px solid #125BEC' : '1px solid #1C1C1F',
                      background: isActive ? '#125BEC' : '#FFFFFF',
                      color: isActive ? '#FFFFFF' : '#1C1C1F',
                      fontSize: 15,
                      fontWeight: 500,
                    }}
                  >
                    {vibe.label}
                  </button>
                )
              })}
            </div>

            <div
              style={{
                marginTop: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                paddingTop: 16,
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => {
                  if (!selectedVibe) return
                  setScreen('categories')
                }}
                disabled={!selectedVibe}
                style={{
                  width: '100%',
                  height: 54,
                  borderRadius: 40,
                  border: 'none',
                  background: '#1C1C1F',
                  color: '#FFFFFF',
                  fontSize: 18,
                  opacity: selectedVibe ? 1 : 0.5,
                  cursor: selectedVibe ? 'pointer' : 'default',
                }}
              >
                Далее
              </button>

              <button
                onClick={() => setScreen('start')}
                style={{
                  width: '100%',
                  height: 52,
                  borderRadius: 40,
                  border: '1px solid #1C1C1F',
                  background: '#FFFFFF',
                  color: '#1C1C1F',
                  fontSize: 16,
                }}
              >
                Назад
              </button>
            </div>
          </div>
        </MobileScreen>
      )}

      {screen === 'categories' && (
        <MobileScreen background={screenBackground}>
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              paddingTop: 45,
            }}
          >
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                paddingBottom: 24,
              }}
            >
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 600,
                  textAlign: 'center',
                  marginBottom: 10,
                  color: '#1C1C1F',
                  flexShrink: 0,
                }}
              >
                Все дороги ведут...
              </div>

              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.4,
                  textAlign: 'center',
                  color: '#1C1C1F',
                  marginBottom: 18,
                  padding: '0 6px',
                  flexShrink: 0,
                }}
              >
                Выбери до 3 категорий, а дальше будет видно...
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                  flexShrink: 0,
                }}
              >
                {categories.map((category) => {
                  const isActive = selectedCategories.includes(category.value)

                  return (
                    <button
                      key={category.value}
                      onClick={() => toggleCategory(category.value)}
                      style={{
                        minHeight: 44,
                        borderRadius: 30,
                        border: isActive ? '1px solid #125BEC' : '1px solid #1C1C1F',
                        background: isActive ? '#125BEC' : '#FFFFFF',
                        color: isActive ? '#FFFFFF' : '#1C1C1F',
                        fontSize: 15,
                        fontWeight: 500,
                        padding: '10px 12px',
                        lineHeight: 1.2,
                      }}
                    >
                      {category.label}
                    </button>
                  )
                })}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  paddingTop: 20,
                  paddingBottom: 8,
                }}
              >

              </div>
            </div>

            <div
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                flexShrink: 0,
                paddingTop: 8,
              }}
            >
              {spinErrorMessage && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: 0,
                    width: '100%',
                    paddingBottom: 12,
                    display: 'flex',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                    zIndex: 10,
                  }}
                >
                  <div
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #1C1C1F',
                      padding: '6px 12px',
                      fontSize: 14,
                      color: '#1C1C1F',
                      textAlign: 'center',
                      lineHeight: 1.3,
                    }}
                  >
                    {spinErrorMessage}
                  </div>
                </div>
              )}

              <button
                onClick={handleGoToSpinner}
                disabled={selectedCategories.length < 1 || selectedCategories.length > 3 || isLoading}
                style={{
                  width: '100%',
                  height: 54,
                  borderRadius: 40,
                  border: 'none',
                  background: '#1C1C1F',
                  color: '#FFFFFF',
                  fontSize: 18,
                  opacity: selectedCategories.length >= 1 && selectedCategories.length <= 3 ? 1 : 0.5,
                  cursor: selectedCategories.length >= 1 && selectedCategories.length <= 3 ? 'pointer' : 'default',
                }}
              >
                {isLoading ? 'Секунду...' : 'Далее'}
              </button>

              <button
                onClick={() => setScreen('vibe')}
                style={{
                  width: '100%',
                  height: 52,
                  borderRadius: 40,
                  border: '1px solid #1C1C1C',
                  background: '#FFFFFF',
                  color: '#1C1C1F',
                  fontSize: 16,
                }}
              >
                Назад
              </button>
            </div>
          </div>
        </MobileScreen>
      )}

      {screen === 'spinner' && (
        <MobileScreen background={screenBackground}>
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              paddingTop: 'clamp(24px, 6vh, 54px)',
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 600,
                textAlign: 'center',
                marginBottom: 20,
                color: '#1C1C1F',
                flexShrink: 0,
              }}
            >
              Испытай судьбу
            </div>

            <div
              style={{
                flexShrink: 0,
                background: '#2B63F6',
                borderRadius: 28,
                padding: 'clamp(16px, 4vw, 20px) clamp(10px, 3vw, 15px)',
                marginBottom: 16,
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              <SlotSpinner
                ref={spinnerRef}
                categories={selectedCategories}
                canSpin={canSpin}
                onFinish={() => {
                  setIsLoading(false)
                  setScreen('result')
                }}
              />
            </div>

            <div
              style={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                paddingBottom: 8,
              }}
            >
              <img
                src={spinImage}
                alt=""
                style={{
                  width: '100%',
                  maxWidth: 170,
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                flexShrink: 0,
              }}
            >
              <button
                onClick={handleSpin}
                disabled={isLoading || !canSpin}
                style={{
                  width: '100%',
                  height: 54,
                  borderRadius: 40,
                  border: 'none',
                  background: isLoading || !canSpin ? '#C7C7CC' : '#1C1C1F',
                  color: '#FFFFFF',
                  fontSize: 18,
                  cursor: isLoading || !canSpin ? 'default' : 'pointer',
                }}
              >
                {isLoading ? 'Крутим...' : 'Крутить'}
              </button>

              <button
                onClick={() => setScreen('categories')}
                disabled={isLoading}
                style={{
                  width: '100%',
                  height: 52,
                  borderRadius: 40,
                  border: '1px solid #1C1C1C',
                  background: '#FFFFFF',
                  color: '#1C1C1F',
                  fontSize: 16,
                  opacity: isLoading ? 0.5 : 1,
                  cursor: isLoading ? 'default' : 'pointer',
                }}
              >
                Назад
              </button>
            </div>
          </div>
        </MobileScreen>
      )}

      {screen === 'result' && (
        <MobileScreen background={screenBackground}>
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              paddingTop: 64,
            }}
          >
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                paddingBottom: 140, // Место под фиксированные кнопки
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.4,
                  textAlign: 'center',
                  color: '#1C1C1F',
                  marginBottom: 18,
                  padding: '0 6px',
                  flexShrink: 0,
                }}
              >
                Копируй адрес и в путь
              </div>

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
          </div>

          {/* НИЖНИЙ ФИКСИРОВАННЫЙ БЛОК С КНОПКАМИ */}
          <div
            style={{
              position: 'fixed',
              left: '50%',
              transform: 'translateX(-50%)',
              bottom: 0,
              width: '100%',
              maxWidth: APP_MAX_WIDTH,
              padding: '24px 20px max(16px, env(safe-area-inset-bottom))',
              boxSizing: 'border-box',
              background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, #FFFFFF 38%)',
              zIndex: 10,
            }}
          >
            {/* УВЕДОМЛЕНИЕ: Теперь привязано к верхнему краю кнопок */}
            {copied && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '90%', // Всегда строго над контейнером кнопок
                  left: 0,
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  paddingBottom: 0,
                  pointerEvents: 'none',
                  zIndex: 2000,
                }}
              >
                <div
                  style={{
                    background: '#FFFFFF',
                    color: '#1C1C1F',
                    padding: '6px 14px',
                    border: '1px solid #1C1C1F',
                    borderRadius: 30,
                    fontSize: 14,
                  }}
                >
                  Адрес скопирован
                </div>
              </div>
            )}

            <button
              onClick={() => {
                if (!canSpin) return
                setScreen('spinner')
              }}
              disabled={!canSpin}
              style={{
                width: '100%',
                height: 54,
                borderRadius: 40,
                border: 'none',
                background: canSpin ? '#1C1C1F' : '#C7C7CC',
                color: '#FFFFFF',
                fontSize: 18,
                marginBottom: 10,
                cursor: canSpin ? 'pointer' : 'default',
              }}
            >
              Крутить еще
            </button>

            <button
              onClick={() => setScreen('categories')}
              style={{
                width: '100%',
                height: 52,
                borderRadius: 40,
                border: '1px solid #1C1C1C',
                background: '#FFFFFF',
                color: '#1C1C1F',
                fontSize: 16,
              }}
            >
              Сменить настройки
            </button>
          </div>
        </MobileScreen>
      )}
    </div>
  )
}

export default App