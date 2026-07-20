# Master Thesis Data Explorer — Version 3

Version 3 applies the user's substantive coding rule:

## Core rule

**All fulfilment analysis uses specific pledges only.**

The pipeline is:

1. All coded programme statements
2. Keep only testable pledges (`Survives Step 2? = Y`)
3. For fulfilment analysis, keep only rows where `Specific / Vague = S` (the code used in the current workbook; `Specific` is also accepted)
4. Calculate fulfilment statistics from those specific pledges only

Any fulfilment values that happen to exist for vague pledges are ignored entirely for fulfilment analysis.

In the Pledge Explorer, vague pledges remain browsable, but their fulfilment-analysis status is shown as:

`Ignored for fulfilment analysis`

This is intentional even when the workbook contains a value such as Fulfilled, Partly Fulfilled, or Not Fulfilled for that vague pledge.

## Version 3 changes

- Overall fulfilment rate: specific pledges only
- Presidency fulfilment comparison: specific pledges only
- Trio fulfilment comparison: specific pledges only
- Fulfilment distribution: specific pledges only
- Fulfilment coverage: specific pledges only
- Vague tested pledges ignored as though they had never been evaluated for fulfilment
- Pledge Explorer still includes both specific and vague testable pledges
- New Specific/Vague filter
- Vague pledges show `Ignored for fulfilment analysis`
- Descriptive non-fulfilment charts can still use all testable pledges

## Updating GitHub Pages

Replace these repository files:
- `index.html`
- `styles.css`
- `app.js`

Do not upload the Excel workbook.

Version 3 uses a new IndexedDB database name, so the workbook must be selected once after the update. It will then persist locally again.
