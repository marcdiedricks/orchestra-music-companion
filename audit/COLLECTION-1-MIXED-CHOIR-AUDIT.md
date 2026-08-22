# Collection 1 — Mixed Choir Hymn Collection Audit

Status: REPAIR REQUIRED — audit in progress
Authority: supplied `Hymn Collection.pdf`
Target: `data/mixed-choir-index.js`

## Audit method
1. Treat the supplied PDF as the only authority for number, title and source PDF page.
2. Check all numbers 1–420.
3. Do not infer a title when PDF text extraction is uncertain.
4. Any uncertain score heading is placed in manual-review queue before the live index is changed.
5. Live app is not frozen until all 420 entries are source-confirmed.

## Current extraction checkpoint
- Expected hymn numbers: 420
- Number slots currently present in app: 420
- Score headings machine-confirmed directly from PDF in first extraction pass: 291
- Headings requiring direct/manual source-page review because music-PDF text extraction did not expose a reliable heading: 129
- Result: REPAIR REQUIRED. Presence of 420 slots does not prove the mappings are correct.

## Confirmed defect area
The current app diverges from the supplied source in the 239+ area. Source-confirmed examples:
- 239 — O how shall I receive Thee? — PDF page 415
- 240 — All who seek happiness — PDF page 416
- 241 — Reflecting on Thy grace — begins on PDF page 416
- 242 — How wonderful the name of Jesus — PDF page 418
- 243 — Unto the Father's name — PDF page 419
- 244 — I will fill this house with glory — PDF page 423
- 245 — Our longing hearts have been prepared — PDF page 427
- 246 — Here's my soul — PDF page 429
- 247 — O Zion, sweet home of the blest — PDF page 432
- 249 — The Lord shall come! — PDF page 434
- 250 — How sweet are Thy words — PDF page 435

## Manual-review queue after first extraction pass
34, 46, 51, 57, 58, 59, 63, 71, 78, 80, 82, 83, 84, 89, 93, 96, 97, 100, 103, 108, 109, 116, 117, 121, 122, 123, 124, 125, 129, 149, 151, 152, 153, 162, 165, 167, 168, 169, 175, 177, 182, 187, 188, 189, 192, 200, 202, 210, 213, 214, 215, 217, 218, 223, 225, 229, 230, 232, 233, 235, 236, 237, 241, 248, 255, 258, 259, 261, 265, 266, 267, 268, 269, 272, 273, 276, 277, 280, 283, 289, 290, 291, 293, 296, 297, 301, 302, 306, 307, 308, 314, 315, 316, 322, 323, 324, 333, 334, 336, 339, 341, 343, 345, 347, 349, 350, 351, 352, 354, 356, 358, 359, 360, 361, 362, 363, 364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386, 387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 419, 420

Note: this queue records extraction uncertainty, not missing hymns. Each entry must be checked against the actual PDF before repair.

## Freeze gate
Collection 1 may only be marked PASS when:
- all 420 numbers are accounted for;
- all 420 titles are source-confirmed;
- all 420 start pages are source-confirmed;
- no duplicate/missing number remains;
- repaired app passes low/middle/high and random-number tests.
