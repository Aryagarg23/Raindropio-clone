#!/usr/bin/env node

/**
 * Simple webhook test script
 * This creates a test collection to verify that webhooks are working
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🧪 Webhook Testing Script');
console.log('==========================');
console.log('');
console.log('Instructions:');
console.log('1. Make sure your frontend is running (npm run dev)');
console.log('2. Open browser to your team site page');
console.log('3. Open browser dev tools console to see logs');
console.log('4. Run this test to create a collection via Supabase directly');
console.log('');
console.log('Expected behavior:');
console.log('- You should see realtime logs in browser console');
console.log('- New collection should appear in the UI immediately');
console.log('- If not, the webhook/realtime system has issues');
console.log('');

async function testWebhook() {
  console.log('To test the webhook system:');
  console.log('');
  console.log('Option 1: Use the frontend UI');
  console.log('- Go to your team site page');
  console.log('- Click "Add Collection" button');
  console.log('- Create a new collection');
  console.log('- Watch the browser console for 📡 logs');
  console.log('');
  console.log('Option 2: Manual SQL (if you have Supabase access)');
  console.log('- Open Supabase SQL editor');
  console.log('- Run: INSERT INTO collections (team_id, name, color, created_by) VALUES (\'YOUR_TEAM_ID\', \'Test Collection\', \'#ff0000\', \'YOUR_USER_ID\')');
  console.log('- Watch the browser console for 📡 logs');
  console.log('');
  console.log('Look for these logs in browser console:');
  console.log('✅ "📡 Collections realtime event:" - Event received');
  console.log('✅ "📡 Inserting collection:" - Processing insert');
  console.log('✅ "📡 Collections after insert:" - State updated');
  console.log('✅ "📡 ✅ State update executed successfully!" - Fix working');
  console.log('');
  console.log('If you see the logs but UI doesn\'t update, there\'s still an issue.');
  console.log('If you don\'t see the logs, Supabase realtime might not be configured.');
  console.log('');
}

rl.question('Press Enter to show webhook testing instructions...', (answer) => {
  testWebhook().then(() => {
    rl.close();
  });
});