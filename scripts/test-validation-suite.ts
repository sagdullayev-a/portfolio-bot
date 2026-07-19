import {
  validateName,
  validateEmail,
  validateTelegramUsername,
  validatePhone,
  validateMessage,
  validateContactForm,
  normalizeTelegramUsername,
  normalizePhone,
  VALIDATION_ERRORS,
} from '../src/utils/validation';

let passed = 0;
let failed = 0;

function assert(condition: boolean, description: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${description}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${description}`);
    failed++;
  }
}

console.log('=== CONTACT FORM VALIDATION TEST SUITE ===\n');

// 1. NAME TESTS
console.log('--- NAME VALIDATION ---');
assert(validateName('Aziz') === null, 'Aziz is valid');
assert(validateName('Azizxon Sagdullayev') === null, 'Azizxon Sagdullayev is valid');
assert(validateName("O'ktam") === null, "O'ktam is valid");
assert(validateName('Abdul-Aziz') === null, 'Abdul-Aziz is valid');

assert(validateName('123') === VALIDATION_ERRORS.NAME, '123 is invalid');
assert(validateName('@@##') === VALIDATION_ERRORS.NAME, '@@## is invalid');
assert(validateName('a') === VALIDATION_ERRORS.NAME, 'a (1 char) is invalid');
assert(validateName('Aziz123') === VALIDATION_ERRORS.NAME, 'Aziz123 is invalid');

// 2. EMAIL TESTS
console.log('\n--- EMAIL VALIDATION ---');
assert(validateEmail('') === null, 'Empty email is valid (optional)');
assert(validateEmail(undefined) === null, 'Undefined email is valid (optional)');
assert(validateEmail('user@gmail.com') === null, 'user@gmail.com is valid');
assert(validateEmail('hello@example.com') === null, 'hello@example.com is valid');
assert(validateEmail('firstname.lastname@mail.co.uk') === null, 'firstname.lastname@mail.co.uk is valid');

assert(validateEmail('aziz') === VALIDATION_ERRORS.EMAIL, 'aziz is invalid');
assert(validateEmail('gmail.com') === VALIDATION_ERRORS.EMAIL, 'gmail.com is invalid');
assert(validateEmail('@gmail.com') === VALIDATION_ERRORS.EMAIL, '@gmail.com is invalid');
assert(validateEmail('user@') === VALIDATION_ERRORS.EMAIL, 'user@ is invalid');
assert(validateEmail('user@gmail') === VALIDATION_ERRORS.EMAIL, 'user@gmail is invalid');
assert(validateEmail('user@@gmail.com') === VALIDATION_ERRORS.EMAIL, 'user@@gmail.com is invalid');
assert(validateEmail('user..test@gmail.com') === VALIDATION_ERRORS.EMAIL, 'user..test@gmail.com is invalid');
assert(validateEmail('user @gmail.com') === VALIDATION_ERRORS.EMAIL, 'user @gmail.com is invalid');

// 3. TELEGRAM USERNAME TESTS
console.log('\n--- TELEGRAM USERNAME VALIDATION ---');
assert(validateTelegramUsername('') === null, 'Empty telegram is valid (optional)');
assert(validateTelegramUsername('sagdullayev') === null, 'sagdullayev is valid');
assert(validateTelegramUsername('@sagdullayev') === null, '@sagdullayev is valid');
assert(validateTelegramUsername('azizxon_2005') === null, 'azizxon_2005 is valid');
assert(validateTelegramUsername('user123') === null, 'user123 is valid');

assert(validateTelegramUsername('abc') === VALIDATION_ERRORS.TELEGRAM, 'abc (< 5 chars) is invalid');
assert(validateTelegramUsername('user name') === VALIDATION_ERRORS.TELEGRAM, 'user name (space) is invalid');
assert(validateTelegramUsername('@@@user') === VALIDATION_ERRORS.TELEGRAM, '@@@user (stripped to 4 chars) is invalid');
assert(validateTelegramUsername('user!!!') === VALIDATION_ERRORS.TELEGRAM, 'user!!! is invalid');
assert(validateTelegramUsername('😊😊😊') === VALIDATION_ERRORS.TELEGRAM, '😊😊😊 is invalid');

assert(normalizeTelegramUsername('@sagdullayev') === 'sagdullayev', '@sagdullayev normalizes to sagdullayev');
assert(normalizeTelegramUsername('@@@sagdullayev') === 'sagdullayev', '@@@sagdullayev normalizes to sagdullayev');

// 4. PHONE TESTS
console.log('\n--- PHONE VALIDATION ---');
assert(validatePhone('') === null, 'Empty phone is valid (optional)');
assert(validatePhone('+998901234567') === null, '+998901234567 is valid');
assert(validatePhone('998901234567') === null, '998901234567 is valid');
assert(validatePhone('901234567') === null, '901234567 is valid');

assert(validatePhone('+998 90 123 45 67') === VALIDATION_ERRORS.PHONE, '+998 90 123 45 67 (spaces) is invalid');
assert(validatePhone('998 90 1234567') === VALIDATION_ERRORS.PHONE, '998 90 1234567 (spaces) is invalid');
assert(validatePhone('90 1234567') === VALIDATION_ERRORS.PHONE, '90 1234567 (spaces) is invalid');
assert(validatePhone('abc123') === VALIDATION_ERRORS.PHONE, 'abc123 is invalid');
assert(validatePhone('+99890abc123') === VALIDATION_ERRORS.PHONE, '+99890abc123 is invalid');

assert(normalizePhone('901234567') === '+998901234567', '901234567 normalizes to +998901234567');
assert(normalizePhone('998901234567') === '+998901234567', '998901234567 normalizes to +998901234567');
assert(normalizePhone('+998901234567') === '+998901234567', '+998901234567 normalizes to +998901234567');

// 5. MESSAGE TESTS
console.log('\n--- MESSAGE VALIDATION ---');
assert(validateMessage('Salom, men Azizman') === null, 'Salom, men Azizman (18 chars) is valid');
assert(validateMessage('Hi') === VALIDATION_ERRORS.MESSAGE, 'Hi (< 5 chars) is invalid');
assert(validateMessage('     ') === VALIDATION_ERRORS.MESSAGE, 'Only spaces is invalid');

// 6. COMPOSITE FORM TESTS
console.log('\n--- COMPOSITE FORM VALIDATION ---');
const validRes = validateContactForm({
  name: 'Azizxon Sagdullayev',
  email: 'user@gmail.com',
  telegramUsername: '@sagdullayev',
  phone: '901234567',
  message: 'Hello, this is a test message!',
});
assert(validRes.isValid === true, 'Complete valid form passes');
assert(validRes.normalizedData?.phone === '+998901234567', 'Phone normalized to +998901234567');
assert(validRes.normalizedData?.telegramUsername === 'sagdullayev', 'Telegram normalized to sagdullayev without @');

const invalidRes = validateContactForm({
  name: 'Azizxon',
  email: 'invalid-email',
  message: 'Short',
});
assert(invalidRes.isValid === false, 'Invalid form fails');
assert(invalidRes.error === VALIDATION_ERRORS.EMAIL, 'First error is returned correctly');

console.log(`\n========================================`);
console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log(`========================================`);

if (failed > 0) process.exit(1);
