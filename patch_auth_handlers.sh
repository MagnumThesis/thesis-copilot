sed -i '/export async function getUserProfileHandler(c: Context) {/,/const result = await getUserProfile(userId);/ {
  /if (!userId) {/!b
  :a
  n
  /return c.json(/!ba
  :b
  n
  /400/!bb
  :c
  n
  /);/!bc
  :d
  n
  /}/!bd
  a\
\
    const authContext = getAuthContext(c);\
    if (!authContext || authContext.userId !== userId) {\
      return c.json(\
        { success: false, error: '\''Forbidden: Cannot access another user\\\'s profile'\'' },\
        403\
      );\
    }
}' src/worker/handlers/auth.ts
