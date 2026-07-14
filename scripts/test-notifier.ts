import { notifyAdmin } from '../src/services/notifier';

async function test() {
  console.log('Sending test notification to admin...');
  await notifyAdmin({
    type: 'contact_form',
    title: 'Test Notification from CLI',
    details: {
      name: 'Azizxon',
      email: 'test@example.com',
      message: 'This is a test notification to verify Phase 3 works correctly!',
    },
  });
  console.log('Test notification attempt completed.');
}

test().catch(console.error);
