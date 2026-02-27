import { createHTTPServer } from '@trpc/server/adapters/standalone'
import { appRouter } from './router.js'

const PORT = Number(process.env.PORT || 8787)

const server = createHTTPServer({
  router: appRouter,
})

server.listen(PORT)
console.log(`tRPC server running on http://localhost:${PORT}`)
