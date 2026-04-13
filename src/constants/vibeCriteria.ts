export const vibeCriteriaMap = {
  razryaditsya: {
    label: 'Разрядиться',
    positive: ['active', 'lively', 'loud', 'social', 'distracting', 'freeing'],
    anti: ['quiet', 'slow', 'intimate'],
  },
  vosstanovitsya: {
    label: 'Восстановиться',
    positive: ['calm', 'quiet', 'restorative', 'cozy', 'solo-friendly', 'intimate'],
    anti: ['loud', 'active', 'lively'],
  },
  zabitsya: {
    label: 'Забыться',
    positive: ['immersive', 'distracting', 'atmospheric', 'novel', 'aesthetic', 'solo-friendly'],
    anti: ['restorative', 'social', 'active'],
  },
  rasslabitsya: {
    label: 'Расслабиться',
    positive: ['calm', 'slow', 'cozy', 'quiet', 'intimate', 'freeing'],
    anti: ['loud', 'active', 'lively'],
  },
  vdohnovitsya: {
    label: 'Вдохновиться',
    positive: ['inspiring', 'aesthetic', 'atmospheric', 'novel', 'immersive', 'freeing'],
    anti: ['distracting', 'loud'],
  },
  siyat: {
    label: 'Сиять',
    positive: ['social', 'lively', 'aesthetic', 'active', 'freeing', 'novel'],
    anti: ['quiet', 'slow', 'intimate'],
  },
} as const

export type VibeKey = keyof typeof vibeCriteriaMap

export function getPriorityTier(positiveMatches: number, antiMatches: number) {
  const hasAnti = antiMatches > 0

  if (!hasAnti) {
    if (positiveMatches === 6) return 5
    if (positiveMatches === 5) return 4
    if (positiveMatches === 4) return 3
    if (positiveMatches === 3) return 2
    return 0
  }

  if (positiveMatches >= 4) {
    return 1
  }

  return 0
}