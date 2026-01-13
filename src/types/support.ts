export interface SupportRequest {
  subject: string;
  message: string;
  category: string;
  email?: string;
  context?: string; // URL de origen
}

export interface SupportResponse {
  success: boolean;
  message: string;
  emailId?: string;
}

