# Council Presidency Pledge Fulfilment Explorer — Version 1

A static browser-based dashboard for privately exploring an Excel pledge-coding dataset.

## Privacy architecture

- The GitHub repository contains only HTML, CSS and JavaScript.
- The thesis workbook is **not** included.
- The user selects the workbook locally in the browser.
- Parsed rows are stored in the browser's IndexedDB.
- Data persists between visits in that browser profile.
- Clearing browser/site data deletes the locally stored copy.
- Each device/browser has its own separate local copy.

Important: the page currently loads the SheetJS library from a public CDN. The thesis data is not sent to that CDN. For a fully network-independent/offline build, download and host the SheetJS library alongside the site and change the script reference in `index.html`.

## Expected workbook

The app looks for a sheet named `Pledge Coding`. If it cannot find one, it reads the first sheet.

It dynamically recognizes these columns where present:
- Presidency
- Section
- Statement
- Survives Step 2?
- Pledge Type
- Fulfillment / Fulfilment
- Notes

The main pledge views use rows where `Survives Step 2?` equals `Y`.

## Files

- `index.html` — application structure
- `styles.css` — visual design
- `app.js` — Excel parsing, IndexedDB storage, filters and visualisations
- `README.md` — setup notes

## GitHub Pages setup

1. Create a new GitHub repository. Do **not** add the Excel dataset.
2. Upload `index.html`, `styles.css`, `app.js`, and optionally this README.
3. Open repository **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the branch containing the files (normally `main`) and `/ (root)`.
6. Save and wait for GitHub Pages to publish the site.
7. Open the published site.
8. Click **Choose Excel workbook** and select the thesis workbook from the device.
9. The app parses it locally and saves the parsed dataset to IndexedDB.
10. On later visits from the same browser profile/device, the dataset should restore automatically.

## Updating the dataset

Open **Data → Replace workbook**, select the new Excel file, and the locally stored dataset is replaced. This is how the future Cyprus data can be added without changing the website code.

## Local testing

Because the app loads SheetJS from a CDN, opening `index.html` directly usually works when online. A local web server is more reliable:

Python:
`python3 -m http.server 8000`

Then visit `http://localhost:8000`.

## Version 1 scope

- Local Excel import
- IndexedDB persistence
- Overview statistics
- Interactive Presidency wheel
- Click Presidency → filtered pledge table
- Fulfilment comparison
- Searchable/filterable Pledge Explorer
- Basic fulfilment and pledge-type analysis
- Dataset replacement/deletion

The wheel currently derives its Presidency segments directly from the workbook. Trio metadata and exact chronological Presidency ordering should be added in the next iteration once the desired 11-Presidency scope and Cyprus coding are finalized.
