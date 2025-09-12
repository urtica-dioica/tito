import { ImageProcessor } from '../../utils/imageProcessor';
import logger from '../../utils/logger';

export class SchedulerService {
  private static instance: SchedulerService;
  private jobs: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;

  private constructor() {}

  static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  /**
   * Start the scheduler service
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Scheduler service is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting scheduler service...');

    // Schedule selfie cleanup to run daily at 2:00 AM
    this.scheduleSelfieCleanup();
    
    // Schedule audit log cleanup to run weekly on Sunday at 3:00 AM
    this.scheduleAuditLogCleanup();

    logger.info('Scheduler service started successfully');
  }

  /**
   * Stop the scheduler service
   */
  stop(): void {
    if (!this.isRunning) {
      logger.warn('Scheduler service is not running');
      return;
    }

    this.isRunning = false;
    logger.info('Stopping scheduler service...');

    // Clear all scheduled jobs
    this.jobs.forEach((timeout, jobName) => {
      clearTimeout(timeout);
      logger.info(`Stopped scheduled job: ${jobName}`);
    });

    this.jobs.clear();
    logger.info('Scheduler service stopped successfully');
  }

  /**
   * Schedule selfie cleanup to run daily
   */
  private scheduleSelfieCleanup(): void {
    const jobName = 'selfie-cleanup';
    
    const scheduleNext = () => {
      const now = new Date();
      const nextRun = new Date(now);
      nextRun.setHours(2, 0, 0, 0); // 2:00 AM
      
      // If it's already past 2:00 AM today, schedule for tomorrow
      if (now.getHours() >= 2) {
        nextRun.setDate(nextRun.getDate() + 1);
      }

      const timeUntilNext = nextRun.getTime() - now.getTime();
      
      const timeout = setTimeout(async () => {
        try {
          logger.info('Starting scheduled selfie cleanup...');
          const deletedCount = await ImageProcessor.cleanupOldSelfies();
          logger.info(`Scheduled selfie cleanup completed. Deleted ${deletedCount} files.`);
        } catch (error) {
          logger.error('Scheduled selfie cleanup failed:', error);
        }
        
        // Schedule the next run
        scheduleNext();
      }, timeUntilNext);

      this.jobs.set(jobName, timeout);
      logger.info(`Scheduled selfie cleanup for ${nextRun.toISOString()}`);
    };

    scheduleNext();
  }

  /**
   * Schedule audit log cleanup to run weekly
   */
  private scheduleAuditLogCleanup(): void {
    const jobName = 'audit-log-cleanup';
    
    const scheduleNext = () => {
      const now = new Date();
      const nextRun = new Date(now);
      
      // Find next Sunday at 3:00 AM
      const daysUntilSunday = (7 - now.getDay()) % 7;
      nextRun.setDate(now.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
      nextRun.setHours(3, 0, 0, 0); // 3:00 AM
      
      const timeUntilNext = nextRun.getTime() - now.getTime();
      
      const timeout = setTimeout(async () => {
        try {
          logger.info('Starting scheduled audit log cleanup...');
          // Import here to avoid circular dependencies
          const { AuditService } = await import('../audit/auditService');
          const auditService = new AuditService();
          const deletedCount = await auditService.cleanupOldLogs(90); // Keep 90 days
          logger.info(`Scheduled audit log cleanup completed. Deleted ${deletedCount} records.`);
        } catch (error) {
          logger.error('Scheduled audit log cleanup failed:', error);
        }
        
        // Schedule the next run
        scheduleNext();
      }, timeUntilNext);

      this.jobs.set(jobName, timeout);
      logger.info(`Scheduled audit log cleanup for ${nextRun.toISOString()}`);
    };

    scheduleNext();
  }

  /**
   * Get status of all scheduled jobs
   */
  getStatus(): {
    isRunning: boolean;
    jobs: Array<{
      name: string;
      nextRun?: string;
    }>;
  } {
    return {
      isRunning: this.isRunning,
      jobs: Array.from(this.jobs.keys()).map(name => ({
        name,
        // Note: We can't easily get the next run time from setTimeout
        // This would require more complex scheduling logic
      }))
    };
  }

  /**
   * Manually trigger selfie cleanup
   */
  async triggerSelfieCleanup(): Promise<number> {
    try {
      logger.info('Manually triggering selfie cleanup...');
      const deletedCount = await ImageProcessor.cleanupOldSelfies();
      logger.info(`Manual selfie cleanup completed. Deleted ${deletedCount} files.`);
      return deletedCount;
    } catch (error) {
      logger.error('Manual selfie cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Manually trigger audit log cleanup
   */
  async triggerAuditLogCleanup(daysToKeep: number = 90): Promise<number> {
    try {
      logger.info('Manually triggering audit log cleanup...');
      const { AuditService } = await import('../audit/auditService');
      const auditService = new AuditService();
      const deletedCount = await auditService.cleanupOldLogs(daysToKeep);
      logger.info(`Manual audit log cleanup completed. Deleted ${deletedCount} records.`);
      return deletedCount;
    } catch (error) {
      logger.error('Manual audit log cleanup failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const schedulerService = SchedulerService.getInstance();
