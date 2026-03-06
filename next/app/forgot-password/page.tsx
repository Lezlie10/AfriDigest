import ForgotPasswordClient from './ForgotPasswordClient'

export const metadata = {
  title: 'Forgot Password — AfriDigest',
  description: 'Request a password reset code sent to your email.',
}

export default function ForgotPasswordPage(){
  return <ForgotPasswordClient />
}
