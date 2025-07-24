import { type OrderItem } from "@shared/schema";

export interface CloudApiService {
  createOrder(orderData: any): Promise<any>;
  verifyAge(imageData: string): Promise<{ verified: boolean; confidence: number }>;
  verifyID(imageData: string): Promise<{ verified: boolean; age: number }>;
}

export class CloudApi implements CloudApiService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.CLOUD_API_URL || 'https://kiosk-manager-uzisinapoj.replit.app/api';
    this.apiKey = process.env.CLOUD_API_KEY || '';
  }

  async createOrder(orderData: {
    items: OrderItem[] | string;
    ageVerified: boolean;
    gdprConsent: boolean;
    language: string;
  }): Promise<any> {
    try {
      // Ensure items is an array for the main app API
      const formattedData = {
        ...orderData,
        items: typeof orderData.items === 'string' ? JSON.parse(orderData.items) : orderData.items,
      };

      const response = await fetch(`${this.baseUrl}/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Order creation failed: ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  }

  async verifyAge(imageData: string): Promise<{ verified: boolean; confidence: number }> {
    try {
      const ageVerificationUrl = process.env.AGE_VERIFICATION_API_URL || 'https://api.age-verification.com/verify';
      const ageApiKey = process.env.AGE_VERIFICATION_API_KEY || '';

      const response = await fetch(ageVerificationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ageApiKey}`,
        },
        body: JSON.stringify({
          image: imageData,
          minAge: 18,
        }),
      });

      if (!response.ok) {
        throw new Error(`Age verification failed: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        verified: result.ageVerified && result.estimatedAge >= 18,
        confidence: result.confidence || 0,
      };
    } catch (error) {
      console.error('Age verification error:', error);
      // In production, handle this more gracefully
      return { verified: false, confidence: 0 };
    }
  }

  async verifyID(imageData: string): Promise<{ verified: boolean; age: number }> {
    try {
      const idVerificationUrl = process.env.ID_VERIFICATION_API_URL || 'https://api.id-verification.com/verify';
      const idApiKey = process.env.ID_VERIFICATION_API_KEY || '';

      const response = await fetch(idVerificationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idApiKey}`,
        },
        body: JSON.stringify({
          image: imageData,
          documentType: 'passport_or_id',
        }),
      });

      if (!response.ok) {
        throw new Error(`ID verification failed: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        verified: result.documentValid && result.faceMatch,
        age: result.extractedAge || 0,
      };
    } catch (error) {
      console.error('ID verification error:', error);
      return { verified: false, age: 0 };
    }
  }
}

export const cloudApi = new CloudApi();
