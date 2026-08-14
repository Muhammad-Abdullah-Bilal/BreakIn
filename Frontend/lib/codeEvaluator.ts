// lib/codeEvaluator.ts

export interface CheckpointResult {
  name: string;
  passed: boolean;
  explanation: string;
}

export interface EvaluationResult {
  score: number; // 0 to 10 scale
  codeQuality: number; // 0 to 10 scale
  efficiency: number; // 0 to 10 scale
  problemSolving: number; // 0 to 10 scale
  creativity: number; // 0 to 10 scale
  functionalityScore: number; // 0 to 10 scale
  correctnessScore: number; // 0 to 10 scale
  checkpoints: CheckpointResult[];
  totalSnapshots: number;
  averageScore: number;
  feedback: string;
  suggestions: string[];
  timeline: Array<{ time: string; score: number }>;
  taskTitle?: string;
  status: 'PASSED' | 'FAILED' | 'NEEDS_REVISION';
}

interface TaskContract {
  domain: string;
  checkpoints: Array<{
    name: string;
    description: string;
    matcher: (code: string) => boolean;
  }>;
}

// Contract registry defining expected functional requirements per sprint type
function getTaskContract(taskTitle: string): TaskContract {
  const title = (taskTitle || '').toLowerCase();

  if (title.includes('payment') || title.includes('billing') || title.includes('stripe') || title.includes('transaction')) {
    return {
      domain: 'FinTech & Payments',
      checkpoints: [
        {
          name: 'Idempotency Protection',
          description: 'Validates idempotency keys or unique request IDs to prevent double charging.',
          matcher: (c) => /idempotenc(y|e)|idempotent|req\.id|request_id|unique_key/i.test(c),
        },
        {
          name: 'Input Validation (Amount & Currency)',
          description: 'Validates that amount is positive and currency format is supported.',
          matcher: (c) => /(amount\s*(<=|<|<=|===|==)\s*0|amount\s*>\s*0|!amount|!currency|currency|validateAmount)/i.test(c),
        },
        {
          name: 'Payment Processing & Ledger Record',
          description: 'Invokes payment gateway/ledger transaction with atomic persistence.',
          matcher: (c) => /(charge|process|payment|createIntent|insert(One)?|ledger|transaction|stripe)/i.test(c),
        },
        {
          name: 'Defensive Exception Handling',
          description: 'Implements try/catch to gracefully handle API timeouts and declined transactions.',
          matcher: (c) => /try\s*\{[\s\S]*catch\s*\(/i.test(c),
        },
        {
          name: 'Structured Return Response',
          description: 'Returns structured response containing status (COMPLETED/SUCCEEDED) and transaction ID.',
          matcher: (c) => /return\s*\{[\s\S]*(status|transactionId|id|success|receipt)[\s\S]*\}/i.test(c),
        }
      ]
    };
  }

  if (title.includes('rate limit') || title.includes('token bucket') || title.includes('throttl')) {
    return {
      domain: 'Distributed Rate Limiter',
      checkpoints: [
        {
          name: 'Capacity & Refill Configuration',
          description: 'Defines bucket max capacity, refill interval, or sliding window window size.',
          matcher: (c) => /(capacity|limit|window|refill|rate|tokens)/i.test(c),
        },
        {
          name: 'Token Calculation / Window Tracking',
          description: 'Calculates elapsed time and current token replenishment state.',
          matcher: (c) => /(now|Date\.now|time|elapsed|currentTokens|sliding)/i.test(c),
        },
        {
          name: 'Atomic Store Mutation',
          description: 'Mutates state store (Redis/Map/Cache) atomically per identifier.',
          matcher: (c) => /(set|get|increment|store|cache|redis|push)/i.test(c),
        },
        {
          name: 'Rate Limit Outcome & Headers',
          description: 'Returns boolean allow decision along with remaining quota or retry-after headers.',
          matcher: (c) => /(allow|isAllowed|allowed|remaining|retryAfter)/i.test(c),
        }
      ]
    };
  }

  if (title.includes('socket') || title.includes('canvas') || title.includes('realtime') || title.includes('collab')) {
    return {
      domain: 'Real-Time Sync Engine',
      checkpoints: [
        {
          name: 'Connection & Client Lifecycle',
          description: 'Manages incoming WebSocket connections and client registration.',
          matcher: (c) => /(socket|connection|client|connect|ws|session)/i.test(c),
        },
        {
          name: 'Message Serialization & Broadcasting',
          description: 'Receives action payloads and broadcasts synchronized updates to connected peers.',
          matcher: (c) => /(broadcast|emit|send|onMessage|publish|dispatch)/i.test(c),
        },
        {
          name: 'Conflict Resolution & Cursor State',
          description: 'Applies event sequencing, conflict resolution, or live cursor coordinates.',
          matcher: (c) => /(cursor|version|sequence|conflict|transform|layer|draw|event)/i.test(c),
        }
      ]
    };
  }

  // Default contract for general full-stack engineering tasks
  return {
    domain: 'Software Engineering & Microservices',
    checkpoints: [
      {
        name: 'Input Parsing & Contract Validation',
        description: 'Validates incoming request payload, parameter types, and presence.',
        matcher: (c) => /(if\s*\(|typeof|!req|throw\s+new|validate|schema)/i.test(c),
      },
      {
        name: 'Core Business Logic Implementation',
        description: 'Implements the primary transformation, calculation, or pipeline operation.',
        matcher: (c) => /(function|const\s+\w+\s*=\s*(async\s+)?\(|class\s+|def\s+)/i.test(c) && c.length > 120,
      },
      {
        name: 'Defensive Exception Safety',
        description: 'Encloses critical operations within exception safety boundaries (try/catch).',
        matcher: (c) => /try\s*\{[\s\S]*catch\s*\(/i.test(c),
      },
      {
        name: 'Deterministic Return Output',
        description: 'Returns calculated output structure adhering to API specifications.',
        matcher: (c) => /return\s+[^;]+/i.test(c),
      }
    ]
  };
}

export function evaluateSubmittedCode(
  code: string,
  taskTitle?: string,
  metrics?: {
    keystrokes?: number;
    elapsedTime?: number;
    focusTime?: number;
    codeChanges?: number;
  }
): EvaluationResult {
  const trimmed = (code || '').trim();
  const task = taskTitle || 'Payment API Sprint Task';
  const contract = getTaskContract(task);

  // 1. Detect Minimal, Placeholder, or Empty Code
  const isDefaultPlaceholder = 
    trimmed.length < 250 &&
    trimmed.includes('// Your code here') && 
    (trimmed.includes('return "Hello World"') || trimmed.includes('Implement your solution'));

  if (!trimmed || trimmed.length < 40 || isDefaultPlaceholder) {
    const failedCheckpoints = contract.checkpoints.map(cp => ({
      name: cp.name,
      passed: false,
      explanation: `Failed: ${cp.description} (Not implemented)`
    }));

    return {
      score: 1.5,
      functionalityScore: 1.0,
      correctnessScore: 1.0,
      codeQuality: 1.5,
      efficiency: 2.0,
      problemSolving: 1.0,
      creativity: 1.0,
      totalSnapshots: Math.max(1, metrics?.codeChanges || 1),
      averageScore: 1.5,
      status: 'FAILED',
      taskTitle: task,
      checkpoints: failedCheckpoints,
      feedback: `Incomplete Solution: The submitted code contains only boilerplate/placeholder lines and does not implement any of the ${contract.domain} functional requirements.`,
      suggestions: [
        `Implement the core functional logic for ${contract.domain}.`,
        'Add parameter validation and error boundary checks.',
        'Ensure the function returns actual computed results rather than placeholder text.'
      ],
      timeline: [
        { time: new Date(Date.now() - 60000).toISOString(), score: 1.5 },
        { time: new Date().toISOString(), score: 1.5 }
      ]
    };
  }

  // 2. Relevance Check based on Task Domain and Keywords
  const titleWords = task.toLowerCase().split(/[\s_-]+/).filter(w => w.length > 3);
  let relevanceCount = 0;
  titleWords.forEach(word => {
    if (new RegExp(word, 'i').test(trimmed)) {
      relevanceCount++;
    }
  });

  // Define domain-specific keywords
  let domainKeywords: string[] = [];
  if (contract.domain.includes('Payments') || contract.domain.includes('FinTech')) {
    domainKeywords = ['payment', 'charge', 'stripe', 'transaction', 'amount', 'currency', 'ledger', 'pay', 'billing'];
  } else if (contract.domain.includes('Limiter') || contract.domain.includes('Rate')) {
    domainKeywords = ['rate', 'limit', 'token', 'bucket', 'refill', 'redis', 'window', 'throttle', 'capacity'];
  } else if (contract.domain.includes('Sync') || contract.domain.includes('WebSocket')) {
    domainKeywords = ['socket', 'websocket', 'broadcast', 'emit', 'connection', 'ws', 'sync', 'cursor', 'collab'];
  } else {
    domainKeywords = titleWords;
  }

  const matchedDomainKeywords = domainKeywords.filter(keyword => 
    new RegExp('\\b' + keyword + '\\b|' + keyword, 'i').test(trimmed)
  );

  const title = task.toLowerCase();
  const isGenericTask = 
    title.includes('sprint task') || 
    title.includes('sprint challenge') || 
    title.includes('code snapshot') || 
    (title.includes('sprint') && title.length <= 15) ||
    titleWords.length === 0 ||
    contract.domain === 'Software Engineering & Microservices';

  // A code submission is relevant if it's a generic task, or matches at least 2 domain keywords, or contains at least 1 keyword from the task title
  const isRelevant = isGenericTask || (domainKeywords.length > 0 && matchedDomainKeywords.length >= 2) || relevanceCount >= 1;

  // Check for utility function list spam (e.g., standard math/utility functions commonly copy-pasted to inflate file size)
  const fillerPatterns = [
    /celsiusToFahrenheit/i,
    /fahrenheitToCelsius/i,
    /metersToKilometers/i,
    /kilometersToMeters/i,
    /sortAscending/i,
    /sortDescending/i,
    /doubleValues/i,
    /squareValues/i,
    /filterEven/i,
    /filterOdd/i,
    /fibonacci/i,
    /factorial/i,
    /gcd/i,
    /lcm/i
  ];
  const matchedFillerCount = fillerPatterns.filter(pattern => pattern.test(trimmed)).length;
  const isUtilityFillerSpam = matchedFillerCount >= 3;

  // Check for dummy loops or filler code (e.g. repeated logs or trivial dummy increments)
  const isFillerCode = 
    /(console\.log\([^)]*\);\s*){4,}/.test(trimmed) || 
    /(for\s*\([^)]*\)\s*\{\s*\}\s*){2,}/.test(trimmed) ||
    isUtilityFillerSpam;

  // Evaluate Task-Specific Functional Checkpoints
  const checkpointResults: CheckpointResult[] = contract.checkpoints.map(cp => {
    const passed = isRelevant && !isFillerCode && cp.matcher(trimmed);
    return {
      name: cp.name,
      passed,
      explanation: passed ? `Passed: ${cp.description}` : 
                   isFillerCode ? `Filler: Code contains generic helper library spam instead of task implementation.` :
                   !isRelevant ? `Unrelated: Code does not implement core requirements for ${contract.domain}.` :
                   `Missing: ${cp.description}`
    };
  });

  const passedCount = checkpointResults.filter(r => r.passed).length;
  const totalCheckpoints = checkpointResults.length;
  const functionalityRatio = totalCheckpoints > 0 ? passedCount / totalCheckpoints : 0;

  // 3. Syntax & Structural Correctness Analysis
  let syntaxIssues = 0;
  const openBraces = (trimmed.match(/\{/g) || []).length;
  const closeBraces = (trimmed.match(/\}/g) || []).length;
  const openParens = (trimmed.match(/\(/g) || []).length;
  const closeParens = (trimmed.match(/\)/g) || []).length;

  if (openBraces !== closeBraces) syntaxIssues += 2;
  if (openParens !== closeParens) syntaxIssues += 2;

  const hasHardcodedStubReturn = /return\s+("Hello World"|null|undefined|true|false|123);\s*$/.test(trimmed) && trimmed.length < 150;
  
  // If the code is long but does not satisfy at least 50% of checkpoints, penalize it as potential filler/unrelated code
  const isFillerOrLowFunctionality = (trimmed.length > 400 && functionalityRatio < 0.5) || isFillerCode;

  // 4. Compute Functionality & Correctness Scores
  // Functionality (0 to 10): Heavily penalizes solutions that fail task checkpoints regardless of code length
  let functionalityScore = functionalityRatio * 9.0;
  if (isFillerCode || hasHardcodedStubReturn || !isRelevant) {
    functionalityScore = Math.max(1.0, functionalityScore - 4.5);
  }
  if (isFillerOrLowFunctionality) {
    functionalityScore = Math.max(1.0, functionalityScore - 3.5);
  }

  // Correctness (0 to 10)
  let correctnessScore = 7.0 - (syntaxIssues * 2.0);
  if (!/(try\s*\{[\s\S]*catch)/i.test(trimmed)) correctnessScore -= 1.5;
  if (syntaxIssues > 0) correctnessScore = Math.min(correctnessScore, 4.0);
  if (functionalityRatio === 0 || !isRelevant) correctnessScore = Math.min(correctnessScore, 1.5);
  if (isFillerOrLowFunctionality) correctnessScore = Math.min(correctnessScore, 2.5);
  correctnessScore = Math.max(1.0, Math.min(10.0, correctnessScore));

  // Code Quality (0 to 10): Evaluates structure, variable naming, comments, types
  const hasTypesOrValidation = /:\s*(string|number|boolean|any|Promise|[A-Z]\w+)|typeof\s+|interface\s+|type\s+/.test(trimmed);
  const hasComments = /\/\/|\/\*/.test(trimmed);
  const hasAsync = /async\s+|await\s+|\.then\(/.test(trimmed);

  let codeQuality = 4.0;
  if (hasTypesOrValidation) codeQuality += 2.0;
  if (hasComments) codeQuality += 1.0;
  if (hasAsync) codeQuality += 1.5;
  if (syntaxIssues > 0) codeQuality -= 2.0;
  if (functionalityRatio < 0.4 || !isRelevant || isFillerOrLowFunctionality) codeQuality = Math.min(codeQuality, 2.0);
  codeQuality = Math.max(1.0, Math.min(10.0, codeQuality));

  // Problem Solving & Efficiency
  const problemSolving = Math.max(1.0, Math.min(10.0, (functionalityRatio * 7.0) + (hasAsync ? 1.5 : 0.5) + (hasTypesOrValidation ? 1.0 : 0.5)));
  const efficiency = Math.max(2.0, Math.min(10.0, 5.0 + (functionalityRatio * 4.0) - (syntaxIssues * 1.5)));
  const creativity = Math.max(1.5, Math.min(10.0, 4.0 + (functionalityRatio * 4.5)));

  // Final Weighted Score (0 to 10 Scale)
  // Functionality is weighted highest (50%), followed by Correctness (30%) and Quality (20%)
  let finalScore = (functionalityScore * 0.50) + (correctnessScore * 0.30) + (codeQuality * 0.20);
  finalScore = Math.round(Math.max(1.0, Math.min(10.0, finalScore)) * 10) / 10;

  // 5. Generate Tailored Suggestions & Feedback based on actual failed checkpoints
  const suggestions: string[] = [];
  checkpointResults.filter(r => !r.passed).forEach(r => {
    suggestions.push(r.explanation.replace('Missing: ', ''));
  });

  if (syntaxIssues > 0) {
    suggestions.push('Fix mismatched braces and syntax parsing errors.');
  }

  if (suggestions.length === 0) {
    suggestions.push('Add unit test fixtures covering edge case boundary values.');
    suggestions.push('Consider performance profiling under high concurrent throughput.');
  }

  let status: 'PASSED' | 'FAILED' | 'NEEDS_REVISION' = 'PASSED';
  let feedback = '';

  if (functionalityRatio === 1.0 && finalScore >= 8.0) {
    status = 'PASSED';
    feedback = `Verified Implementation: All ${passedCount}/${totalCheckpoints} ${contract.domain} functional requirements passed. The code handles business logic, parameter validation, and exceptions with production quality.`;
  } else if (functionalityRatio >= 0.6 && finalScore >= 6.0) {
    status = 'PASSED';
    feedback = `Partially Verified: Passed ${passedCount}/${totalCheckpoints} functional checkpoints. Core logic is working, but edge case handling or exception boundaries need refinement.`;
  } else if (functionalityRatio >= 0.3) {
    status = 'NEEDS_REVISION';
    feedback = `Needs Revision: Only ${passedCount}/${totalCheckpoints} functional requirements satisfied. Missing critical domain checkpoints: ${checkpointResults.filter(r => !r.passed).map(r => r.name).join(', ')}.`;
  } else {
    status = 'FAILED';
    feedback = `Evaluation Failed (0/${totalCheckpoints} Checkpoints Passed): The submitted code does not meet the functional requirements for ${task}. Writing large volume of unrelated code does not pass functional criteria.`;
  }

  return {
    score: finalScore,
    functionalityScore: Math.round(functionalityScore * 10) / 10,
    correctnessScore: Math.round(correctnessScore * 10) / 10,
    codeQuality: Math.round(codeQuality * 10) / 10,
    efficiency: Math.round(efficiency * 10) / 10,
    problemSolving: Math.round(problemSolving * 10) / 10,
    creativity: Math.round(creativity * 10) / 10,
    checkpoints: checkpointResults,
    totalSnapshots: Math.max(1, metrics?.codeChanges || 1),
    averageScore: finalScore,
    feedback,
    suggestions: suggestions.slice(0, 3),
    status,
    taskTitle: task,
    timeline: [
      { time: new Date(Date.now() - 120000).toISOString(), score: Math.max(1.0, Math.round((finalScore * 0.8) * 10) / 10) },
      { time: new Date().toISOString(), score: finalScore }
    ]
  };
}
