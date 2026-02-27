import { z } from 'zod'
import { router, publicProcedure } from '../trpc.js'
import { MedicationSchema } from '@repo/shared'

const MEDICATIONS = [
  {
    id: 'med-1',
    name: 'Aspirin',
    genericName: 'Acetylsalicylic acid',
    route: 'oral',
    indications: ['pain', 'fever'],
  },
  {
    id: 'med-2',
    name: 'Paracetamol',
    genericName: 'Acetaminophen',
    route: 'oral',
    indications: ['pain', 'fever'],
  },
  {
    id: 'med-3',
    name: 'Amoxicillin',
    genericName: 'Amoxicillin',
    route: 'oral',
    indications: ['infection'],
  },
  {
    id: 'med-4',
    name: 'Ibuprofen',
    genericName: 'Ibuprofen',
    route: 'oral',
    indications: ['inflammation', 'pain'],
  },
]

export const medicationRouter = router({
  search: publicProcedure
    .input(z.object({ q: z.string().min(1) }))
    .output(z.array(MedicationSchema))
    .query(({ input }) => {
      const q = input.q.toLowerCase()
      return MEDICATIONS.filter(
        m => m.name.toLowerCase().includes(q) || (m.genericName || '').toLowerCase().includes(q)
      )
    }),
})
