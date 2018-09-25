export const DEFAULT_LANGUAGE = process.env['CFG_DEFAULT_LANGUAGE'] || 'en'

export const LANGUAGES = ( process.env['CFG_LANGUAGES'] || 'en,hu' ).split(/\W/)
