import { prisma } from '../prisma.js';
import { GeneticAlgorithm } from '../algorithms/geneticAlgorithm.js';

class ScheduleGenerator {
  constructor(userId, periodoId) {
    this.userId = userId;
    this.periodoId = periodoId;
    this.populationSize = 50;
    this.generations = 100;
    this.mutationRate = 0.1;
  }

  async generate() {
    try {
      console.log('🔄 Iniciando generación de horario...');
      
      // 1. Obtener datos necesarios
      const data = await this.loadData();
      
      console.log('📊 Datos cargados:', {
        selecciones: data.selecciones.length,
        grupos: data.grupos.length,
        bloques: data.bloques.length,
        aulas: data.aulas.length
      });
      
      // 2. Validar que haya suficientes grupos
      if (!this.validateData(data)) {
        throw new Error('No hay suficientes grupos disponibles para las materias seleccionadas');
      }
      
      // 3. Ejecutar algoritmo genético
      const bestSchedule = this.runGeneticAlgorithm(data);
      
      if (!bestSchedule || !bestSchedule.gruposSeleccionados || bestSchedule.gruposSeleccionados.length === 0) {
        throw new Error('No se pudo generar un horario válido');
      }
      
      // 4. Guardar horario generado
      const savedSchedule = await this.saveSchedule(bestSchedule);
      
      return savedSchedule;
    } catch (error) {
      console.error('❌ Error generando horario:', error);
      throw error;
    }
  }

  async loadData() {
    // Obtener selecciones del usuario
    const selecciones = await prisma.selecciones_materia.findMany({
      where: {
        usuario_id: this.userId,
        periodo_id: this.periodoId
      },
      include: {
        materias: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            creditos: true
          }
        }
      },
      orderBy: { prioridad: 'asc' }
    });

    console.log(`📝 ${selecciones.length} selecciones encontradas`);

    // Obtener grupos disponibles para cada materia
    const materiaIds = selecciones.map(s => s.materia_id);
    
    const grupos = await prisma.grupos.findMany({
      where: {
        periodo_id: this.periodoId,
        materia_id: { in: materiaIds }
      },
      include: {
        materias: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            creditos: true
          }
        },
        usuarios: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        horario_detalle: {
          include: {
            bloques_horarios: {
              select: {
                id: true,
                dia: true,
                hora_inicio: true,
                hora_fin: true,
                turno: true
              }
            },
            aulas: {
              select: {
                id: true,
                codigo: true,
                capacidad: true,
                tipo: true,
                edificio_id: true
              }
            }
          }
        },
        _count: {
          select: { inscripciones: true }
        }
      }
    });

    console.log(`👥 ${grupos.length} grupos disponibles`);

    // Obtener preferencias del usuario
    const preferencias = await prisma.preferencias_usuario.findUnique({
      where: { usuario_id: this.userId }
    });

    // Obtener bloques horarios
    const bloques = await prisma.bloques_horarios.findMany({
      orderBy: [
        { dia: 'asc' },
        { hora_inicio: 'asc' }
      ]
    });

    // Obtener aulas
    const aulas = await prisma.aulas.findMany({
      include: {
        edificios: {
          select: {
            id: true,
            codigo: true,
            nombre: true
          }
        }
      }
    });

    return {
      selecciones: selecciones.map(s => ({
        id: s.id,
        materia_id: s.materia_id,
        prioridad: s.prioridad,
        materia: s.materias
      })),
      grupos: grupos.map(g => ({
        id: g.id,
        materia_id: g.materia_id,
        materia: g.materias,
        profesor: g.usuarios,
        seccion: g.seccion,
        cupo_max: g.cupo_max,
        inscritos: g._count.inscripciones,
        disponibilidad: Math.max(g.cupo_max - g._count.inscripciones, 0),
        horario_detalle: g.horario_detalle.map(hd => ({
          bloque_id: hd.bloques_horarios.id,
          dia: hd.bloques_horarios.dia,
          hora_inicio: hd.bloques_horarios.hora_inicio,
          hora_fin: hd.bloques_horarios.hora_fin,
          turno: hd.bloques_horarios.turno,
          aula_id: hd.aulas?.id,
          aula: hd.aulas
        }))
      })),
      preferencias: preferencias || {
        turno_preferido: null,
        compactacion: 5,
        evitar_dias: [],
        pesos: null
      },
      bloques: bloques.map(b => ({
        id: b.id,
        dia: b.dia,
        hora_inicio: b.hora_inicio,
        hora_fin: b.hora_fin,
        turno: b.turno
      })),
      aulas: aulas.map(a => ({
        id: a.id,
        codigo: a.codigo,
        capacidad: a.capacidad,
        tipo: a.tipo,
        edificio: a.edificios
      })),
      periodo: this.periodoId
    };
  }

  validateData(data) {
    // Verificar que cada materia tenga al menos un grupo disponible
    const materiasConGrupos = new Set(data.grupos.map(g => g.materia_id));
    const todasTienenGrupos = data.selecciones.every(s => 
      materiasConGrupos.has(s.materia_id)
    );
    
    if (!todasTienenGrupos) {
      console.error('❌ Algunas materias no tienen grupos:', {
        selecciones: data.selecciones.map(s => s.materia.codigo),
        gruposPorMateria: materiasConGrupos.size
      });
    }
    
    return todasTienenGrupos && data.grupos.length > 0;
  }

  runGeneticAlgorithm(data) {
    console.log('🧬 Iniciando algoritmo genético...');
    
    const ga = new GeneticAlgorithm({
      populationSize: this.populationSize,
      generations: this.generations,
      mutationRate: this.mutationRate,
      data
    });

    return ga.run();
  }

  async saveSchedule(schedule) {
    console.log('💾 Guardando horario...');
    
    // Crear el horario principal
    const horario = await prisma.horarios.create({
      data: {
        periodo_id: this.periodoId,
        estado: 'DONE',
        score: schedule.score || 0,
        creado_por: this.userId
      }
    });

    console.log(`📅 Horario creado con ID: ${horario.id}`);

    // Crear los detalles del horario
    const detalles = [];
    
    for (const grupo of schedule.gruposSeleccionados) {
      if (grupo.horario_detalle && grupo.horario_detalle.length > 0) {
        for (const horarioDetalle of grupo.horario_detalle) {
          detalles.push({
            horario_id: horario.id,
            grupo_id: grupo.id,
            aula_id: horarioDetalle.aula_id || null,
            bloque_id: horarioDetalle.bloque_id
          });
        }
      }
    }

    if (detalles.length > 0) {
      await prisma.horario_detalle.createMany({
        data: detalles
      });
    }

    console.log(`✅ ${detalles.length} detalles de horario guardados`);

    return {
      id: horario.id,
      periodo_id: horario.periodo_id,
      estado: horario.estado,
      score: horario.score,
      creado_por: horario.creado_por,
      created_at: horario.created_at,
      gruposSeleccionados: schedule.gruposSeleccionados.length
    };
  }
}

export { ScheduleGenerator };