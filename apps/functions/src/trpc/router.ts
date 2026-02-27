import { router } from './trpc.js'
import { userRouter } from './routers/user.js'
import { medicationRouter } from './routers/medication.js'

export const appRouter = router({
  user: userRouter,
  medication: medicationRouter,
})

export type AppRouter = typeof appRouter
