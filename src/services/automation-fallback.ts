import { PrismaClient } from '@prisma/client';
import { AutomationSettings, WorkingHours, AutomationRule } from './automation';

const prisma = new PrismaClient();

export class AutomationFallbackService {
  private workspaceId: number;

  constructor(workspaceId: number) {
    this.workspaceId = workspaceId;
  }

  async getSettings(): Promise<AutomationSettings | null> {
    try {
      const result = await prisma.$queryRaw`
        SELECT * FROM "AutomationSettings" 
        WHERE "workspaceId" = ${this.workspaceId}
        LIMIT 1
      ` as any[];

      if (!result || result.length === 0) {
        return null;
      }

      const settings = result[0];
      
      // Parse JSON fields
      let workingHours: WorkingHours[] = [];
      let automationRules: AutomationRule[] = [];

      try {
        workingHours = typeof settings.workingHours === 'string' 
          ? JSON.parse(settings.workingHours) 
          : settings.workingHours || [];
        
        automationRules = typeof settings.automationRules === 'string'
          ? JSON.parse(settings.automationRules)
          : settings.automationRules || [];
      } catch (parseError) {
        console.error('Error parsing JSON fields:', parseError);
        workingHours = [];
        automationRules = [];
      }

      return {
        holidayMode: settings.holidayMode || false,
        workingHours,
        automationRules
      };

    } catch (error: any) {
      console.error('Fallback getSettings error:', error);
      
      // If table doesn't exist, return null
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        return null;
      }
      
      throw error;
    }
  }

  async saveSettings(settings: AutomationSettings): Promise<void> {
    try {
      await prisma.$executeRaw`
        INSERT INTO "AutomationSettings" (
          "workspaceId", 
          "holidayMode", 
          "workingHours", 
          "automationRules",
          "createdAt",
          "updatedAt"
        ) VALUES (
          ${this.workspaceId},
          ${settings.holidayMode},
          ${JSON.stringify(settings.workingHours)}::jsonb,
          ${JSON.stringify(settings.automationRules)}::jsonb,
          NOW(),
          NOW()
        )
        ON CONFLICT ("workspaceId") 
        DO UPDATE SET
          "holidayMode" = ${settings.holidayMode},
          "workingHours" = ${JSON.stringify(settings.workingHours)}::jsonb,
          "automationRules" = ${JSON.stringify(settings.automationRules)}::jsonb,
          "updatedAt" = NOW()
      `;
    } catch (error: any) {
      console.error('Fallback saveSettings error:', error);
      
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        throw new Error('AutomationSettings table does not exist. Please run database migrations first.');
      }
      
      throw error;
    }
  }

  async checkTableExists(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1 FROM "AutomationSettings" LIMIT 1`;
      return true;
    } catch (error: any) {
      return false;
    }
  }

  // Add placeholder for missing methods to maintain compatibility
  async createDefaultMaterials(): Promise<void> {
    console.log('createDefaultMaterials not implemented in fallback service');
    return Promise.resolve();
  }
}
