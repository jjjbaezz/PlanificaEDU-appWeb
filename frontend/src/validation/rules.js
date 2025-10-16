// Reglas atómicas
export const required = (msg = 'Este campo es obligatorio') => (v) =>
  (v !== null && v !== undefined && String(v).trim() !== '') || msg

export const isEmail = (msg = 'Correo inválido') => (v) => {
  const val = String(v || '').trim()
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
  return ok || msg
}

export const minLength = (n, msg) => (v) =>
  (String(v || '').length >= n) || (msg || `Mínimo ${n} caracteres`)

export const sameAs = (otherGetter, msg = 'Los valores no coinciden') => (v) =>
  (v === otherGetter()) || msg


export function validateField(value, rules = []) {
  for (const rule of rules) {
    const res = rule(value)
    if (res !== true) return res
  }
  return true
}

export function validateAll(schema, values) {
  const errors = {}
  let isValid = true
  for (const key of Object.keys(schema)) {
    const res = validateField(values[key], schema[key])
    if (res !== true) {
      errors[key] = res
      isValid = false
    }
  }
  return { isValid, errors }
}
