import * as React from 'react'
import { Body, Container, Head, Heading, Html, Link, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  planLabel?: string
}

export function SubscriptionWelcomeEmail({ name = '', planLabel = 'Başlangıç' }: Props) {
  return (
    <Html lang="tr">
      <Head />
      <Preview>{`OneCite ${planLabel} planınız aktif`}</Preview>
      <Body style={{ backgroundColor: '#f6f7f9', fontFamily: 'Manrope, Helvetica, Arial, sans-serif', margin: 0, padding: '32px 0' }}>
        <Container style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 32, maxWidth: 560 }}>
          <Heading style={{ fontSize: 22, margin: '0 0 12px' }}>{planLabel} planınız aktif</Heading>
          <Text style={{ fontSize: 15, lineHeight: '24px', color: '#334155' }}>
            {name ? `Merhaba ${name},` : 'Merhaba,'} OneCite {planLabel} aboneliğiniz başladı. Yeni limitleriniz
            panelinizde anında geçerli.
          </Text>
          <Section style={{ margin: '20px 0' }}>
            <Text style={{ fontSize: 15, lineHeight: '24px', color: '#334155', margin: 0 }}>
              Sıradaki adımlar:
              <br />1. Markanızı ve prompt listenizi genişletin.
              <br />2. Yeni bir ölçüm başlatın ve atıf payınızı görün.
              <br />3. Kanıt boşluklarını görevlere dönüştürün.
            </Text>
          </Section>
          <Link
            href="https://www.1cite.com/app"
            style={{ display: 'inline-block', backgroundColor: '#0f172a', color: '#ffffff', padding: '12px 20px', borderRadius: 8, fontSize: 15, textDecoration: 'none' }}
          >
            Panele git
          </Link>
          <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 28 }}>OneCite · 1cite.com</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template: TemplateEntry = {
  component: SubscriptionWelcomeEmail,
  subject: (data) => `OneCite ${data['planLabel'] ?? ''} planınız aktif`,
  displayName: 'Abonelik hoş geldiniz',
  previewData: { name: 'Bora', planLabel: 'Büyüme' },
}
