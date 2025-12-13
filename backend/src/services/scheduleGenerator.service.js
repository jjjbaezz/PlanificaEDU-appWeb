// services/scheduleGenerator.service.js
import { prisma } from '../prisma.js';

class ScheduleGenerator {
  constructor(periodoId, options = {}) {
    this.periodoId = periodoId;
    this.options = {
      maxIterations: 10000,
      initialTemperature: 1000,
      coolingRate: 0.995,
      timeoutMs: 30000,
      weights: {
        hardConstraint: 1000,
        professorConflict: 500,
        classroomConflict: 500,
        capacityViolation: 300,
        typeMismatch: 200,
        professorAvailability: 400,
        classroomAvailability: 400,
        professorMaxHours: 600,
        compactness: 50,
        preference: 30
      },
      ...options
    };
    
    this.data = null;
    this.currentSolution = null;
    this.bestSolution = null;
    this.temperature = this.options.initialTemperature;
  }
  
  async loadData() {
    // Cargar todos los datos necesarios
    const [groups, classrooms, blocks, professors, preferences] = await Promise.all([
      // Grupos con sus detalles
      prisma.grupos.findMany({
        where: { periodo_id: this.periodoId },
        include: {
          materias: true,
          usuarios: true,
          periodos: true,
          _count: { select: { inscripciones: true } }
        }
      }),
      
      // Aulas con disponibilidad
      prisma.aulas.findMany({
        include: {
          disponibilidad_aula: {
            where: { estado: 'DISPONIBLE' }
          },
          edificios: true
        }
      }),
      
      // Bloques horarios
      prisma.bloques_horarios.findMany({
        orderBy: [{ dia: 'asc' }, { hora_inicio: 'asc' }]
      }),
      
      // Profesores con disponibilidad y carga
      prisma.usuarios.findMany({
        where: { rol: 'PROFESOR' },
        include: {
          disponibilidad_profesor: {
            where: { estado: 'DISPONIBLE' }
          },
          profesores: true
        }
      }),
      
      // Preferencias de usuarios
      prisma.preferencias_usuario.findMany({
        where: { usuario: { rol: { in: ['PROFESOR', 'ESTUDIANTE'] } } }
      })
    ]);
    
    // Organizar datos en estructuras eficientes
    this.data = {
      groups,
      classrooms: classrooms.map(c => ({
        ...c,
        availability: new Set(c.disponibilidad_aula.map(d => d.bloque_id))
      })),
      blocks: blocks.reduce((acc, block) => {
        acc[block.id] = block;
        return acc;
      }, {}),
      professors: professors.map(p => ({
        ...p,
        availability: new Set(p.disponibilidad_profesor.map(d => d.bloque_id))
      })),
      preferences: preferences.reduce((acc, pref) => {
        acc[pref.usuario_id] = pref;
        return acc;
      }, {})
    };
    
    // Crear índices para búsqueda rápida
    this.createIndices();
  }
  
  createIndices() {
    // Índice de aulas por tipo y capacidad
    this.data.classroomsByType = {
      TEORIA: this.data.classrooms.filter(c => c.tipo === 'TEORIA'),
      LAB: this.data.classrooms.filter(c => c.tipo === 'LAB')
    };
    
    // Índice de grupos por profesor
    this.data.groupsByProfessor = this.data.groups.reduce((acc, group) => {
      if (!acc[group.profesor_id]) acc[group.profesor_id] = [];
      acc[group.profesor_id].push(group);
      return acc;
    }, {});
    
    // Mapa de bloques por día
    this.data.blocksByDay = {};
    Object.values(this.data.blocks).forEach(block => {
      if (!this.data.blocksByDay[block.dia]) this.data.blocksByDay[block.dia] = [];
      this.data.blocksByDay[block.dia].push(block);
    });
  }
  
