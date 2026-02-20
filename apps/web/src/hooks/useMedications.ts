import { trpc } from '../lib/trpc'

export function useMedications(q: string | null) {
  return trpc.medication.search.useQuery({ q: q ?? '' }, { enabled: Boolean(q && q.length > 0) })
}
