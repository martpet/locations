export function dateTimeFormat(options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("bg", {
    timeZone: "Europe/Sofia",
    ...options,
  });
}
