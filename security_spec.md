# Firestore Security Specification

## Data Invariants
1. A flashcard must belong to the authenticated user (`userId` matches `request.auth.uid`).
2. A folder must belong to the authenticated user.
3. Flashcards can optionally belong to a folder, but the folder must exist and belong to the same user.
4. Timestamps (`createdAt`, `lastViewedAt`) must be valid numbers.
5. Difficulty levels must be one of 'easy', 'medium', or 'hard'.

## The "Dirty Dozen" Payloads (Targeting users/{userId}/flashcards/{id})

1. **Identity Spoofing**: Create a flashcard with a different `userId`.
   ```json
   { "word": "Spoof", "userId": "attacker_id", "createdAt": 12345 }
   ```
2. **Ghost Field Injection**: Add a `verified: true` field.
   ```json
   { "word": "Ghost", "userId": "my_id", "verified": true, "createdAt": 12345 }
   ```
3. **Resource Poisoning**: Use a 2MB string for the `word`.
4. **Invalid Type**: Set `correctCount` to a string.
5. **Terminal State Bypass**: Attempt to reset `correctCount` to 0 after it has been incremented.
6. **Orphaned Write**: Create a card in a folder that doesn't exist.
7. **Cross-User Read**: Attempt to read `users/alice/flashcards/123` as `bob`.
8. **PII Leak**: Storing cleartext passwords or emails in hint fields (though not strictly blocked by rules, we restrict access).
9. **Bulk Deletion**: Attempting to delete cards not belonging to the user.
10. **Timestamp Fraud**: Setting `createdAt` to a future date.
11. **Difficulty Injection**: Setting difficulty to 'god-mode'.
12. **ID Injection**: Using `../../junk` as a document ID.

## Test Runner
Wait for `firestore.rules` to be deployed.
