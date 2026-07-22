// Dynamic Expo config. The full static config still lives in app.json — this
// file only layers a per-developer iOS bundle identifier on top of it.
//
// Why: an iOS bundle identifier can only be registered to one Apple team, so
// each teammate building their own local dev build (with their own free Apple
// account) needs a unique one. Instead of editing — and conflicting on — the
// committed app.json, each developer sets IOS_BUNDLE_ID in their local .env:
//
//     IOS_BUNDLE_ID=com.jane.squadup
//
// (or inline: `IOS_BUNDLE_ID=com.jane.squadup npx expo run:ios --device`).
// It must be unique to that developer's Apple account. When unset, it falls
// back to the default committed in app.json, so nothing changes for you.
export default ({ config }) => ({
  ...config,
  ios: {
    ...config.ios,
    bundleIdentifier: process.env.IOS_BUNDLE_ID ?? config.ios.bundleIdentifier,
  },
});
