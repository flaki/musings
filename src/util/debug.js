export const DEBUG = (...args) => (process.env['DEBUG'] ? console.log(...args) : void 0)
