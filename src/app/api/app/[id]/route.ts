import {prisma} from "@/lib/prisma"
import {toPublicApp} from "@/lib/publicApp"

export const GET = async (req: Request, props: {params: Promise<{id: string}>}) => {
  const params = await props.params
  const app = await prisma.app.findUnique({
    where: {
      id: params.id
    }
  })
  if (!app) {
    return Response.json({message: 'App not found'}, {status: 404})
  }
  return Response.json(toPublicApp(app))
}
