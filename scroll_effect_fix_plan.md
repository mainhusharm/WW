# Scroll Effect Fix Plan

## Task: Fix scroll reveal effect to happen faster

### Steps:
- [x] Examine current scroll effect implementation in ProductionLandingPage.tsx
- [x] Identify scroll reveal configuration and thresholds
- [x] Adjust scroll reveal parameters to make elements appear sooner
- [x] Test the changes to ensure smooth operation
- [x] Verify the fix works as expected

### Goal: Make scroll reveal happen faster so users see content sooner while scrolling

### Changes Made:
- Changed scroll offset from ["start center", "center end"] to ["start 80%", "end 20%"] for all sections
- This makes animations start when elements are 80% into the viewport instead of 50%, creating faster reveals
