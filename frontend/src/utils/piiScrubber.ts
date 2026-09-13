/**
 * Client-Side PII Scrubber
 * 
 * Executes zero-knowledge redaction of sensitive identifiers before 
 * text payloads are transmitted to the FastAPI backend.
 * Required per SECURITY.md (REQ-EVAL-001)
 */

export const scrubPII = (text: string): string => {
  if (!text) return "";
  
  // 1. Social Security Numbers (###-##-####)
  let scrubbed = text.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_SSN]');
  
  // 2. Email Addresses
  scrubbed = scrubbed.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED_EMAIL]');
  
  // 3. Phone Numbers (Simple US format for hackathon context)
  scrubbed = scrubbed.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[REDACTED_PHONE]');
  
  // 4. Basic Named Entity Heuristics 
  // Naive approach avoiding heavy client-side NLP libraries to keep bundle small
  scrubbed = scrubbed.replace(/(Name:|Signed by:|Party A:|Party B:)\s*([A-Z][a-z]+\s[A-Z][a-z]+)/g, '$1 [REDACTED_NAME]');
  
  // 5. Credit Card / Financial Accounts (Luhn omitted for brevity, basic 16-digit regex)
  scrubbed = scrubbed.replace(/\b(?:\d{4}[ -]?){3}\d{4}\b/g, '[REDACTED_ACCOUNT]');
  
  return scrubbed;
};
