import 'dotenv/config';
import { getPool } from '../src/config/database';
import logger from '../src/utils/logger';
import { leaveService } from '../src/services/leave/leaveService';
import { employeeModel } from '../src/models/hr/Employee';

(async () => {
  const year = new Date().getFullYear();

  logger.info(`Initializing leave balances for all employees for year ${year}`);

  try {
    // Fetch active employees (status = 'active')
    const { rows: employees } = await getPool().query(`SELECT id FROM employees WHERE status = 'active'`);

    for (const emp of employees) {
      try {
        await leaveService.initializeEmployeeLeaveBalance(emp.id, year, 15, 15, 0, 0);
        logger.info('Initialized leave balance', { employeeId: emp.id, year });
      } catch (err) {
        logger.error('Failed to initialize leave balance for employee', { employeeId: emp.id, error: (err as Error).message });
      }
    }

    logger.info('Leave balance initialization completed');
    process.exit(0);
  } catch (error) {
    logger.error('Initialization script failed', { error: (error as Error).message });
    process.exit(1);
  }
})();