  generateInitialSolution() {
    // Generar una solución inicial factible (greedy)
    const solution = {
      assignments: [],
      score: 0
    };
    
    // Ordenar grupos por dificultad (más restricciones primero)
    const sortedGroups = [...this.data.groups].sort((a, b) => {
      // Priorizar grupos con más inscripciones, profesores con menos disponibilidad, etc.
      return b._count.inscripciones - a._count.inscripciones;
    });
    
    for (const group of sortedGroups) {
      const assignment = this.findFeasibleAssignment(group);
      if (assignment) {
        solution.assignments.push(assignment);
      } else {
        // Si no se puede asignar, crear asignación inválida (será penalizada)
        solution.assignments.push({
          group,
          classroom: null,
          block: null,
          valid: false
        });
      }
    }
    
    solution.score = this.evaluateSolution(solution);
    return solution;
  }
  
  findFeasibleAssignment(group) {
    // Encontrar un aula y bloque factible para el grupo
    const professor = this.data.professors.find(p => p.id === group.profesor_id);
    if (!professor) return null;
    
    // Determinar tipo de aula necesario (asumir teoría por defecto)
    const aulaType = group.materias?.nombre?.toLowerCase().includes('laboratorio') ? 'LAB' : 'TEORIA';
    
    // Filtrar aulas por tipo y capacidad
    const suitableClassrooms = this.data.classrooms
      .filter(c => c.tipo === aulaType && c.capacidad >= group._count.inscripciones)
      .sort((a, b) => a.capacidad - b.capacidad); // Usar aulas más ajustadas primero
    
    // Buscar combinación aula-bloque factible
    for (const classroom of suitableClassrooms) {
      // Bloques donde el aula y profesor están disponibles
      const availableBlocks = [...classroom.availability]
        .filter(blockId => professor.availability.has(blockId))
        .map(blockId => this.data.blocks[blockId])
        .filter(Boolean)
        .sort((a, b) => {
          // Ordenar por preferencia (mañana > tarde > noche)
          const turnoOrder = { MANANA: 0, TARDE: 1, NOCHE: 2 };
          return (turnoOrder[a.turno] || 3) - (turnoOrder[b.turno] || 3);
        });
      
      for (const block of availableBlocks) {
        // Verificar que no haya conflictos con otros grupos del mismo profesor
        const hasConflict = this.data.groupsByProfessor[professor.id]?.some(g => {
          // Aquí verificaríamos si ya hay asignación en ese bloque
          // En la solución inicial, revisar asignaciones ya hechas
          return false; // Simplificado por ahora
        });
        
        if (!hasConflict) {
          return {
            group,
            classroom,
            block,
            valid: true
          };
        }
      }
    }
    
    return null;
  }
  
  evaluateSolution(solution) {
    let score = 0;
    const { weights } = this.options;
    
    // Contadores para restricciones globales
    const professorBlocks = {};
    const classroomBlocks = {};
    const professorHours = {};
    
    for (const assignment of solution.assignments) {
      if (!assignment.valid) {
        score += weights.hardConstraint * 10;
        continue;
      }
      
      const { group, classroom, block } = assignment;
      const professorId = group.profesor_id;
      
      // 1. Verificar disponibilidad del profesor
      if (!this.data.professors.find(p => p.id === professorId)?.availability.has(block.id)) {
        score += weights.professorAvailability;
      }
      
      // 2. Verificar disponibilidad del aula
      if (!classroom.availability.has(block.id)) {
        score += weights.classroomAvailability;
      }
      
      // 3. Verificar capacidad
      if (classroom.capacidad < group._count.inscripciones) {
        score += weights.capacityViolation * 
          (group._count.inscripciones - classroom.capacidad);
      }
      
      // 4. Verificar tipo de aula
      const needsLab = group.materias?.nombre?.toLowerCase().includes('laboratorio');
      if ((needsLab && classroom.tipo !== 'LAB') || 
          (!needsLab && classroom.tipo !== 'TEORIA')) {
        score += weights.typeMismatch;
      }
      
      // 5. Registrar uso para detectar conflictos
      const blockKey = `${block.id}`;
      
      // Profesor en el mismo bloque
      if (!professorBlocks[professorId]) professorBlocks[professorId] = new Set();
      if (professorBlocks[professorId].has(blockKey)) {
        score += weights.professorConflict;
      }
      professorBlocks[professorId].add(blockKey);
      
      // Aula en el mismo bloque
      if (!classroomBlocks[classroom.id]) classroomBlocks[classroom.id] = new Set();
      if (classroomBlocks[classroom.id].has(blockKey)) {
        score += weights.classroomConflict;
      }
      classroomBlocks[classroom.id].add(blockKey);
      
      // Horas del profesor
      if (!professorHours[professorId]) professorHours[professorId] = 0;
      const blockHours = (new Date(block.hora_fin) - new Date(block.hora_inicio)) / (1000 * 60 * 60);
      professorHours[professorId] += blockHours;
    }
    
    // 6. Verificar carga máxima de profesores
    for (const [professorId, hours] of Object.entries(professorHours)) {
      const professor = this.data.professors.find(p => p.id === professorId);
      const maxHours = professor?.profesores?.carga_max_horas || 20;
      
      if (hours > maxHours) {
        score += weights.professorMaxHours * (hours - maxHours);
      }
    }
    
    // 7. Evaluar compactación (evitar horarios esparcidos)
    score += this.evaluateCompactness(solution, professorBlocks);
    
    // 8. Evaluar preferencias
    score += this.evaluatePreferences(solution);
    
    return score;
  }
  
