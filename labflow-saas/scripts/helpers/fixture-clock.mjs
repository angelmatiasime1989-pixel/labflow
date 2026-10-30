// Clock for dated synthetic fixtures, never loaded by the app or current security suites.
const NativeDate=globalThis.Date,instant=NativeDate.parse('2026-10-20T18:00:00Z');
globalThis.Date=class FixtureDate extends NativeDate{constructor(...args){super(...(args.length?args:[instant]));}static now(){return instant;}};
