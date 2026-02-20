import { z } from 'zod'

export const InteractionSeverity = z.union([
  z.literal('minor'),
  z.literal('moderate'),
  z.literal('major'),
])

export const InteractionReference = z.object({
  title: z.string().optional(),
  url: z.string().url().optional(),
  source: z.string().optional(),
})

export const InteractionSchema = z.object({
  id: z.string().min(1),
  medicationAId: z.string().min(1),
  medicationBId: z.string().min(1),
  severity: InteractionSeverity,
  description: z.string().optional(),
  references: z.array(InteractionReference).optional(),
  createdBy: z.string().optional(),
  createdAt: z.string().optional(),
})

export type Interaction = z.infer<typeof InteractionSchema>
