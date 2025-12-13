// controllers/auto-enrollment.controller.js
import * as autoEnrollmentService from '../services/auto-enrollment.service.js';

const httpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

// POST /auto-enrollment/enroll-from-schedule
export const enrollFromSchedule = async (req, res) => {
  try {
    const userId = req.user.id;
    const { horarioId } = req.body;

    if (!horarioId) {
      throw httpError(400, 'El campo horarioId es requerido');
    }

    const result = await autoEnrollmentService.enrollFromSchedule(userId, horarioId);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error en enrollFromSchedule controller:', error);
    const status = error.status || 500;
    
    return res.status(status).json({
      success: false,
      message: error.message || 'Error al realizar inscripciones automáticas'
    });
  }
};

// GET /auto-enrollment/validate/:horarioId
export const validateEnrollment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { horarioId } = req.params;

    const result = await autoEnrollmentService.validateAutoEnrollment(userId, horarioId);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error en validateEnrollment controller:', error);
    const status = error.status || 500;
    
    return res.status(status).json({
      success: false,
      message: error.message || 'Error al validar inscripciones automáticas'
    });
  }
};