import { AUTH_ROUTES } from '@/libs/enums'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function Home() {

  const router = useRouter()

  useEffect(() => {
    router.push(AUTH_ROUTES.LOGIN)
  }, [router])

  return (<main></main>)

}
