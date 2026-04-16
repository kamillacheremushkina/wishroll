/// <reference types="vite/client" />

declare module '*.svg' {
  const src: string
  export default src
}

declare const ym: (
  id: number,
  method: 'reachGoal',
  target: string,
  params?: Record<string, unknown>
) => void