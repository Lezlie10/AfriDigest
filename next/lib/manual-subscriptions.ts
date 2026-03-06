import fs from 'fs'
import path from 'path'
import { normalizeEmail, updateUserSubscriptionByEmail } from './users'
import { isPostgresEnabled, queryRows } from './postgres'

type SubscriberRecord = {
  id: number
  email: string
  fullName: string
  phone: string
  subscribedAt: string
  status: 'active'
  provider: string
  transferReference: string
}

function subscribersFilePath(){
  return path.join(process.cwd(), 'content', 'subscribers.json')
}

function mapDbSubscriber(row: any): SubscriberRecord {
  return {
    id: Number(row.id),
    email: String(row.email || ''),
    fullName: String(row.full_name || ''),
    phone: String(row.phone || ''),
    subscribedAt: String(row.subscribed_at || ''),
    status: 'active',
    provider: String(row.provider || 'manual-transfer'),
    transferReference: String(row.transfer_reference || ''),
  }
}

export async function readSubscribers(): Promise<SubscriberRecord[]>{
  if(isPostgresEnabled()){
    try{
      const rows = await queryRows(
        `SELECT id, email, full_name, phone, subscribed_at, provider, transfer_reference
         FROM subscribers
         ORDER BY subscribed_at DESC`,
      )
      return rows.map(mapDbSubscriber)
    }catch{
      // Fallback to file storage if DB is unavailable.
    }
  }

  const p = subscribersFilePath()
  if(!fs.existsSync(p)) return []
  const parsed = JSON.parse(fs.readFileSync(p, 'utf-8'))
  return Array.isArray(parsed) ? parsed : []
}

export async function writeSubscribers(items: SubscriberRecord[]){
  if(isPostgresEnabled()){
    try{
      for(const item of items){
        await queryRows(
          `INSERT INTO subscribers (
             id, email, full_name, phone, subscribed_at, status, provider, transfer_reference
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           ON CONFLICT (id) DO UPDATE SET
             email = EXCLUDED.email,
             full_name = EXCLUDED.full_name,
             phone = EXCLUDED.phone,
             subscribed_at = EXCLUDED.subscribed_at,
             status = EXCLUDED.status,
             provider = EXCLUDED.provider,
             transfer_reference = EXCLUDED.transfer_reference`,
          [
            item.id,
            item.email,
            item.fullName,
            item.phone,
            item.subscribedAt,
            item.status,
            item.provider,
            item.transferReference,
          ],
        )
      }
      return
    }catch{
      // Fallback to file storage if DB is unavailable.
    }
  }

  fs.writeFileSync(subscribersFilePath(), JSON.stringify(items, null, 2), 'utf-8')
}

export async function activateManualSubscription(input: {
  email: string
  fullName: string
  phone: string
  transferReference: string
  provider?: string
}){
  const email = normalizeEmail(input.email)
  const subscribers = await readSubscribers()
  const exists = subscribers.some((s) => s.email === email)

  if(!exists){
    subscribers.push({
      id: Date.now(),
      email,
      fullName: String(input.fullName || '').trim(),
      phone: String(input.phone || '').trim(),
      subscribedAt: new Date().toISOString(),
      status: 'active',
      provider: input.provider || 'manual-transfer',
      transferReference: String(input.transferReference || '').trim(),
    })
    await writeSubscribers(subscribers)
  }

  await updateUserSubscriptionByEmail(email, {
    status: 'active',
    plan: 'premium-manual',
    startedAt: new Date().toISOString(),
  })
}
