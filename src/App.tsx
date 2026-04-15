import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'
import { vibes } from './constants/vibes'
import { categories } from './constants/categories'
import { vibeCriteriaMap, getPriorityTier } from './constants/vibeCriteria'
import PlaceCard from './components/PlaceCard'
import SlotSpinner from './components/SlotSpinner'
import logoTxt from './assets/logo-txt.svg'
import cityImage from './assets/hero-city.svg'
import rulesImage from './assets/rules-image.svg'
import coinImg from './assets/coin-img.svg'
import shareImg from './assets/share-img.svg'
import slotMachineImg from './assets/slot-machine.svg'
import { characters, WEEKLY_CHARACTER_ID, type Character } from './constants/characters'

const DAILY_SPINS = 9
const screenBackground = '#FFFFFF'
const APP_MAX_WIDTH = 420

const SLOT_MACHINE_RATIO = 752 / 1214

const SLOT_WINDOW = {
  top: '47.1%',
  left: '12.1%',
  width: '71.8%',
  height: '18.3%',
  itemWidth: '30.6%',
  radius: 12,
}

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
  const [lastPlaceIds, setLastPlaceIds] = useState<number[]>([])
  const [copied, setCopied] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<number[]>([])
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null)
  const [screen, setScreen] = useState<
    'start' | 'characterIntro' | 'characterSetup' | 'vibe' | 'categories' | 'spinner' | 'result'
  >('start')
  const [isLoading, setIsLoading] = useState(false)
  const [spinsLeft, setSpinsLeft] = useState<number | null>(null)
  const [canSpin, setCanSpin] = useState(true)
  const [spinErrorMessage, setSpinErrorMessage] = useState('')
  const [uid, setUid] = useState<string | null>(null)
  type FlowMode = 'manual' | 'character'

  const [mode, setMode] = useState<FlowMode>('manual')
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null)
  const [characterPlacesCount, setCharacterPlacesCount] = useState<0 | 1 | 2 | 3>(0)
  const [selectedCharacterPhrase, setSelectedCharacterPhrase] = useState('')

  const spinnerRef = useRef<any>(null)

  const selectedCharacter =
    characters.find((character) => character.id === selectedCharacterId) ?? null

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

  function scorePlaceForCharacter(placeCriteria: string[], character: Character) {
    const positiveCriteria = character.positiveCriteria ?? []
    const antiCriteria = character.antiCriteria ?? []

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

    const nextSpinsLeft = data?.spins_left ?? DAILY_SPINS

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

  function getCharacterById(characterId: string) {
    return characters.find((character) => character.id === characterId) ?? null
  }

  function getRandomCharacterPhrase(character: Character) {
    const phrases = character.phraseOptions
    if (!phrases.length) return ''
    const randomIndex = Math.floor(Math.random() * phrases.length)
    return phrases[randomIndex]
  }

  function handleOpenWeeklyCharacter() {
    setMode('character')
    setSelectedCharacterId(WEEKLY_CHARACTER_ID)
    setCharacterPlacesCount(0)
    setSelectedCharacterPhrase('')
    setSpinErrorMessage('')
    setScreen('characterIntro')
  }

  function handleGoToCharacterSetup() {
    const character = getCharacterById(WEEKLY_CHARACTER_ID)
    if (!character) return

    setSelectedCharacterId(character.id)
    setSelectedCharacterPhrase(getRandomCharacterPhrase(character))
    setCharacterPlacesCount(0)
    setScreen('characterSetup')
  }

  function increaseCharacterPlaces() {
    setCharacterPlacesCount((prev) => Math.min(3, prev + 1) as 0 | 1 | 2 | 3)
  }

  function decreaseCharacterPlaces() {
    setCharacterPlacesCount((prev) => Math.max(0, prev - 1) as 0 | 1 | 2 | 3)
  }

  const showSpinsBadge =
    screen === 'characterSetup' ||
    screen === 'vibe' ||
    screen === 'categories' ||
    screen === 'spinner' ||
    screen === 'result'

  const spinsCost =
    mode === 'character' ? characterPlacesCount : selectedCategories.length

  const hasEnoughSpinsForCurrentSelection =
    spinsLeft !== null &&
    spinsCost >= 1 &&
    spinsLeft >= spinsCost

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

      const availablePool = pool.filter((place) => !lastPlaceIds.includes(place.id))
      const finalPool = availablePool.length > 0 ? availablePool : pool

      const topPool = finalPool.slice(0, Math.min(6, finalPool.length))
      const randomIndex = Math.floor(Math.random() * topPool.length)
      const pickedPlace = topPool[randomIndex]

      resultPlaces.push(pickedPlace)
    }

    return resultPlaces
  }

  async function getPlacesForCharacterSpin() {
    if (!selectedCharacter || characterPlacesCount < 1) {
      return null
    }

    const { data, error } = await supabase
      .from('places_v2')
      .select('*')
      .in('category', selectedCharacter.categoryPool)
      .eq('is_active', true)

    if (error) {
      console.error(error)
      return null
    }

    const allPlaces = data || []

    const availableCategoryIds = [...selectedCharacter.categoryPool]
      .filter((categoryId) =>
        allPlaces.some((place) => place.category === categoryId)
      )
      .sort(() => Math.random() - 0.5)

    if (availableCategoryIds.length < characterPlacesCount) {
      return null
    }

    const pickedCategories = availableCategoryIds.slice(0, characterPlacesCount)
    const resultPlaces = []

    for (const categoryId of pickedCategories) {
      const categoryPlaces = allPlaces.filter((place) => place.category === categoryId)

      if (categoryPlaces.length === 0) {
        return null
      }

      const scoredPlaces = categoryPlaces
        .map((place) => ({
          ...place,
          ...scorePlaceForCharacter(place.criteria ?? [], selectedCharacter),
          resultBadgeLabel: selectedCharacter.resultBadgeLabel,
        }))
        .sort(comparePlacesByVibeScore)

      const strongMatches = scoredPlaces.filter((place) => place.matchPercent >= 65)
      const closeMatches = scoredPlaces.filter((place) => place.matchPercent >= 45)

      const pool =
        strongMatches.length > 0
          ? strongMatches
          : closeMatches.length > 0
            ? closeMatches
            : scoredPlaces

      const availablePool = pool.filter((place) => !lastPlaceIds.includes(place.id))
      const finalPool = availablePool.length > 0 ? availablePool : pool

      const topPool = finalPool.slice(0, Math.min(6, finalPool.length))
      const randomIndex = Math.floor(Math.random() * topPool.length)
      const pickedPlace = topPool[randomIndex]

      if (pickedPlace) {
        resultPlaces.push(pickedPlace)
      }
    }

    return resultPlaces.length ? resultPlaces : null
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

  useEffect(() => {
    setLastPlaceIds([])
  }, [selectedVibe, selectedCategories, selectedCharacterId, characterPlacesCount, mode])

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

  function handleGoToSpinner() {
    if (selectedCategories.length < 1 || selectedCategories.length > 3) return

    setSpinErrorMessage('')
    setScreen('spinner')
  }

  async function handleSpin() {
    setSpinErrorMessage('')
    setIsLoading(true)

    const spinsToUse =
      mode === 'character' ? characterPlacesCount : selectedCategories.length

    if (!hasEnoughSpinsForCurrentSelection) {
      setSpinErrorMessage('Недостаточно спинов для выбранного количества мест')
      setIsLoading(false)
      return
    }

    const resultPlaces =
      mode === 'character'
        ? await getPlacesForCharacterSpin()
        : await getPlacesForSpin()

    if (!resultPlaces) {
      setPlaces([])
      setSpinErrorMessage('К сожалению, у нас пока нет подходящих мест для этого сценария')
      setIsLoading(false)
      return
    }

    const { data, error } = await supabase.rpc('use_spin', {
      p_uid: uid,
      p_spins_to_use: spinsToUse,
    } as any)

    if (error) {
      console.error(error)
      if (uid) {
        await loadUserSpins(uid)
      }
      setSpinErrorMessage('Недостаточно спинов для выбранного количества мест')
      setIsLoading(false)
      return
    }

    if (data !== null) {
      setSpinsLeft(data)
      setCanSpin(data > 0)
    }

    setPlaces(resultPlaces)
    setLastPlaceIds((prev) => [
      ...new Set([...prev, ...resultPlaces.map((place) => place.id)]),
    ])
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
            alignItems: 'center',
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              position: 'relative',
              height: 30,
              minWidth: 82,
              paddingLeft: 18,
              pointerEvents: 'auto',
            }}
          >
            <div
              style={{
                height: '100%',
                minWidth: 72,
                background: '#125BEC',
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 14px 0 22px',
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: 500,
                lineHeight: 1,
              }}
            >
              {spinsLeft}
            </div>

            <img
              src={coinImg}
              alt=""
              style={{
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 40,
                height: 40,
                objectFit: 'contain',
                pointerEvents: 'none',
              }}
            />
          </div>

          <button
            onClick={handleShareApp}
            aria-label="Поделиться приложением"
            style={{
              width: 55,
              height: 30,
              border: 'none',
              borderRadius: 999,
              background: '#125BEC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              pointerEvents: 'auto',
              cursor: 'pointer',
            }}
          >
            <img
              src={shareImg}
              alt=""
              style={{
                width: 18,
                height: 18,
                objectFit: 'contain',
                pointerEvents: 'none',
              }}
            />
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
                onClick={handleOpenWeeklyCharacter}
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
                Персонаж недели
              </button>

              <button
                onClick={() => {
                  setMode('manual')
                  setSelectedCharacterId(null)
                  setCharacterPlacesCount(0)
                  setSelectedCharacterPhrase('')
                  setScreen('vibe')
                }}
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

      {screen === 'characterIntro' && selectedCharacter && (
        <MobileScreen background="#125BEC">
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: 'grid',
              gridTemplateRows: 'auto minmax(0, 1fr) auto',
              rowGap: 16,
              paddingTop: 34,
              paddingBottom: 4,
            }}
          >
            <div
              style={{
                textAlign: 'center',
                color: '#FFFFFF',
                fontSize: 16,
                lineHeight: 1.3,
                padding: '0 12px',
              }}
            >
              Открывай город через его персонажей.
              <br />
              Каждую неделю разный проводник
            </div>

            <div
              style={{
                minHeight: 0,
                background: '#F1F1F1',
                borderRadius: 28,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                padding: '26px 18px 0',
              }}
            >
              <div
                style={{
                  textAlign: 'center',
                  fontSize: 23,
                  fontWeight: 700,
                  lineHeight: 1.1,
                  color: '#1C1C1F',
                  marginBottom: 5,
                }}
              >
                {selectedCharacter.fullName}
              </div>

              <div
                style={{
                  textAlign: 'center',
                  fontSize: 13,
                  lineHeight: 1.35,
                  color: '#1C1C1F',
                  maxWidth: 320,
                  margin: '0 auto 10px',
                }}
              >
                {selectedCharacter.description}
              </div>

              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  paddingTop: 10,
                  paddingBottom: 12, // отступ от нижнего края белого блока
                }}
              >
                <img
                  src={selectedCharacter.cardImage}
                  alt={selectedCharacter.fullName}
                  style={{
                    width: '78%',
                    minWidth: 335,
                    maxHeight: '100%',
                    height: 'auto',
                    objectFit: 'contain',
                    objectPosition: 'center bottom',
                    flexShrink: 0,
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <button
                onClick={handleGoToCharacterSetup}
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
                {selectedCharacter.buttonLabel}
              </button>

              <button
                onClick={() => setScreen('start')}
                style={{
                  width: '100%',
                  height: 52,
                  borderRadius: 40,
                  border: '1px solid #FFFFFF',
                  background: 'transparent',
                  color: '#FFFFFF',
                  fontSize: 16,
                  cursor: 'pointer',
                }}
              >
                Назад
              </button>
            </div>
          </div>
        </MobileScreen>
      )}

      {screen === 'characterSetup' && selectedCharacter && (
        <MobileScreen background={screenBackground}>
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: 'grid',
              gridTemplateRows: 'auto auto minmax(0, 1fr) auto',
              rowGap: 18,
              paddingTop: 64,
              paddingBottom: 4,
            }}
          >
            <div
              style={{
                textAlign: 'center',
                fontSize: 'clamp(14px, 4.1vw, 16px)',
                lineHeight: 1.3,
                color: '#1C1C1F',
                maxWidth: 340,
                margin: '0 auto',
                padding: '0 8px',
              }}
            >
              {selectedCharacter.archetypeName} решит все за тебя, выбери количество мест,
              которые ты готов посетить
            </div>

            <div
              style={{
                width: '100%',
                background: '#125BEC',
                borderRadius: 24,
                padding: '12px 10px',
                display: 'grid',
                gridTemplateColumns: '56px minmax(0, 1fr) 56px',
                alignItems: 'center',
                columnGap: 12,
              }}
            >
              <button
                onClick={decreaseCharacterPlaces}
                disabled={characterPlacesCount <= 0}
                style={{
                  width: 56,
                  height: 56,
                  border: 'none',
                  borderRadius: 18,
                  background: 'transparent',
                  color: '#FFFFFF',
                  fontSize: 34,
                  lineHeight: 1,
                  opacity: characterPlacesCount <= 0 ? 0.45 : 1,
                  cursor: characterPlacesCount <= 0 ? 'default' : 'pointer',
                }}
              >
                −
              </button>

              <div
                style={{
                  height: 'clamp(56px, 8vh, 72px)',
                  borderRadius: 16,
                  background: '#F1F1F1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'clamp(28px, 7vw, 32px)',
                  fontWeight: 700,
                  color: '#1C1C1F',
                }}
              >
                {characterPlacesCount}
              </div>

              <button
                onClick={increaseCharacterPlaces}
                disabled={characterPlacesCount >= 3}
                style={{
                  width: 56,
                  height: 56,
                  border: 'none',
                  borderRadius: 18,
                  background: 'transparent',
                  color: '#FFFFFF',
                  fontSize: 34,
                  lineHeight: 1,
                  opacity: characterPlacesCount >= 3 ? 0.45 : 1,
                  cursor: characterPlacesCount >= 3 ? 'default' : 'pointer',
                }}
              >
                +
              </button>
            </div>

            <div
              style={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: 360,
                  height: '100%',
                  minHeight: 260,
                }}
              >
                {!!selectedCharacterPhrase && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 'clamp(4px, 2vw, 16px)',
                      bottom: 'clamp(105px, 16vw, 145px)',
                      width: 151,
                      height: 82,
                      boxSizing: 'border-box',
                      background: '#FFFFFF',
                      border: '2px solid #1C1C1C',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      padding: '8px 10px',
                      fontSize: 14,
                      lineHeight: 1.2,
                      color: '#1C1C1F',
                      zIndex: 2,
                    }}
                  >
                    {selectedCharacterPhrase}
                  </div>
                )}

                <img
                  src={selectedCharacter.counterImage}
                  alt={selectedCharacter.fullName}
                  style={{
                    position: 'absolute',
                    left: 0,
                    bottom: 0,
                    width: 'clamp(220px, 64vw, 300px)',
                    height: 'auto',
                    objectFit: 'contain',
                    objectPosition: 'left bottom',
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                paddingTop: 4,
              }}
            >
              <button
                onClick={() => setScreen('characterIntro')}
                style={{
                  width: '100%',
                  height: 52,
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

              <button
                onClick={() => setScreen('spinner')}
                disabled={characterPlacesCount < 1}
                style={{
                  width: '100%',
                  height: 54,
                  borderRadius: 40,
                  border: 'none',
                  background: characterPlacesCount >= 1 ? '#1C1C1F' : '#7A7A7A',
                  color: '#FFFFFF',
                  fontSize: 18,
                  cursor: characterPlacesCount >= 1 ? 'pointer' : 'default',
                }}
              >
                Далее
              </button>
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
              paddingBottom: 4,
            }}
          >
            <div style={{ flexShrink: 0 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                <img
                  src={rulesImage}
                  alt=""
                  style={{
                    width: '90%',
                    maxWidth: 250,
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
                }}
              >
                Выбери свое, и фортуна откроет, куда тебе отправиться сегодня...
              </div>
            </div>

            <div
              style={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 10,
                  width: '100%',
                  alignContent: 'flex-start',
                }}
              >
                {vibes.map((vibe) => {
                  const isActive = selectedVibe === vibe.value

                  return (
                    <button
                      key={vibe.value}
                      onClick={() => setSelectedVibe(vibe.value)}
                      style={{
                        flex: '1 1 auto',
                        minWidth: '35%',
                        maxWidth: '100%',
                        minHeight: 44,
                        borderRadius: 30,
                        border: isActive ? '1px solid #125BEC' : '1px solid #1C1C1F',
                        background: isActive ? '#125BEC' : '#FFFFFF',
                        color: isActive ? '#FFFFFF' : '#1C1C1F',
                        fontSize: 15,
                        fontWeight: 500,
                        padding: '10px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        boxSizing: 'border-box',
                        cursor: 'pointer',
                      }}
                    >
                      {vibe.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div
              style={{
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                paddingTop: 12,
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

      {
        screen === 'categories' && (
          <MobileScreen background={screenBackground}>
            <div
              style={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                paddingTop: 45,
                paddingBottom: 4,
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
                    display: 'flex',
                    flexWrap: 'wrap',
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
                          flex: '1 1 auto',
                          minWidth: '35%',
                          maxWidth: '100%',
                          minHeight: 44,
                          borderRadius: 30,
                          border: isActive ? '1px solid #125BEC' : '1px solid #1C1C1F',
                          background: isActive ? '#125BEC' : '#FFFFFF',
                          color: isActive ? '#FFFFFF' : '#1C1C1F',
                          fontSize: 15,
                          fontWeight: 500,
                          padding: '10px 16px',
                          lineHeight: 1.2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          boxSizing: 'border-box',
                          cursor: 'pointer',
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
                  marginTop: 'auto',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  flexShrink: 0,
                  paddingTop: 8,
                  paddingBottom: 0,
                }}
              >
                <button
                  onClick={handleGoToSpinner}
                  disabled={selectedCategories.length < 1 || selectedCategories.length > 3}
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
                  Далее
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
        )
      }

      {screen === 'spinner' && (
        <MobileScreen background="#ffffff">
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: 'grid',
              gridTemplateRows: 'minmax(0, 1fr) auto',
              rowGap: 18,
              paddingTop: 64,
              paddingBottom: 4,
            }}
          >
            <div
              style={{
                minHeight: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: 'clamp(260px, 78vw, 360px)',
                  aspectRatio: `${SLOT_MACHINE_RATIO}`,
                  position: 'relative',
                  flexShrink: 0,
                  margin: '0 auto',
                  transform: 'translateX(8px)',
                }}
              >
                <img
                  src={slotMachineImg}
                  alt="Slot Machine"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    zIndex: 2,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    top: SLOT_WINDOW.top,
                    left: SLOT_WINDOW.left,
                    width: SLOT_WINDOW.width,
                    height: SLOT_WINDOW.height,
                    zIndex: 1,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div
                      style={{
                        width: SLOT_WINDOW.itemWidth,
                        height: '100%',
                        background: '#125BEC',
                        borderRadius: SLOT_WINDOW.radius,
                      }}
                    />
                    <div
                      style={{
                        width: SLOT_WINDOW.itemWidth,
                        height: '100%',
                        background: '#125BEC',
                        borderRadius: SLOT_WINDOW.radius,
                      }}
                    />
                    <div
                      style={{
                        width: SLOT_WINDOW.itemWidth,
                        height: '100%',
                        background: '#125BEC',
                        borderRadius: SLOT_WINDOW.radius,
                      }}
                    />
                  </div>

                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      overflow: 'hidden',
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
                </div>
              </div>
            </div>

            <div
              style={{
                flexShrink: 0,
                paddingBottom: 8,
              }}
            >
              {spinErrorMessage && (
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #1C1C1F',
                    padding: '8px 12px',
                    fontSize: 14,
                    color: '#1C1C1F',
                    textAlign: 'center',
                    lineHeight: 1.3,
                    borderRadius: 12,
                    marginBottom: 12,
                  }}
                >
                  {spinErrorMessage}
                </div>
              )}

              <div
                style={{
                  textAlign: 'center',
                  fontSize: 12,
                  color: '#8E8E93',
                  lineHeight: 1.4,
                  marginBottom: 5,
                }}
              >
                Ты потратишь {spinsCost} {spinsCost === 1 ? 'монету' : spinsCost > 1 && spinsCost < 5 ? 'монеты' : 'монет'}
              </div>

              <button
                onClick={handleSpin}
                disabled={isLoading || !hasEnoughSpinsForCurrentSelection}
                style={{
                  width: '100%',
                  height: 54,
                  borderRadius: 40,
                  border: 'none',
                  background: isLoading || !hasEnoughSpinsForCurrentSelection ? '#C7C7CC' : '#1C1C1F',
                  color: '#FFFFFF',
                  fontSize: 18,
                  marginBottom: 12,
                  cursor: isLoading || !hasEnoughSpinsForCurrentSelection ? 'default' : 'pointer',
                }}
              >
                {isLoading ? 'Крутим...' : 'Запустить автомат'}
              </button>

              <button
                onClick={() => setScreen(mode === 'character' ? 'characterSetup' : 'categories')}
                disabled={isLoading}
                style={{
                  width: '100%',
                  height: 54,
                  borderRadius: 40,
                  border: '1px solid #1C1C1F',
                  background: '#FFFFFF',
                  color: '#1C1C1F',
                  fontSize: 18,
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

      {
        screen === 'result' && (
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
                    marginBottom: 10,
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
                  if (!hasEnoughSpinsForCurrentSelection) return
                  setScreen('spinner')
                }}
                disabled={!hasEnoughSpinsForCurrentSelection}
                style={{
                  width: '100%',
                  height: 54,
                  borderRadius: 40,
                  border: 'none',
                  background: hasEnoughSpinsForCurrentSelection ? '#1C1C1F' : '#C7C7CC',
                  color: '#FFFFFF',
                  fontSize: 18,
                  marginBottom: 10,
                  cursor: hasEnoughSpinsForCurrentSelection ? 'pointer' : 'default',
                }}
              >
                Крутить еще
              </button>

              <button
                onClick={() => setScreen(mode === 'character' ? 'characterSetup' : 'categories')}
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
        )
      }
    </div >
  )
}

export default App
