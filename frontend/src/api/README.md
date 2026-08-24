# API layer

`client.ts` is the single JSON/multipart HTTP gateway. It adds the Sanctum bearer token, normalizes API and validation errors, builds query strings, and clears an expired session on HTTP 401. `tokenStorage.ts` selects local or session storage from the login “Remember me” choice.
