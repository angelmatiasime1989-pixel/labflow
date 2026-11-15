// Historical fixtures describe October 2026. Freeze only the isolated test process.
const NativeDate=Date;
export const TEST_DATE='2026-10-13T12:00:00Z';
globalThis.Date=class extends NativeDate{
 constructor(...args){super(...(args.length?args:[TEST_DATE]));}
 static now(){return new NativeDate(TEST_DATE).getTime();}
};
