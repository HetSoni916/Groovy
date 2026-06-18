import { QueryRequestSchema, queryRequestToToolSpec } from '../schemas';

console.log('=== Schema Validation Tests ===\n');

const validCases = [
  { question: 'What is a microprocessor?' },
  { question: 'Tell me about AI', documentIds: ['550e8400-e29b-41d4-a716-446655440000'] },
  { question: 'Hi' },
];

const invalidCases = [
  { question: '' },
  { question: 'x'.repeat(2001) },
  { question: 'valid', documentIds: ['not-a-uuid'] },
  { question: 'valid', documentIds: Array.from({ length: 21 }, (_, i) => '550e8400-e29b-41d4-a716-446655440000') },
  {},
];

console.log('Valid inputs:');
for (const c of validCases) {
  const r = QueryRequestSchema.safeParse(c);
  console.log(`  ${JSON.stringify(c)} → ${r.success ? '✓ PASS' : '✗ FAIL: ' + JSON.stringify(r.error?.issues)}`);
}

console.log('\nInvalid inputs:');
for (const c of invalidCases) {
  const r = QueryRequestSchema.safeParse(c);
  console.log(`  ${JSON.stringify(c).substring(0, 60)}... → ${r.success ? '✗ SHOULD HAVE FAILED' : '✓ REJECTED: ' + r.error!.issues.map(i => i.message).join(', ')}`);
}

console.log('\n=== Tool Spec Generation ===\n');
console.log(JSON.stringify(queryRequestToToolSpec(), null, 2));
