const categoryMap: Record<number, string> = {
    1: 'Еда',
    2: 'Бары',
    3: 'Культура',
    4: 'Шоппинг',
    5: 'Коворки',
    6: 'Прогулки',
    7: 'Развлечения',
    8: 'Ночная жизнь',
}

type Place = {
    id: number
    title: string
    address: string
    description: string
    image_url: string
    category: number
    rating: number
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
            }}
        >
            <img
                src={place.image_url}
                alt={place.title}
                style={{
                    width: '100%',
                    height: 180,
                    objectFit: 'cover',
                    objectPosition: 'center',
                    display: 'block',
                }}
            />
            {/* рейтинг */}
            <div
                style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    display: 'flex',
                    gap: 2,
                    zIndex: 2,
                    fontSize: 18,
                    lineHeight: 1,
                }}
            >
                {Array.from({ length: place.rating }, (_, index) => (
                    <span
                        key={index}
                        style={{
                            color: '#fff',
                            textShadow: '0 1px 4px rgba(0,0,0,0.35)',
                        }}
                    >
                        ★
                    </span>
                ))}
            </div>




            {/* категория */}
            <div
                style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    background: '#125BEC',
                    color: '#fff',
                    padding: '1px 12px',
                    borderRadius: 15,
                    fontSize: 12,
                }}
            >
                {categoryMap[place.category]}
            </div>

            {/* затемнение */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '100%',
                    background:
                        'linear-gradient(to top, #1C1C1C, #1C1C1C00 80%)',
                }}
            />

            {/* кнопка копирования */}
            <div
                onClick={handleCopy}
                style={{
                    position: 'absolute',
                    bottom: 12,
                    right: 12,
                    width: 40,
                    height: 40,
                    background: '#1C1C1F 60%',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                }}
            >
                <img
                    src="/map_pin.svg"
                    alt="map"
                    style={{
                        width: 20,
                        height: 20,
                    }}
                />
            </div>

            {/* уведомление */}

            {/* текст */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 12,
                    left: 16,
                    right: 100,
                    color: '#fff',
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
                        opacity: 0.7,
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