  evaluateCompactness(solution, professorBlocks) {
    let compactnessPenalty = 0;
    const { weights } = this.options;
    
    // Para cada profesor, calcular dispersión de sus bloques
    for (const [professorId, blocks] of Object.entries(professorBlocks)) {
      const blockIds = Array.from(blocks);
      const blockObjects = blockIds.map(id => this.data.blocks[id]).filter(Boolean);
      
      // Agrupar por día
      const blocksByDay = {};
      blockObjects.forEach(block => {
        if (!blocksByDay[block.dia]) blocksByDay[block.dia] = [];
        blocksByDay[block.dia].push(block);
      });
      
      // Calcular dispersión por día
      for (const dayBlocks of Object.values(blocksByDay)) {
        if (dayBlocks.length <= 1) continue;
        
        // Ordenar por hora
        dayBlocks.sort((a, b) => 
          new Date(a.hora_inicio) - new Date(b.hora_inicio));
        
        // Calcular huecos entre bloques
        let totalGap = 0;
        for (let i = 1; i < dayBlocks.length; i++) {
          const prevEnd = new Date(dayBlocks[i-1].hora_fin);
          const currStart = new Date(dayBlocks[i].hora_inicio);
          const gapHours = (currStart - prevEnd) / (1000 * 60 * 60);
          
          if (gapHours > 1) { // Penalizar huecos mayores a 1 hora
            totalGap += gapHours;
          }
        }
        
        compactnessPenalty += totalGap * weights.compactness;
      }
    }
    
    return compactnessPenalty;
  }
  
  evaluatePreferences(solution) {
    let preferencePenalty = 0;
    const { weights } = this.options;
    
    for (const assignment of solution.assignments) {
      if (!assignment.valid) continue;
      
      const { group, block } = assignment;
      const professorId = group.profesor_id;
      const preference = this.data.preferences[professorId];
      
      if (!preference) continue;
      
      // 1. Turno preferido
      if (preference.turno_preferido && block.turno !== preference.turno_preferido) {
        preferencePenalty += weights.preference;
      }
      
      // 2. Días a evitar
      if (preference.evitar_dias?.includes(block.dia)) {
        preferencePenalty += weights.preference * 2;
      }
    }
    
    return preferencePenalty;
  }
  
