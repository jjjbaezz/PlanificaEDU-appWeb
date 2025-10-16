import { required, isEmail, minLength, sameAs } from './rules'

export const loginSchema = {
  email: [required('El correo es obligatorio'), isEmail('Formato de correo inválido')],
  password: [required('La contraseña es obligatoria'), minLength(6, 'Mínimo 6 caracteres')],
}

export const getRegisterSchema = (passwordRef) => ({
  nombre: [required('El nombre es obligatorio')],
  email: [required('El correo es obligatorio'), isEmail('Formato de correo inválido')],
  password: [required('La contraseña es obligatoria'), minLength(6, 'Mínimo 6 caracteres')],
  confirm: [
    required('Debes confirmar la contraseña'),
    sameAs(() => passwordRef.value, 'Las contraseñas no coinciden'),
  ],
})
  