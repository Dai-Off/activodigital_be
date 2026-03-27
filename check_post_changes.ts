import { FinancialAuditService } from './src/domain/services/financialAuditService';
import { FinancialMetricsService } from './src/domain/services/financialMetricsService';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const fs = new FinancialAuditService();
  const fms = new FinancialMetricsService();
  const userAuthId = '00000000-0000-0000-0000-000000000000';
  const bId = '9614dbd4-2ee3-4ed1-bfb3-b2431f27f58c';
  
  try {
      console.log('Testing FinancialMetricsService...');
      const metrics = await fms.getBuildingMetrics(bId, userAuthId);
      console.log(JSON.stringify(metrics, null, 2));

      console.log('\nTesting FinancialAuditService...');
      const res = await fs.getFinancialAudit(bId, userAuthId);
      console.log(JSON.stringify(res.postImprovementScenario, null, 2));
  } catch (err) {
      console.error(err);
  }
}

main().catch(console.error);
