import {prisma} from "@/lib/prisma"
import {toPublicApp} from "@/lib/publicApp"
import {resolveApiKey} from "@/lib/resolveApiKey"

export async function POST(req: Request) {
  const  {id, ...data} = await req.json()
  const key = await resolveApiKey(id, data.url, data.api_key)
  if ('error' in key) {
    return key.error
  }
  const normalizedData = {
    ...data,
    api_key: key.apiKey,
    type: data.type.toLowerCase()
  }
  let app
  if (id) {
    app = await prisma.app.update({
      where: {
        id,
      },
      data: normalizedData,
    })
  } else {
    app = await prisma.app.create({
      data: normalizedData,
    })
  }

  return Response.json(toPublicApp(app))
}
