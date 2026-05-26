import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

function createDisabledSupabaseClient(): SupabaseClient {
  const missingVars = [
    !supabaseUrl ? 'VITE_SUPABASE_URL' : null,
    !supabaseAnonKey ? 'VITE_SUPABASE_ANON_KEY' : null,
  ].filter((value): value is string => Boolean(value))

  const configurationError = new Error(
    `Missing frontend Supabase env vars: ${missingVars.join(', ')}. Copy .env.example to .env and set them before running Vite.`
  )

  const resolvedNoopResponse = Promise.resolve({
    data: null,
    error: configurationError,
  })

  const createQueryProxy = () => {
    const handler: ProxyHandler<object> = {
      get(_target, prop) {
        if (prop === 'then') return resolvedNoopResponse.then.bind(resolvedNoopResponse)
        if (prop === 'catch') return resolvedNoopResponse.catch.bind(resolvedNoopResponse)
        if (prop === 'finally') return resolvedNoopResponse.finally.bind(resolvedNoopResponse)
        if (prop === 'single' || prop === 'maybeSingle') return () => resolvedNoopResponse

        if (typeof prop === 'string') {
          const chainMethods = new Set([
            'select',
            'insert',
            'update',
            'delete',
            'upsert',
            'eq',
            'neq',
            'gt',
            'gte',
            'lt',
            'lte',
            'like',
            'ilike',
            'in',
            'contains',
            'containedBy',
            'overlaps',
            'match',
            'or',
            'not',
            'filter',
            'order',
            'limit',
            'range',
            'rangeGt',
            'rangeGte',
            'rangeLt',
            'rangeLte',
            'textSearch',
            'csv',
          ])

          if (chainMethods.has(prop)) return () => new Proxy({}, handler)
        }

        return undefined
      },
    }

    return new Proxy({}, handler)
  }

  const auth = {
    getSession: async () => ({
      data: { session: null },
      error: null,
    }),
    onAuthStateChange: () => ({
      data: {
        subscription: {
          unsubscribe: () => undefined,
        },
      },
    }),
    signUp: async () => ({
      data: { user: null, session: null },
      error: configurationError,
    }),
    signInWithPassword: async () => ({
      data: { user: null, session: null },
      error: configurationError,
    }),
    signInWithOAuth: async () => ({
      data: { provider: null, url: null },
      error: configurationError,
    }),
    signOut: async () => ({
      error: null,
    }),
  }

  return new Proxy({} as SupabaseClient, {
    get(_target, prop) {
      if (prop === 'auth') return auth
      if (prop === 'from') return () => createQueryProxy()
      if (prop === 'channel') return () => createQueryProxy()
      if (prop === 'removeChannel' || prop === 'removeAllChannels') return () => undefined
      if (prop === 'rpc') return () => resolvedNoopResponse
      if (prop === 'storage') {
        return new Proxy(
          {},
          {
            get() {
              return () => resolvedNoopResponse
            },
          }
        )
      }

      return undefined
    },
  })
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createDisabledSupabaseClient()
