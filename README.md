# Master Thesis Data Explorer — Version 2

Version 2 fixes the fulfilment parsing and adds explicit Trio structure.

## What was fixed

The workbook uses exactly these fulfilment labels:
- `Fulfilled`
- `Partly Fulfilled`
- `Not Fulfilled`

Version 1 used overly loose text matching, which made the fulfilment statistics unreliable. Version 2 uses exact normalized outcome categories.

It also distinguishes:
1. all coded programme statements;
2. testable pledges (`Survives Step 2? = Y`);
3. evaluated pledges (testable pledges with a fulfilment outcome);
4. testable pledges not yet evaluated.

## Trio mapping

The current analysed Presidencies are grouped as:

- Germany–Portugal–Slovenia: Portugal, Slovenia in the current dataset
- France–Czechia–Sweden: France, Czechia, Sweden
- Spain–Belgium–Hungary: Spain, Belgium, Hungary
- Poland–Denmark–Cyprus: Poland, Denmark, and eventually Cyprus

Cyprus will appear automatically after the updated workbook contains Presidency = `Cypriot`.

## Installing the update on GitHub Pages

Replace these files in your repository:
- `index.html`
- `styles.css`
- `app.js`

Do not upload the Excel workbook.

Because Version 2 uses a new IndexedDB database name, the first time you open V2 you will be asked to select the Excel workbook again. After that, it persists locally as before.

## Current analysis views

- Fulfilment distribution
- Evaluated vs not yet evaluated
- Fulfilment outcomes by Presidency
- Evaluation coverage by Presidency
- Pledge type distribution
- Specific vs vague
- Largest sections in the testable pledge sample
- Presidency and Trio filters in the Pledge Explorer
