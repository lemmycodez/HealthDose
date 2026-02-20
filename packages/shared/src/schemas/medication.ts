import { z } from 'zod'

export const MedicationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  genericName: z.string().optional(),
  route: z.string().optional(),
  indications: z.array(z.string()).optional(),
})

export type Medication = z.infer<typeof MedicationSchema>
