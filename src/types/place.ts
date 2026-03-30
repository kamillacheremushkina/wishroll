export type Place = {
  id: number
  title: string
  description: string
  latitude: number
  longitude: number
  address: string
  open_time: string
  close_time: string
  rating: number
  category: number
  vibes: string[]
  image_url?: string | null
  is_active?: boolean | null
}