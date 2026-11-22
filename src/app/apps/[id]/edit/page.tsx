import {prisma} from "@/lib/prisma"
import Edit from "@/components/EditApp"
import {toPublicApp} from "@/lib/publicApp"

export default async function EditApp(props: {params: Promise<{id: string}>}) {
  const params = await props.params
  const app = await prisma.app.findUnique({
    where: {
      id: params.id,
    },
  })

  if (!app) {
    return <h1>App not found</h1>
  }

  // Never pass the API key to the client component: props are serialized into the page.
  return (
    <Edit app={toPublicApp(app)} />
  )
}
