import {prisma} from "@/lib/prisma"
import {notFound, redirect} from "next/navigation"

export default async function AppPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const app = await prisma.app.findUnique({
    where: {
      id: params.id,
    },
  })
  if (!app) {
    notFound()
  }

  redirect(`/apps/${app.id}/search`)
}
