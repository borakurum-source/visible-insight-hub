import * as React from 'react'
import { render } from '@react-email/render'
import { EmailAPIError, sendLovableEmail } from '@lovable.dev/email-js'
import { TEMPLATES } from './registry'

// Server-only: reads LOVABLE_API_KEY. Never import from client components.

// Configuration baked in at scaffold time
const SITE_NAME = "OneCite"
// SENDER_DOMAIN is the verified sender subdomain FQDN (e.g., "notify.example.com").
// It MUST match the subdomain delegated to Lovable's nameservers. NEVER use the root domain.
const SENDER_DOMAIN = "notify.1cite.com"
// FROM_DOMAIN is the domain shown in the From: header (e.g., "example.com").
// Can be the root domain when display_from_root is enabled — this is cosmetic only.
const FROM_DOMAIN = "notify.1cite.com"

export type SendTemplateEmailResult =
  | { sent: true }
  | { sent: false; reason: 'recipient_suppressed' }

export interface SendTemplateEmailOptions {
  templateData?: Record<string, any>
  /** Dedupes retries of the same logical send; defaults to a random UUID (no dedupe). */
  idempotencyKey?: string
  replyTo?: string
}

/**
 * Renders a registered template and sends it through Lovable's managed email
 * API. Suppression, retries, and rate limits are enforced by Lovable
 * server-side. A suppressed recipient is an expected outcome
 * ({ sent: false }); any other failure throws — EmailAPIError exposes
 * .code and .status for branching.
 */
export async function sendTemplateEmail(
  templateName: string,
  to: string,
  options: SendTemplateEmailOptions = {}
): Promise<SendTemplateEmailResult> {
  const apiKey = process.env['LOVABLE_API_KEY']
  if (!apiKey) {
    throw new Error('LOVABLE_API_KEY is not configured')
  }

  const template = TEMPLATES[templateName]
  if (!template) {
    throw new Error(
      `Template '${templateName}' not found. Available: ${Object.keys(TEMPLATES).join(', ')}`
    )
  }

  // Template-level `to` takes precedence — notification templates always
  // send to their fixed address.
  const recipient = template.to || to
  if (!recipient) {
    throw new Error('Recipient is required (the template defines no fixed recipient)')
  }

  const templateData = options.templateData ?? {}
  const element = React.createElement(template.component, templateData)
  let html = await render(element)
  let text = await render(element, { plainText: true })
  let subject =
    typeof template.subject === 'function'
      ? template.subject(templateData)
      : template.subject

  // Yonetim panelinden duzenlenmis sablon varsa onu kullan.
  const override = await loadTemplateOverride(templateName, templateData)
  if (override) {
    subject = override.subject
    html = override.html
    text = override.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }

  const { recordEmailLog } = await import('@/lib/observability.server')

  try {
    await sendLovableEmail(
      {
        to: recipient,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject,
        html,
        text,
        purpose: 'transactional',
        label: templateName,
        idempotency_key: options.idempotencyKey || crypto.randomUUID(),
        ...(options.replyTo ? { reply_to: options.replyTo } : {}),
      },
      { apiKey, sendUrl: process.env['LOVABLE_SEND_URL'] }
    )
  } catch (error) {
    if (error instanceof EmailAPIError && error.code === 'recipient_suppressed') {
      recordEmailLog({ toEmail: recipient, subject, templateKey: templateName, status: 'suppressed' })
      return { sent: false, reason: 'recipient_suppressed' }
    }
    recordEmailLog({
      toEmail: recipient, subject, templateKey: templateName, status: 'failed', error: String(error),
    })
    throw error
  }

  recordEmailLog({ toEmail: recipient, subject, templateKey: templateName, status: 'sent' })
  return { sent: true }
}

/** Veritabanindaki sablon override'ini okur ve {{degisken}} yer tutucularini doldurur. */
async function loadTemplateOverride(
  key: string,
  data: Record<string, any>
): Promise<{ subject: string; html: string } | null> {
  try {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data: row } = await supabaseAdmin
      .from('email_templates')
      .select('subject, body')
      .eq('key', key)
      .maybeSingle()
    if (!row?.body) return null
    return { subject: fillPlaceholders(row.subject, data), html: fillPlaceholders(row.body, data) }
  } catch {
    return null
  }
}

export function fillPlaceholders(input: string, data: Record<string, any>): string {
  return input.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, path: string) => {
    const value = path.split('.').reduce<any>((acc, part) => (acc == null ? acc : acc[part]), data)
    return value == null ? '' : String(value)
  })
}
