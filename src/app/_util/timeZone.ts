export function currentTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
export function formatTimezone(tz: string) {
  // from https://github.com/date-fns/tz/blob/a0129a070a360ddc5b994b1cd15401edd7f54563/src/date/index.js#L104
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    timeZoneName: "long",
  })
    .format(new Date())
    .replace(/^[^ ]+ +/, "");
}
