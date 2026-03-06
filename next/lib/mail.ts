import nodemailer from 'nodemailer'

type MailInput = {
  to: string
  subject: string
  text: string
}

function getMissingSmtpConfig(){
  const service = process.env.SMTP_SERVICE
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  const missing: string[] = []
  if(!user) missing.push('SMTP_USER')
  if(!pass) missing.push('SMTP_PASS')
  if(!service && !host) missing.push('SMTP_SERVICE or SMTP_HOST')
  return missing
}

function getTransport(){
  const service = process.env.SMTP_SERVICE
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if(!user || !pass) return null

  if(service){
    return nodemailer.createTransport({
      service,
      auth: { user, pass },
    })
  }

  if(!host) return null

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

export async function sendMail(input: MailInput){
  const missing = getMissingSmtpConfig()
  if(missing.length > 0){
    return { sent: false, reason: `SMTP not configured: missing ${missing.join(', ')}` }
  }

  const transport = getTransport()
  if(!transport) return { sent: false, reason: 'SMTP transport could not be created' }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@afridigest.local'
  try{
    await transport.verify()
    await transport.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
    })
  }catch(err: any){
    return { sent: false, reason: err?.message || 'SMTP delivery failed' }
  }

  return { sent: true }
}
