import fs from 'fs'
import path from 'path'

const requiredVars = [
  'NEXT_PUBLIC_SITE_URL',
  'DATABASE_URL',
  'AUTH_SECRET',
  'ADMIN_TOKEN',
]

const conditionalGroups = [
  {
    label: 'Stripe payment mode',
    vars: ['STRIPE_SECRET_KEY', 'STRIPE_PRICE_ID'],
  },
  {
    label: 'Paystack payment mode',
    vars: ['PAYSTACK_SECRET_KEY', 'PAYSTACK_PLAN_CODE'],
  },
]

function parseEnvFile(filePath){
  if(!fs.existsSync(filePath)) return {}
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split(/\r?\n/)
  const result = {}

  for(const line of lines){
    const trimmed = line.trim()
    if(!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if(eqIndex <= 0) continue
    const key = trimmed.slice(0, eqIndex).trim()
    const rawValue = trimmed.slice(eqIndex + 1).trim()
    const value = rawValue.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
    result[key] = value
  }

  return result
}

const cwd = process.cwd()
const envFromFiles = {
  ...parseEnvFile(path.join(cwd, '.env')),
  ...parseEnvFile(path.join(cwd, '.env.local')),
}

function getVar(name){
  return process.env[name] ?? envFromFiles[name]
}

function isSet(name){
  const value = getVar(name)
  return Boolean(value && String(value).trim())
}

function checkRequired(){
  return requiredVars.filter((name) => !isSet(name))
}

function checkPaymentMode(){
  const stripeReady = conditionalGroups[0].vars.every(isSet)
  const paystackReady = conditionalGroups[1].vars.every(isSet)
  return stripeReady || paystackReady
}

const missingRequired = checkRequired()
const hasPaymentMode = checkPaymentMode()

console.log('Deployment env check')
console.log('--------------------')

if(missingRequired.length === 0){
  console.log('Required vars: OK')
} else {
  console.log('Missing required vars:')
  missingRequired.forEach((name) => console.log(`- ${name}`))
}

if(hasPaymentMode){
  console.log('Payment vars: OK (Stripe or Paystack detected)')
} else {
  console.log('Payment vars: MISSING')
  console.log('- Set Stripe vars (STRIPE_SECRET_KEY + STRIPE_PRICE_ID)')
  console.log('  or')
  console.log('- Set Paystack vars (PAYSTACK_SECRET_KEY + PAYSTACK_PLAN_CODE)')
}

if(missingRequired.length > 0 || !hasPaymentMode){
  process.exitCode = 1
  console.log('\nStatus: NOT ready for deployment yet.')
} else {
  console.log('\nStatus: Ready for deployment.')
}
