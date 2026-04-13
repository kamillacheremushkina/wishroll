export type Place = {
  id: number
  title: string
  description: string
  address: string
  avg_price: number
  category: number
  criteria: string[]
  image_url?: string | null
  is_active?: boolean | null
  created_at?: string
}