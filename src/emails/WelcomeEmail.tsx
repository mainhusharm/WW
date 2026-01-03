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

interface WelcomeEmailProps {
  userName: string;
  dashboardUrl: string;
}

export const WelcomeEmail = ({
  userName = 'Trader',
  dashboardUrl = 'https://traderedgepro.com/dashboard',
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Trader Edge Pro - Your journey to funded account success starts now!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo */}
          <Section style={logoSection}>
            <div style={logoBox}>
              <Text style={logoText}>TE</Text>
            </div>
            <Heading style={brandName}>
              TRADER EDGE <span style={brandAccent}>PRO</span>
            </Heading>
          </Section>

          {/* Welcome Box */}
          <Section style={welcomeBox}>
            <Heading style={welcomeHeading}>
              Welcome to the Future of Trading 🚀
            </Heading>
            <Text style={welcomeSubtext}>
              You've just unlocked access to elite trading tools
            </Text>
          </Section>

          {/* Main Content */}
          <Section style={contentSection}>
            <Text style={greeting}>
              Hey <strong>{userName}</strong>,
            </Text>
            <Text style={paragraph}>
              Congratulations on taking the first step towards clearing your
              funded account! You've joined an exclusive community of traders
              who are leveraging cutting-edge AI technology to achieve prop
              firm success.
            </Text>

            {/* Feature Cards */}
            <Section style={featuresSection}>
              <div style={featureCard}>
                <Text style={featureEmoji}>🤖</Text>
                <Heading style={featureTitle}>AI Trading Signals</Heading>
                <Text style={featureText}>Real-time market analysis</Text>
              </div>
              <div style={featureCard}>
                <Text style={featureEmoji}>📊</Text>
                <Heading style={featureTitle}>Risk Management</Heading>
                <Text style={featureText}>Smart position sizing</Text>
              </div>
              <div style={featureCard}>
                <Text style={featureEmoji}>🎯</Text>
                <Heading style={featureTitle}>Prop Firm Rules</Heading>
                <Text style={featureText}>Built-in compliance</Text>
              </div>
              <div style={featureCard}>
                <Text style={featureEmoji}>💬</Text>
                <Heading style={featureTitle}>24/7 Support</Heading>
                <Text style={featureText}>Expert assistance</Text>
              </div>
            </Section>

            {/* CTA Button */}
            <Section style={buttonSection}>
              <Button style={ctaButton} href={dashboardUrl}>
                Launch Your Dashboard →
              </Button>
            </Section>
          </Section>

          {/* Stats Section */}
          <Section style={statsSection}>
            <div style={statsBox}>
              <div style={statItem}>
                <Text style={statNumber}>15K+</Text>
                <Text style={statLabel}>Active Traders</Text>
              </div>
              <div style={statItem}>
                <Text style={statNumber}>89%</Text>
                <Text style={statLabel}>Success Rate</Text>
              </div>
              <div style={statItem}>
                <Text style={statNumber}>$2M+</Text>
                <Text style={statLabel}>Payouts Secured</Text>
              </div>
            </div>
          </Section>

          {/* Quick Start Guide */}
          <Section style={guideSection}>
            <Heading style={guideTitle}>⚡ Quick Start Guide</Heading>
            <div style={guideStep}>
              <Text style={stepNumber}>1</Text>
              <Text style={stepText}>Complete your trading profile setup</Text>
            </div>
            <div style={guideStep}>
              <Text style={stepNumber}>2</Text>
              <Text style={stepText}>Connect your prop firm account</Text>
            </div>
            <div style={guideStep}>
              <Text style={stepNumber}>3</Text>
              <Text style={stepText}>Start receiving AI-powered signals</Text>
            </div>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © 2024 Trader Edge Pro. All rights reserved.
            </Text>
            <Text style={footerLinks}>
              <Link href="#" style={footerLink}>Unsubscribe</Link> ·
              <Link href="#" style={footerLink}>Privacy Policy</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#0a0e27',
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
};

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
};

const logoSection = {
  textAlign: 'center' as const,
  padding: '30px 0',
};

const logoBox = {
  background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
  width: '70px',
  height: '70px',
  borderRadius: '16px',
  display: 'inline-block',
  lineHeight: '70px',
};

const logoText = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#ffffff',
  margin: 0,
};

const brandName = {
  color: '#ffffff',
  fontSize: '28px',
  margin: '20px 0 0',
  letterSpacing: '-0.5px',
};

const brandAccent = {
  color: '#7c3aed',
};

const welcomeBox = {
  background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
  border: '1px solid rgba(124, 58, 237, 0.3)',
  borderRadius: '16px',
  padding: '30px',
  textAlign: 'center' as const,
};

const welcomeHeading = {
  color: '#ffffff',
  fontSize: '24px',
  margin: '0 0 10px',
};

const welcomeSubtext = {
  color: '#a5b4fc',
  fontSize: '16px',
  margin: 0,
};

const contentSection = {
  padding: '30px 0',
};

const greeting = {
  color: '#e2e8f0',
  fontSize: '16px',
  lineHeight: '1.8',
};

const paragraph = {
  color: '#cbd5e1',
  fontSize: '15px',
  lineHeight: '1.8',
};

const featuresSection = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '12px',
  margin: '30px 0',
};

const featureCard = {
  background: 'rgba(124, 58, 237, 0.15)',
  border: '1px solid rgba(124, 58, 237, 0.3)',
  borderRadius: '12px',
  padding: '20px',
  textAlign: 'center' as const,
};

const featureEmoji = {
  fontSize: '28px',
  marginBottom: '10px',
};

const featureTitle = {
  color: '#ffffff',
  fontSize: '14px',
  margin: '0 0 5px',
};

const featureText = {
  color: '#94a3b8',
  fontSize: '12px',
  margin: 0,
};

const buttonSection = {
  textAlign: 'center' as const,
  padding: '30px 0',
};

const ctaButton = {
  background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
  color: '#ffffff',
  padding: '18px 50px',
  borderRadius: '12px',
  fontWeight: '600',
  fontSize: '16px',
  textDecoration: 'none',
};

const statsSection = {
  padding: '0 0 40px',
};

const statsBox = {
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
  padding: '25px',
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: '20px',
  textAlign: 'center' as const,
};

const statItem = {
  padding: '10px',
};

const statNumber = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#7c3aed',
  margin: '0 0 5px',
};

const statLabel = {
  color: '#94a3b8',
  fontSize: '12px',
  margin: 0,
};

const guideSection = {
  padding: '0 0 40px',
};

const guideTitle = {
  color: '#ffffff',
  fontSize: '18px',
  margin: '0 0 20px',
};

const guideStep = {
  display: 'flex',
  alignItems: 'center',
  padding: '12px 0',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
};

const stepNumber = {
  background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
  width: '28px',
  height: '28px',
  borderRadius: '8px',
  textAlign: 'center' as const,
  lineHeight: '28px',
  color: '#fff',
  fontSize: '12px',
  fontWeight: 'bold',
  marginRight: '15px',
};

const stepText = {
  color: '#e2e8f0',
  fontSize: '14px',
  margin: 0,
};

const footer = {
  borderTop: '1px solid rgba(255,255,255,0.1)',
  paddingTop: '30px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#64748b',
  fontSize: '12px',
};

const footerLinks = {
  color: '#475569',
  fontSize: '11px',
};

const footerLink = {
  color: '#64748b',
  textDecoration: 'underline',
};

export default WelcomeEmail;
