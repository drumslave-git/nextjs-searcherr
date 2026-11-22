import {prisma} from "@/lib/prisma"
import {toPublicApp} from "@/lib/publicApp"

export const dynamic = 'force-dynamic'

export async function GET() {
  const apps = await prisma.app.findMany()
  return Response.json(apps.map(toPublicApp))
}
