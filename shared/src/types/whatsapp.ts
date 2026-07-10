export interface WhatsAppMessage {
  to: string;
  message: string;
}

export interface WhatsAppTemplate {
  name: string;
  language: {
    code: string;
  };
  components: Array<{
    type: string;
    parameters: Array<{
      type: string;
      text?: string;
    }>;
  }>;
}