  generateNeighbor(solution) {
    // Crear una solución vecina modificando algunas asignaciones
    const neighbor = {
      assignments: [...solution.assignments],
      score: 0
    };
    
    // Elegir algunas asignaciones para modificar (1-3)
    const numChanges = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numChanges; i++) {
      const idx = Math.floor(Math.random() * neighbor.assignments.length);
      const assignment = neighbor.assignments[idx];
      
      if (!assignment.group) continue;
      
      // Posibles modificaciones:
      const mutationType = Math.random();
      
      if (mutationType < 0.33) {
        // Cambiar aula
        const aulaType = assignment.group.materias?.nombre?.toLowerCase().includes('laboratorio') ? 'LAB' : 'TEORIA';
        const suitableClassrooms = this.data.classrooms
          .filter(c => c.tipo === aulaType && c.capacidad >= assignment.group._count.inscripciones);
        
        if (suitableClassrooms.length > 0) {
          const newClassroom = suitableClassrooms[
            Math.floor(Math.random() * suitableClassrooms.length)
          ];
          neighbor.assignments[idx].classroom = newClassroom;
        }
      } else if (mutationType < 0.66) {
        // Cambiar bloque
        const professor = this.data.professors.find(p => p.id === assignment.group.profesor_id);
        if (!professor) continue;
        
        const availableBlocks = [...professor.availability]
          .map(id => this.data.blocks[id])
          .filter(Boolean);
        
        if (availableBlocks.length > 0) {
          const newBlock = availableBlocks[
            Math.floor(Math.random() * availableBlocks.length)
          ];
          neighbor.assignments[idx].block = newBlock;
        }
      } else {
        // Intercambiar con otra asignación
        const otherIdx = Math.floor(Math.random() * neighbor.assignments.length);
        if (otherIdx !== idx) {
          [neighbor.assignments[idx].block, neighbor.assignments[otherIdx].block] = 
          [neighbor.assignments[otherIdx].block, neighbor.assignments[idx].block];
        }
      }
    }
    
    neighbor.score = this.evaluateSolution(neighbor);
    return neighbor;
  }
  
  async run() {
    console.log(`Iniciando generación de horario para periodo ${this.periodoId}`);
    await this.loadData();
    
    this.currentSolution = this.generateInitialSolution();
    this.bestSolution = { ...this.currentSolution };
    this.temperature = this.options.initialTemperature;
    
    let iteration = 0;
    const startTime = Date.now();
    
    while (iteration < this.options.maxIterations && 
           Date.now() - startTime < this.options.timeoutMs) {
      
      // Generar vecino
      const neighbor = this.generateNeighbor(this.currentSolution);
      
      // Calcular diferencia de score
      const delta = neighbor.score - this.currentSolution.score;
      
      // Aceptar si es mejor o con probabilidad según temperatura
      if (delta < 0 || Math.random() < Math.exp(-delta / this.temperature)) {
        this.currentSolution = neighbor;
        
        // Actualizar mejor solución
        if (this.currentSolution.score < this.bestSolution.score) {
          this.bestSolution = { ...this.currentSolution };
          console.log(`Iteración ${iteration}: Nuevo mejor score = ${this.bestSolution.score}`);
        }
      }
      
      // Enfriar
      this.temperature *= this.options.coolingRate;
      iteration++;
      
      // Reporte periódico
      if (iteration % 1000 === 0) {
        console.log(`Iteración ${iteration}: Temp=${this.temperature.toFixed(2)}, Score=${this.currentSolution.score}`);
      }
    }
    
    console.log(`Finalizado después de ${iteration} iteraciones`);
    console.log(`Mejor score: ${this.bestSolution.score}`);
    
    return this.bestSolution;
  }
  
  async saveSolution(solution) {
    // Guardar la solución en la base de datos
    const transaction = [];
    
    // Crear horario
    const horario = await prisma.horarios.create({
      data: {
        periodo_id: this.periodoId,
        estado: 'DONE',
        score: solution.score,
        creado_por: this.options.userId || null
      }
    });
    
    // Crear detalles del horario
    for (const assignment of solution.assignments) {
      if (!assignment.valid || !assignment.classroom || !assignment.block) {
        continue; // Saltar asignaciones inválidas
      }
      
      transaction.push(
        prisma.horario_detalle.create({
          data: {
            horario_id: horario.id,
            grupo_id: assignment.group.id,
            aula_id: assignment.classroom.id,
            bloque_id: assignment.block.id
          }
        })
      );
    }
    
    await prisma.$transaction(transaction);
    return horario;
  }
}

export default ScheduleGenerator;