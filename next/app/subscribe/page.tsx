import SubscribeClient from './SubscribeClient'

export const metadata = {
  title: 'Subscribe — AfriDigest',
  description: 'Subscribe to AfriDigest newsletters and exclusive updates.',
}

type Props = {
  searchParams?: Promise<{ canceled?: string }>
}

export default async function SubscribePage({ searchParams }: Props){
  const params = (await searchParams) || {}
  const canceled = params.canceled === '1'
  return <SubscribeClient canceled={canceled} />
}
