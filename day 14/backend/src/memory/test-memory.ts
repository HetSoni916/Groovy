import { shortTermMemory } from './shortTermMemory';
import { longTermMemory } from './longTermMemory';
import { memoryManager } from './memoryManager';

async function testMemory() {
  console.log('=== RUNNING MEMORY SYSTEM TESTS ===');

  const userId = 'test-user-123';
  const sessionId = 'test-session-456';

  // 1. Short-Term Memory Test
  console.log('\n--- Test 1: Short-Term Memory ---');
  shortTermMemory.clearSession(sessionId);
  shortTermMemory.addMessage(sessionId, { role: 'user', content: 'My name is John.' });
  shortTermMemory.addMessage(sessionId, { role: 'assistant', content: 'Nice to meet you, John!' });

  const history = shortTermMemory.getHistory(sessionId);
  console.log('Short-term history items count:', history.length);
  if (history.length === 2 && history[0].content === 'My name is John.') {
    console.log('✅ Short-term memory test passed.');
  } else {
    console.error('❌ Short-term memory test failed.', history);
  }

  // 2. Long-Term Memory Save and Retrieve
  console.log('\n--- Test 2: Long-Term Memory (Save/Retrieve) ---');
  longTermMemory.clearUserMemories(userId);

  await longTermMemory.saveFact(userId, 'User prefers dark mode themes.', 6);
  await longTermMemory.saveFact(userId, 'User Slack channel is engineering-team.', 8);

  const matched = await longTermMemory.retrieveFacts(userId, 'Which Slack channel?');
  console.log('Retrieved facts for "Which Slack channel?":', matched.map(f => f.text));

  const hasSlack = matched.some(f => f.text.includes('engineering-team'));
  if (hasSlack) {
    console.log('✅ Long-term memory retrieve test passed.');
  } else {
    console.error('❌ Long-term memory retrieve test failed.');
  }

  // 3. Auto-Extraction and Context Injection Test
  console.log('\n--- Test 3: Auto-Extraction and Context Injection ---');
  const userQuery = 'Prepare a report and send it to engineering-team';
  
  // Test prompt injection
  const basePrompt = 'You are a help assistant.';
  const enrichedPrompt = await memoryManager.getSystemPromptWithMemory(userId, userQuery, basePrompt);
  console.log('Enriched System Prompt:\n', enrichedPrompt);
  
  if (enrichedPrompt.includes('engineering-team') || enrichedPrompt.includes('dark mode')) {
    console.log('✅ Context injection test passed.');
  } else {
    console.error('❌ Context injection test failed.');
  }

  console.log('\n=== MEMORY SYSTEM TESTS COMPLETED ===');
}

testMemory().catch(console.error);
