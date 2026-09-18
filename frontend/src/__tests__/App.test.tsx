/**
 * Frontend Test Suite: PII Scrubber Validation
 *
 * Validates that the zero-knowledge PII scrubber correctly redacts
 * sensitive identifiers (SSNs, emails, phone numbers, names, credit cards)
 * before any data is transmitted to the backend API.
 *
 * These tests are pure TypeScript logic tests that compile cleanly
 * without requiring React DOM or testing library dependencies.
 */

import { scrubPII } from '../utils/piiScrubber';

// ============================================================
// SSN Redaction Tests
// ============================================================

function testSSNRedaction(): void {
  const input = "My SSN is 123-45-6789 and I need help.";
  const result = scrubPII(input);
  if (result.includes("123-45-6789")) {
    throw new Error("FAIL: SSN was not redacted");
  }
  if (!result.includes("[REDACTED_SSN]")) {
    throw new Error("FAIL: SSN redaction marker not found");
  }
}

// ============================================================
// Email Redaction Tests
// ============================================================

function testEmailRedaction(): void {
  const input = "Contact me at john.doe@example.com for details.";
  const result = scrubPII(input);
  if (result.includes("john.doe@example.com")) {
    throw new Error("FAIL: Email was not redacted");
  }
  if (!result.includes("[REDACTED_EMAIL]")) {
    throw new Error("FAIL: Email redaction marker not found");
  }
}

// ============================================================
// Phone Number Redaction Tests
// ============================================================

function testPhoneRedaction(): void {
  const input = "Call us at 555-123-4567 for support.";
  const result = scrubPII(input);
  if (result.includes("555-123-4567")) {
    throw new Error("FAIL: Phone number was not redacted");
  }
  if (!result.includes("[REDACTED_PHONE]")) {
    throw new Error("FAIL: Phone redaction marker not found");
  }
}

// ============================================================
// Named Entity Redaction Tests
// ============================================================

function testNameRedaction(): void {
  const input = "Signed by: John Smith on this date.";
  const result = scrubPII(input);
  if (result.includes("John Smith")) {
    throw new Error("FAIL: Name was not redacted");
  }
  if (!result.includes("[REDACTED_NAME]")) {
    throw new Error("FAIL: Name redaction marker not found");
  }
}

// ============================================================
// Empty Input Handling Tests
// ============================================================

function testEmptyInput(): void {
  const result = scrubPII("");
  if (result !== "") {
    throw new Error("FAIL: Empty input should return empty string");
  }
}

function testNullishInput(): void {
  const result = scrubPII(null as unknown as string);
  if (result !== "") {
    throw new Error("FAIL: Null input should return empty string");
  }
}

// ============================================================
// Clean Text Passthrough Tests
// ============================================================

function testCleanTextPassthrough(): void {
  const input = "This contract is governed by the laws of Delaware.";
  const result = scrubPII(input);
  if (result !== input) {
    throw new Error("FAIL: Clean text should pass through unchanged");
  }
}

// ============================================================
// Credit Card Redaction Tests
// ============================================================

function testCreditCardRedaction(): void {
  const input = "Payment card: 4111-1111-1111-1111 on file.";
  const result = scrubPII(input);
  if (result.includes("4111-1111-1111-1111")) {
    throw new Error("FAIL: Credit card was not redacted");
  }
  if (!result.includes("[REDACTED_ACCOUNT]")) {
    throw new Error("FAIL: Credit card redaction marker not found");
  }
}

// ============================================================
// Execute All Tests
// ============================================================

testSSNRedaction();
testEmailRedaction();
testPhoneRedaction();
testNameRedaction();
testEmptyInput();
testNullishInput();
testCleanTextPassthrough();
testCreditCardRedaction();
