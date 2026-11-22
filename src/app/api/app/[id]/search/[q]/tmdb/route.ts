import withApi, {NextRequestWithApi} from "@/lib/withApi"

async function getHandler(req: NextRequestWithApi, {params}: {params: {id: string, q: string}}) {
  const encoder = new TextEncoder()
  let cancelled = false

  const isMovieAdded = async (tmdbId: number) => {
    const resp = await req.api.movie.get(undefined, tmdbId)
    if (resp.status < 200 || resp.status >= 300 || !Array.isArray(resp.data)) {
      const reason = resp.data?.message || resp.statusText || `HTTP ${resp.status}`
      throw new Error(`${req.app.name} request failed: ${reason}`)
    }
    return resp.data.length > 0
  }

  const readableStream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        if (!cancelled) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        }
      }

      try {
        const {q} = await params
        const resp = await req.api.tmdbSearch(q, async (page) => {
          if (cancelled) {
            // Client went away: stop paging through TMDB.
            throw new Error('Search cancelled by client')
          }
          page.data.results = await Promise.all(page.data.results.map(async (result) => ({
            ...result,
            movieAdded: await isMovieAdded(result.id)
          })))
          send(page.data)
        })
        if (resp.status === 402) {
          send({message: 'TMDB API key is not configured'})
        }
      } catch (e) {
        if (!cancelled) {
          console.error('TMDB search failed:', e)
          send({message: e instanceof Error ? e.message : 'Search failed'})
        }
      } finally {
        if (!cancelled) {
          controller.close()
        }
      }
    },
    cancel() {
      cancelled = true
    },
  })

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache, no-transform',
      'Content-Encoding': 'none',
    },
  })
}

export const GET = withApi(getHandler)
