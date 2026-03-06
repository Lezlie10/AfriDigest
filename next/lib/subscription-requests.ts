import fs from 'fs'
import path from 'path'
import { isPostgresEnabled, queryRows } from './postgres'

export type SubscriptionRequestRecord = {
  id: number
  fullName: string
  email: string
  phone: string
  transferReference: string
  transferReferenceNormalized?: string
  receiptUrl?: string
  receiptFileName?: string
  amountNgn?: number
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt?: string
  reviewedAt?: string
  reviewNote?: string
}

function filePath(){
  return path.join(process.cwd(), 'content', 'subscription-requests.json')
}

function mapDbRequest(row: any): SubscriptionRequestRecord {
  return {
    id: Number(row.id),
    fullName: String(row.full_name || ''),
    email: String(row.email || ''),
    phone: String(row.phone || ''),
    transferReference: String(row.transfer_reference || ''),
    transferReferenceNormalized: row.transfer_reference_normalized || undefined,
    receiptUrl: row.receipt_url || undefined,
    receiptFileName: row.receipt_file_name || undefined,
    amountNgn: typeof row.amount_ngn === 'number' ? row.amount_ngn : (row.amount_ngn ? Number(row.amount_ngn) : undefined),
    status: row.status,
    createdAt: String(row.created_at || ''),
    updatedAt: row.updated_at || undefined,
    reviewedAt: row.reviewed_at || undefined,
    reviewNote: row.review_note || undefined,
  }
}

export async function readSubscriptionRequests(): Promise<SubscriptionRequestRecord[]>{
  if(isPostgresEnabled()){
    try{
      const rows = await queryRows(
        `SELECT id, full_name, email, phone, transfer_reference, transfer_reference_normalized,
                receipt_url, receipt_file_name, amount_ngn, status, created_at, updated_at, reviewed_at, review_note
         FROM subscription_requests
         ORDER BY created_at DESC`,
      )
      return rows.map(mapDbRequest)
    }catch{
      // Fallback to file storage if DB is unavailable.
    }
  }

  const p = filePath()
  if(!fs.existsSync(p)) return []
  const parsed = JSON.parse(fs.readFileSync(p, 'utf-8'))
  return Array.isArray(parsed) ? parsed : []
}

export async function writeSubscriptionRequests(items: SubscriptionRequestRecord[]){
  if(isPostgresEnabled()){
    try{
      for(const item of items){
        await queryRows(
          `INSERT INTO subscription_requests (
             id, full_name, email, phone, transfer_reference, transfer_reference_normalized,
             receipt_url, receipt_file_name, amount_ngn, status, created_at, updated_at, reviewed_at, review_note
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
           ON CONFLICT (id) DO UPDATE SET
             full_name = EXCLUDED.full_name,
             email = EXCLUDED.email,
             phone = EXCLUDED.phone,
             transfer_reference = EXCLUDED.transfer_reference,
             transfer_reference_normalized = EXCLUDED.transfer_reference_normalized,
             receipt_url = EXCLUDED.receipt_url,
             receipt_file_name = EXCLUDED.receipt_file_name,
             amount_ngn = EXCLUDED.amount_ngn,
             status = EXCLUDED.status,
             created_at = EXCLUDED.created_at,
             updated_at = EXCLUDED.updated_at,
             reviewed_at = EXCLUDED.reviewed_at,
             review_note = EXCLUDED.review_note`,
          [
            item.id,
            item.fullName,
            item.email,
            item.phone,
            item.transferReference,
            item.transferReferenceNormalized || null,
            item.receiptUrl || null,
            item.receiptFileName || null,
            item.amountNgn ?? null,
            item.status,
            item.createdAt,
            item.updatedAt || null,
            item.reviewedAt || null,
            item.reviewNote || null,
          ],
        )
      }
      return
    }catch{
      // Fallback to file storage if DB is unavailable.
    }
  }

  const p = filePath()
  const dir = path.dirname(p)
  if(!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(p, JSON.stringify(items, null, 2), 'utf-8')
}
