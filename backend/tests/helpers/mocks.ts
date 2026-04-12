/**
 * External Service Mocks
 * Mock implementations for external services (email, WhatsApp, etc.)
 */

/**
 * Email service mock
 * Tracks sent emails for assertions
 */
export interface SentEmail {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export const emailMock = {
  sentEmails: [] as SentEmail[],

  async sendEmail(to: string, subject: string, body: string, html?: string): Promise<void> {
    this.sentEmails.push({ to, subject, body, html });
  },

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    this.sentEmails.push({
      to: email,
      subject: 'Verify Your Email',
      body: `Your verification token is: ${token}`,
    });
  },

  async sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
    this.sentEmails.push({
      to: email,
      subject: 'Password Reset Request',
      body: `Click here to reset your password: ${resetLink}`,
    });
  },

  clear(): void {
    this.sentEmails = [];
  },

  wasEmailSent(to: string, subject?: string): boolean {
    return this.sentEmails.some(
      email => email.to === to && (!subject || email.subject === subject)
    );
  },

  getEmailCount(): number {
    return this.sentEmails.length;
  },
};

/**
 * WhatsApp service mock
 * Tracks sent messages for assertions
 */
export interface SentWhatsAppMessage {
  phoneNumber: string;
  message: string;
}

export const whatsappMock = {
  sentMessages: [] as SentWhatsAppMessage[],

  async sendMessage(phoneNumber: string, message: string): Promise<void> {
    this.sentMessages.push({ phoneNumber, message });
  },

  async sendVerificationCode(phoneNumber: string, code: string): Promise<void> {
    this.sentMessages.push({
      phoneNumber,
      message: `Your verification code is: ${code}`,
    });
  },

  clear(): void {
    this.sentMessages = [];
  },

  wasMessageSent(phoneNumber: string, messageContains?: string): boolean {
    return this.sentMessages.some(
      msg =>
        msg.phoneNumber === phoneNumber &&
        (!messageContains || msg.message.includes(messageContains))
    );
  },

  getMessageCount(): number {
    return this.sentMessages.length;
  },
};

/**
 * Payment gateway mock
 */
export interface PaymentDetails {
  amount: number;
  currency: string;
  status: 'success' | 'failed' | 'pending';
  transactionId?: string;
}

export const paymentMock = {
  payments: [] as PaymentDetails[],

  async processPayment(amount: number, currency: string): Promise<PaymentDetails> {
    const payment: PaymentDetails = {
      amount,
      currency,
      status: 'success',
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    this.payments.push(payment);
    return payment;
  },

  async refundPayment(transactionId: string, amount?: number): Promise<PaymentDetails> {
    const payment = this.payments.find(p => p.transactionId === transactionId);
    if (!payment) {
      throw new Error(`Payment with transaction ID ${transactionId} not found`);
    }
    const refund: PaymentDetails = {
      ...payment,
      amount: amount ?? payment.amount,
      status: 'success',
    };
    return refund;
  },

  clear(): void {
    this.payments = [];
  },
};

/**
 * Reset all mocks
 */
export function resetAllMocks(): void {
  emailMock.clear();
  whatsappMock.clear();
  paymentMock.clear();
}

// Re-export test counter reset for convenience
export { resetTestCounter } from './factories.js';
