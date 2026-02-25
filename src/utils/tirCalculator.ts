export interface TIRInputs {
  purchasePrice: number;
  exitCapRate?: number;
  appreciationRate?: number;
  annualRevenue: number;
  revenueGrowthRate?: number;
  annualOpex: number;
  opexGrowthRate?: number;
  rehabCapex: number;
  loanAmount?: number;
  interestRate?: number;
  loanTermYears?: number;
}

export interface TIRResults {
  projectIRR: number;
  cashOnCashIRR: number;
  cashFlowsProject: number[];
  cashFlowsEquity: number[];
  exitValue: number;
}

export const calculate5YearTIR = (inputs: TIRInputs): TIRResults => {
  const yearsToProject = 5;

  const revGrowth = inputs.revenueGrowthRate ?? 0;
  const opexGrowth = inputs.opexGrowthRate ?? 0;
  
  const projectCashflows: number[] = [];
  const initialProjectOutflow = -(inputs.purchasePrice + inputs.rehabCapex);
  projectCashflows.push(initialProjectOutflow);

  let currentRevenue = inputs.annualRevenue;
  let currentOpex = inputs.annualOpex;
  
  for (let year = 1; year < yearsToProject; year++) {
    const netOperatingIncome = currentRevenue - currentOpex;
    projectCashflows.push(netOperatingIncome);
    
    currentRevenue *= (1 + revGrowth);
    currentOpex *= (1 + opexGrowth);
  }

  const year5NOI = currentRevenue - currentOpex;
  
  let exitValue = 0;
  if (inputs.exitCapRate && inputs.exitCapRate > 0) {
    exitValue = year5NOI / (inputs.exitCapRate / 100); 
  } else if (inputs.appreciationRate && inputs.appreciationRate > 0) {
    exitValue = inputs.purchasePrice * Math.pow(1 + (inputs.appreciationRate / 100), yearsToProject);
  } else {
    exitValue = inputs.purchasePrice + inputs.rehabCapex;
  }

  projectCashflows.push(year5NOI + exitValue);

  const equityCashflows: number[] = [];
  let pmt = 0;
  let remainingPrincipal = inputs.loanAmount || 0;

  if (inputs.loanAmount && inputs.interestRate && inputs.loanTermYears) {
    const r = inputs.interestRate / 100;
    const n = inputs.loanTermYears;
    pmt = (inputs.loanAmount * r) / (1 - Math.pow(1 + r, -n));
    equityCashflows.push(initialProjectOutflow + inputs.loanAmount);
  } else {
    equityCashflows.push(initialProjectOutflow);
  }

  for (let year = 1; year < yearsToProject; year++) {
    if (pmt > 0) {
      const interestPayment = remainingPrincipal * (inputs.interestRate! / 100);
      const principalPayment = pmt - interestPayment;
      remainingPrincipal -= principalPayment;
    }
    equityCashflows.push(projectCashflows[year] - pmt);
  }

  if (pmt > 0) {
    const interestPayment = remainingPrincipal * (inputs.interestRate! / 100);
    const principalPayment = pmt - interestPayment;
    remainingPrincipal -= principalPayment;
    
    const cashBeforeSale = projectCashflows[yearsToProject] - exitValue - pmt;
    const saleProceedsEquity = exitValue - remainingPrincipal;
    
    equityCashflows.push(cashBeforeSale + saleProceedsEquity);
  } else {
    equityCashflows.push(projectCashflows[yearsToProject]);
  }

  return {
    projectIRR: calculateIRR(projectCashflows),
    cashOnCashIRR: calculateIRR(equityCashflows),
    cashFlowsProject: projectCashflows.map(v => Math.round(v)),
    cashFlowsEquity: equityCashflows.map(v => Math.round(v)),
    exitValue: Math.round(exitValue)
  };
};

// Cálculo de la TIR mediante la aproximación Newton-Raphson
function calculateIRR(values: number[], guess = 0.1): number {
  if (values.length === 0) return 0;
  
  const hasPositive = values.some(v => v > 0);
  const hasNegative = values.some(v => v < 0);
  if (!hasPositive || !hasNegative) return 0;

  const maxIter = 1000;
  const precision = 1e-7;
  let rate = guess;
  
  for (let i = 0; i < maxIter; i++) {
    let npv = 0;
    let derivative_npv = 0;
    for (let t = 0; t < values.length; t++) {
      npv += values[t] / Math.pow(1 + rate, t);
      if (t > 0) {
        derivative_npv -= (t * values[t]) / Math.pow(1 + rate, t + 1);
      }
    }
    const newRate = rate - npv / derivative_npv;
    if (Math.abs(newRate - rate) < precision) {
      return Number((newRate * 100).toFixed(2));
    }
    rate = newRate;
  }
  return 0;
}
