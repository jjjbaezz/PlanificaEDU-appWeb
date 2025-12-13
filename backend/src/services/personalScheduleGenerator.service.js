// services/personalScheduleGenerator.service.js
import ScheduleGenerator from './scheduleGenerator.service.js';

class PersonalScheduleGenerator extends ScheduleGenerator {
  constructor(periodoId, estudianteId, options = {}) {
    super(periodoId, options);
    this.estudianteId = estudianteId;
  }

  async loadData() {
    await super.loadData();
    
    // 1. Obtener las materias seleccionadas por el estudiante
    const selections = await prisma.selecciones_materia.findMany({
      where: {
        usuario_id: this.estudianteId,
        periodo_id: this.periodoId
      },
      include: {
        materias: true
      }
    });

    // 2. Filtrar solo los grupos de las materias seleccionadas
    this.data.groups = this.data.groups.filter(group => 
      selections.some(sel => sel.materia_id === group.materia_id)
    );

    // 3. Obtener preferencias del estudiante
    this.studentPreferences = await prisma.preferencias_usuario.findUnique({
      where: { usuario_id: this.estudianteId }
    });

    console.log(`Generando horario personalizado para ${selections.length} materias`);
  }

  evaluateSolution(solution) {
    let score = super.evaluateSolution(solution);
    
    // Añadir puntuación basada en preferencias del estudiante
    if (this.studentPreferences) {
      score += this.evaluateStudentPreferences(solution);
    }
    
    return score;
  }

  evaluateStudentPreferences(solution) {
    let preferenceScore = 0;
    const { weights } = this.options;
    
    // 1. Evaluar turno preferido
    if (this.studentPreferences.turno_preferido) {
      solution.assignments.forEach(assignment => {
        if (assignment.valid && assignment.block) {
          if (assignment.block.turno !== this.studentPreferences.turno_preferido) {
            preferenceScore += weights.preference;
          }
        }
      });
    }
    
    // 2. Evaluar días a evitar
    if (this.studentPreferences.evitar_dias && this.studentPreferences.evitar_dias.length > 0) {
      solution.assignments.forEach(assignment => {
        if (assignment.valid && assignment.block) {
          if (this.studentPreferences.evitar_dias.includes(assignment.block.dia)) {
            preferenceScore += weights.preference * 2;
          }
        }
      });
    }
    
    // 3. Evaluar compactación (preferencia del estudiante)
    const compactacionDeseada = this.studentPreferences.compactacion || 5;
    preferenceScore += this.evaluateCompactnessForStudent(solution, compactacionDeseada);
    
    return preferenceScore;
  }

  evaluateCompactnessForStudent(solution, desiredCompactness) {
    // Calcular qué tan compacto es el horario vs lo deseado
    const bloquesPorDia = {};
    
    solution.assignments.forEach(assignment => {
      if (assignment.valid && assignment.block) {
        const dia = assignment.block.dia;
        if (!bloquesPorDia[dia]) bloquesPorDia[dia] = 0;
        bloquesPorDia[dia]++;
      }
    });
    
    // Penalizar días con pocos bloques si se desea alta compactación
    let compactnessPenalty = 0;
    const diasConClases = Object.keys(bloquesPorDia).length;
    
    if (desiredCompactness <= 3 && diasConClases > 3) {
      // Alta compactación deseada pero hay muchas días con clases
      compactnessPenalty += (diasConClases - 3) * 100;
    }
    
    return compactnessPenalty;
  }
}

export default PersonalScheduleGenerator;