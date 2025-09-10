# DashLite Theme Integration

## Integration Steps

1. **Inventory & Safety**
   - See `docs/dashlite-inventory.md` for a full list of DashLite files and current style/script config.

2. **Global Styles**
   - Imported DashLite CSS (`root/root.css` and `styles.css`) at the top of `src/styles/styles.scss` for global precedence.

3. **Global Scripts**
   - Added `src/assets/root/js/scripts.js` to the `angular.json` scripts array for the main app.

4. **Assets**
   - All DashLite fonts, images, and JS are under `src/assets/` and included in the assets array.

5. **No jQuery**
   - DashLite JS references jQuery, but no jQuery is present in `package.json` or assets. If any JS errors appear, add jQuery to assets and scripts array in the correct order.

6. **No logic or event flow was changed.**

## Rollback Instructions

- Remove the two `@import` lines for DashLite CSS from `src/styles/styles.scss`.
- Remove `src/assets/root/js/scripts.js` from the `angular.json` scripts array.
- Remove DashLite files from `src/assets/` if desired.

## Testing Checklist

- [ ] Run `ng build --configuration production` (should pass)
- [ ] Run `npm run lint` (should pass)
- [ ] Manually test major screens for DashLite theme and no console errors

---

This file documents the DashLite theme integration for future reference and rollback.
