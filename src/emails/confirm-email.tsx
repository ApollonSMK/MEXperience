import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface ConfirmEmailTemplateProps {
  userEmail: string;
  confirmationLink: string;
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const ConfirmEmailTemplate = ({
  userEmail,
  confirmationLink,
}: ConfirmEmailTemplateProps) => (
  <Html>
    <Head />
    <Preview>Confirme a sua conta M.E. Wellness</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
            <Text style={logo}>M.E. Wellness</Text>
        </Section>
        <Section style={content}>
          <Heading style={heading}>Confirme o seu endereço de email</Heading>
          <Text style={paragraph}>Olá!</Text>
          <Text style={paragraph}>
            Obrigado por se juntar à M.E. Wellness Experience. Por favor, clique no botão abaixo para ativar a sua conta e começar a sua jornada de bem-estar.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={confirmationLink}>
              Confirmar Conta
            </Button>
          </Section>
          <Text style={paragraph}>
            Se não se registou no nosso site, por favor ignore este email.
          </Text>
          <Text style={signature}>A equipa M.E. Wellness</Text>
        </Section>
        <Section style={footer}>
          <Text style={footerText}>
            &copy; {new Date().getFullYear()} M.E. Wellness Experience. Todos os direitos reservados.
          </Text>
           <Link href="https://me-experience.lu" style={footerLink}>me-experience.lu</Link>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default ConfirmEmailTemplate;

const main = {
  backgroundColor: '#f0f2f5',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  maxWidth: '600px',
  margin: '40px auto',
  backgroundColor: '#171a21',
  borderRadius: '12px',
  border: '1px solid #2a2f3b',
  overflow: 'hidden',
};

const header = {
  padding: '30px 40px',
  backgroundColor: '#1c1f28',
  textAlign: 'center' as const,
};

const logo = {
 fontFamily: '"Montserrat", sans-serif',
  fontSize: '36px',
  fontWeight: '700',
  color: '#e6f0ff',
  textDecoration: 'none',
}

const content = {
  padding: '40px',
  textAlign: 'center' as const,
  lineHeight: '1.6',
  color: '#a0a7b5',
};

const heading = {
  fontFamily: '"Montserrat", sans-serif',
  fontSize: '28px',
  color: '#6ea8fe',
  margin: '0 0 20px',
};

const paragraph = {
  fontSize: '16px',
  margin: '0 0 20px',
};

const buttonContainer = {
  margin: '30px 0',
};

const button = {
  display: 'inline-block',
  padding: '14px 28px',
  backgroundColor: '#ffc107',
  color: '#171a21',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  textDecoration: 'none',
  borderRadius: '8px',
};

const signature = {
    ...paragraph,
    fontStyle: 'italic',
}

const footer = {
  padding: '20px',
  textAlign: 'center' as const,
  backgroundColor: '#1c1f28',
};

const footerText = {
  fontSize: '12px',
  color: '#a0a7b5',
  margin: '0 0 5px 0'
};

const footerLink = {
    fontSize: '12px',
    color: '#6ea8fe',
    textDecoration: 'none',
}
