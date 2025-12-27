import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export const emailConfig = {
  from: 'Trader Edge Pro <noreply@traderedgepro.com>',
  replyTo: 'support@traderedgepro.com',
};
