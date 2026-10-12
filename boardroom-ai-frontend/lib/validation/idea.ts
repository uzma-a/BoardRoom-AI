/**
 * Mirrors backend/security/validation.py's validate_idea_text exactly
 * (min 10, max 2000 characters) so the user sees the same constraint
 * client-side, instantly, instead of discovering it only after a round
 * trip to the API returns a 422.
 */
export const IDEA_MIN_LENGTH = 10;
export const IDEA_MAX_LENGTH = 2000;

export function validateIdea(idea: string): string | null {
  const trimmed = idea.trim();
  if (trimmed.length === 0) {
    return "Describe your business idea to convene the board.";
  }
  if (trimmed.length < IDEA_MIN_LENGTH) {
    return `Add a bit more detail — at least ${IDEA_MIN_LENGTH} characters.`;
  }
  if (trimmed.length > IDEA_MAX_LENGTH) {
    return `Keep it under ${IDEA_MAX_LENGTH} characters — try summarizing more concisely.`;
  }
  return null;
}
