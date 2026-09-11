# English legal pages need a human legal read

`app/src/app/en/terms`, `app/src/app/en/privacy` and `app/src/app/en/refunds` render
`legal.terms`, `legal.privacy` and `legal.refunds` from `app/messages/en.json`
(via `getLegalDoc` in `app/src/features/legal/legalContent.ts`). That English
text is our own translation of the Bulgarian original, not drafted or checked
by a lawyer. It must get a human legal read before the English signup path
goes live.

The Bulgarian pages (`app/src/app/(legal)/*`) are unaffected and need no review.
