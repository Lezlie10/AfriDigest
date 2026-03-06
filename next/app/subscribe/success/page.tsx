import SubscribeSuccessClient from './SubscribeSuccessClient'

export const metadata = {
  title: 'Subscription Confirmed — AfriDigest',
  description: 'Confirming your AfriDigest paid subscription.',
}

type Props = {
  searchParams?: Promise<{ session_id?: string; reference?: string; trxref?: string }>
}

export default async function SubscribeSuccessPage({ searchParams }: Props){
  const params = (await searchParams) || {}
  const sessionId = params.session_id || ''
  const reference = params.reference || params.trxref || ''
  return <SubscribeSuccessClient sessionId={sessionId} reference={reference} />
}
