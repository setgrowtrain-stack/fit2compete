# Fit 2 Compete (v2)

A Creatures of Healthy Habits program. These are only the app screens; no data is stored here.

| Part | Where |
| --- | --- |
| Screens | This repo, served by GitHub Pages |
| Data, sign-in, rules (set logging, progression, InBody, meal totals) | Google Apps Script web app bound to the "Fit 2 Compete" Sheet (setgrowtrain@gmail.com) |
| Coaching (plans, questions, scan reading, weekly and monthly reviews) | Claude scheduled tasks reading and writing the Sheet's Requests, CoachNotes, InBody and Targets tabs |

The page calls the Apps Script URL in `window.F2C_API` (top of `index.html`). Bump `version.json` with every change so open phones reload.
