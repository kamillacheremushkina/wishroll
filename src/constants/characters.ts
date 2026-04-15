import vitiaTouristCardImg from '../assets/characters/vitia-tourist-card.svg'
import vitiaTouristCounterImg from '../assets/characters/vitia-tourist-counter.svg'

export type Character = {
  id: string
  fullName: string
  archetypeName: string
  description: string
  cardImage: string
  counterImage: string
  phraseOptions: string[]
  categoryPool: number[]
  positiveCriteria: string[]
  antiCriteria: string[]
  buttonLabel: string
  resultBadgeLabel: string
}

export const WEEKLY_CHARACTER_ID = 'vitia-tourist'

export const characters: Character[] = [
  {
    id: 'vitia-tourist',
    fullName: 'Витя-турист',
    archetypeName: 'Витя',
    description:
      'Уверен, что за один день можно понять Петербург, если успеть в музей, на крышу и в модное кафе.',
    cardImage: vitiaTouristCardImg,
    counterImage: vitiaTouristCounterImg,
    phraseOptions: [
      'А это уже Эрмитаж?',
      'А когда разведут мосты?',
      'Тут всегда так ветрено?',
      'Мы точно туда идём или опять вдоль канала просто гуляем?',
      'Я больше не могу отличать собор от дворца.',
      'Я в Петербурге второй день и уже говорю «эстетично»',
    ],
    categoryPool: [13, 1, 5],
    positiveCriteria: [
      'atmospheric',
      'active',
      'lively',
      'aesthetic',
      'inspiring',
      'novel',
    ],
    antiCriteria: [],
    buttonLabel: 'Отправиться с Витей',
    resultBadgeLabel: 'Выбор Вити',
  },
]