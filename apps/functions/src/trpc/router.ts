import { router } from './trpc'
import { userRouter } from './routers/user'
import { medicationRouter } from './routers/medication'

export const appRouter = router({
  user: userRouter,
  medication: medicationRouter,
})

export type AppRouter = typeof appRouter
