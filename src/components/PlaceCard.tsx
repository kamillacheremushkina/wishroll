const categoryMap: Record<number, string> = {
  0: 'Кафе',
  1: 'Рестораны',
  2: 'Кофе и выпечка',
  3: 'Бары',
  4: 'Театры',
  5: 'Культура',
  6: 'Пешие прогулки',
  7: 'Шоппинг',
  8: 'Активный отдых',
  9: 'Кино и шоу',
  10: 'Развлечения',
  11: 'Временные события',
  12: 'Дворы и парадные',
  13: 'Культовые места',
  14: 'Коворки',
  15: 'Однодневные путешествия',
}

const priceMap: Record<number, string> = {
  0: 'Бесплатно',
  1: 'До 1000 ₽',
  2: 'До 1500 ₽',
  3: 'До 2000 ₽',
  4: 'До 2500 ₽',
  5: 'От 3000 ₽',
  6: 'От 5000 ₽',
}

type Place = {
  id: number
  title: string
  address: string
  description: string
  image_url?: string | null
  category: number
  avg_price: number
  matchPercent?: number
  resultBadgeLabel?: string
}

type PlaceCardProps = {
  place: Place
  onCopy: () => void
}

function truncateText(text: string, maxLength: number) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '...'
}

function PlaceCard({ place, onCopy }: PlaceCardProps) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(place.address)
    onCopy()
  }

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 400,
        margin: '0 auto',
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
        background: '#D9D9D9',
      }}
    >
      <img
        src={place.image_url || '/placeholder-image.png'}
        alt={place.title}
        style={{
          width: '100%',
          height: 180,
          objectFit: 'cover',
          objectPosition: 'center',
          display: 'block',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          background: '#FFFFFF',
          color: '#125BEC',
          padding: '4px 10px',
          borderRadius: 14,
          fontSize: 12,
          fontWeight: 500,
        }}
      >
        {priceMap[place.avg_price] ?? 'Цена не указана'}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 6,
          maxWidth: 150,
        }}
      >
        <div
          style={{
            background: '#125BEC',
            color: '#FFFFFF',
            padding: '4px 10px',
            borderRadius: 14,
            fontSize: 12,
            fontWeight: 500,
            textAlign: 'center',
            lineHeight: 1.2,
          }}
        >
          {categoryMap[place.category] ?? 'Категория'}
        </div>

        {place.resultBadgeLabel ? (
          <div
            style={{
              background: 'rgba(255,255,255,0.92)',
              color: '#125BEC',
              padding: '4px 10px',
              borderRadius: 14,
              fontSize: 12,
              fontWeight: 500,
              textAlign: 'center',
              lineHeight: 1.2,
            }}
          >
            {place.resultBadgeLabel}
          </div>
        ) : typeof place.matchPercent === 'number' ? (
          <div
            style={{
              background: 'rgba(255,255,255,0.92)',
              color: '#125BEC',
              padding: '4px 10px',
              borderRadius: 14,
              fontSize: 12,
              fontWeight: 500,
              textAlign: 'center',
              lineHeight: 1.2,
            }}
          >
            Совпадение: {place.matchPercent}%
          </div>
        ) : null}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '100%',
          background: 'linear-gradient(to top, #1C1C1C, #1C1C1C00 80%)',
        }}
      />

      <div
        onClick={handleCopy}
        style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          width: 40,
          height: 40,
          background: 'rgba(28,28,31,0.8)',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <img
          src="/copy_pin.svg"
          alt="map"
          style={{
            width: 20,
            height: 20,
          }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 16,
          right: 68,
          color: '#FFFFFF',
          textAlign: 'left',
        }}
      >
        <h3
          style={{
            margin: '0 0 4px 0',
            fontSize: 18,
            lineHeight: 1.2,
          }}
        >
          {place.title}
        </h3>

        <p
          style={{
            margin: 0,
            fontSize: 13,
            opacity: 0.78,
            lineHeight: 1.3,
          }}
        >
          {truncateText(place.description, 90)}
        </p>
      </div>
    </div>
  )
}

export default PlaceCard