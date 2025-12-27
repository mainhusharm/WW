import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface AuthEmailProps {
  otpCode: string;
  verificationUrl: string;
  requestTime: string;
  ipAddress: string;
  location: string;
}

export const AuthEmail = ({
  otpCode = '847291',
  verificationUrl = 'https://traderedgepro.com/verify',
  requestTime = 'Jan 15, 2024, 10:30 AM UTC',
  ipAddress = '192.168.1.1',
  location = 'New York, USA',
}: AuthEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your Trader Edge Pro verification code: {otpCode}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo */}
          <Section style={logoSection}>
            <div style={logoBox}>
              <Text style={logoText}>TE</Text>
            </div>
            <Text style={securityLabel}>SECURITY VERIFICATION</Text>
          </Section>

          {/* Security Icon */}
          <Section style={iconSection}>
            <Text style={securityIcon}>🔐</Text>
          </Section>

          {/* Main Heading */}
          <Heading style={heading}>Verify Your Identity</Heading>

          <Text style={subtext}>
            Use the verification code below to complete your sign-in.
            This code will expire in <strong style={highlight}>10 minutes</strong>.
          </Text>

          {/* OTP Box */}
          <Section style={otpBox}>
            <Text style={otpLabel}>YOUR VERIFICATION CODE</Text>
            <Text style={otpCodeStyle}>{otpCode}</Text>
          </Section>

          {/* Divider */}
          <Text style={divider}>— OR CLICK BELOW —</Text>

          {/* Magic Link Button */}
          <Section style={buttonSection}>
            <Button style={verifyButton} href={verificationUrl}>
              ✨ Verify My Account
            </Button>
          </Section>

          {/* Security Warning */}
          <Section style={warningBox}>
            <Text style={warningTitle}>⚠️ Security Notice</Text>
            <Text style={warningText}>
              If you didn't request this code, please ignore this email
              or contact our support team immediately. Never share this
              code with anyone.
            </Text>
          </Section>

          {/* Request Details */}
          <Section style={detailsBox}>
            <Text style={detailsTitle}>REQUEST DETAILS</Text>
            <table style={detailsTable}>
              <tr>
                <td style={detailLabel}>Time</td>
                <td style={detailValue}>{requestTime}</td>
              </tr>
              <tr>
                <td style={detailLabel}>IP Address</td>
                <td style={detailValue}>{ipAddress}</td>
              </tr>
              <tr>
                <td style={detailLabel}>Location</td>
                <td style={detailValue}>{location}</td>
              </tr>
            </table>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © 2024 Trader Edge Pro. All rights reserved.
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
  padding: '30px 0 20px',
};

const logoBox = {
  background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
  width: '60px',
  height: '60px',
  borderRadius: '14px',
  display: 'inline-block',
  lineHeight: '60px',
};

const logoText = {
  fontSize: '26px',
  fontWeight: 'bold',
  color: '#ffffff',
  margin: 0,
};

const securityLabel = {
  color: '#64748b',
  fontSize: '12px',
  letterSpacing: '3px',
  margin: '15px 0 0',
};

const iconSection = {
  textAlign: 'center' as const,
  padding: '20px 0',
};

const securityIcon = {
  fontSize: '50px',
  margin: 0,
};

const heading = {
  color: '#ffffff',
  fontSize: '26px',
  textAlign: 'center' as const,
  margin: '0 0 15px',
};

const subtext = {
  color: '#94a3b8',
  fontSize: '15px',
  textAlign: 'center' as const,
  lineHeight: '1.6',
};

const highlight = {
  color: '#a855f7',
};

const otpBox = {
  background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
  border: '2px solid rgba(124, 58, 237, 0.4)',
  borderRadius: '16px',
  padding: '30px',
  textAlign: 'center' as const,
  margin: '30px 0',
};

const otpLabel = {
  color: '#64748b',
  fontSize: '12px',
  letterSpacing: '2px',
  margin: '0 0 10px',
};

const otpCodeStyle = {
  fontSize: '42px',
  fontWeight: 'bold',
  letterSpacing: '12px',
  color: '#ffffff',
  fontFamily: "'Courier New', monospace",
  margin: 0,
};

const divider = {
  color: '#64748b',
  fontSize: '12px',
  textAlign: 'center' as const,
  letterSpacing: '1px',
};

const buttonSection = {
  textAlign: 'center' as const,
  padding: '20px 0 30px',
};

const verifyButton = {
  background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
  color: '#ffffff',
  padding: '16px 45px',
  borderRadius: '12px',
  fontWeight: '600',
  fontSize: '15px',
  textDecoration: 'none',
};

const warningBox = {
  background: 'rgba(239, 68, 68, 0.1)',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  borderRadius: '12px',
  padding: '20px',
  marginBottom: '20px',
};

const warningTitle = {
  color: '#fca5a5',
  fontSize: '13px',
  fontWeight: '600',
  margin: '0 0 5px',
};

const warningText = {
  color: '#94a3b8',
  fontSize: '12px',
  lineHeight: '1.6',
  margin: 0,
};

const detailsBox = {
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  padding: '20px',
};

const detailsTitle = {
  color: '#64748b',
  fontSize: '11px',
  letterSpacing: '1px',
  margin: '0 0 15px',
};

const detailsTable = {
  width: '100%',
};

const detailLabel = {
  color: '#64748b',
  fontSize: '12px',
  padding: '8px 0',
};

const detailValue = {
  color: '#e2e8f0',
  fontSize: '12px',
  padding: '8px 0',
  textAlign: 'right' as const,
};

const footer = {
  borderTop: '1px solid rgba(255,255,255,0.1)',
  paddingTop: '30px',
  marginTop: '30px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#64748b',
  fontSize: '12px',
};

export default AuthEmail;
