import { z } from 'zod'

export const AdviceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
  applicableMedicationIds: z.array(z.string()).optional(),
  authorId: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export type Advice = z.infer<typeof AdviceSchema>
