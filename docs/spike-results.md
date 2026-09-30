# Spike results (YYYY-MM-DD, Chrome <version>)

| Check | Observed | Decision |
|---|---|---|
| A. First pick + background write | … | — |
| B. After restart | granted / prompt (+ persists after "allow on every visit"?: yes/no) | If granted → default destination `folder`. If prompt once per session → keep `folder`; the regrant popup (Task 10) handles it. If prompt on *every* save → default destination `downloads` + junction (see README). |
| C. vscode:// via chrome.tabs.update | opens? page stays? prompt names extension? always-allow sticks? | If yes to all → keep `openExternal = chrome.tabs.update` (Task 13). Otherwise → use the fallback in Task 13 Step 6. |
| D. downloads.setUiOptions | bubble hidden? | If not hidden → leave the calls in (harmless) and accept the bubble. |
