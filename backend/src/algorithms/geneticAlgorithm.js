class GeneticAlgorithm {
  constructor(config) {
    this.populationSize = config.populationSize || 50;
    this.generations = config.generations || 100;
    this.mutationRate = config.mutationRate || 0.1;
    this.data = config.data;
    this.bestSolution = null;
    this.bestScore = -Infinity;
    this.currentGeneration = 0;
  }

  run() {
    console.log(`🧬 Iniciando algoritmo genético (población: ${this.populationSize}, generaciones: ${this.generations})`);
    
    // 1. Crear población inicial
    let population = this.initializePopulation();
    
    if (population.length === 0) {
      console.error('❌ No se pudo crear población inicial');
      return this.createEmptySchedule();
    }
    
    console.log(`👥 Población inicial creada: ${population.length} individuos`);

    // 2. Evolucionar por generaciones
    for (let gen = 0; gen < this.generations; gen++) {
      this.currentGeneration = gen + 1;
      
      // Evaluar fitness
      const evaluated = population.map(schedule => {
        const fitness = this.calculateFitness(schedule);
        return { schedule, fitness };
      }).sort((a, b) => b.fitness - a.fitness);
      
      // Guardar mejor solución
      if (evaluated[0] && evaluated[0].fitness > this.bestScore) {
        this.bestScore = evaluated[0].fitness;
        this.bestSolution = evaluated[0].schedule;
        console.log(`🏆 Generación ${gen + 1}: Mejor fitness = ${this.bestScore.toFixed(2)}`);
      }
      
      // Crear nueva población
      const newPopulation = [];
      
      // Elitismo: mantener el mejor individuo
      if (evaluated[0]) {
        newPopulation.push(evaluated[0].schedule);
      }
      
      // Generar resto de la población
      while (newPopulation.length < this.populationSize) {
        // Seleccionar padres
        const parent1 = this.selectParent(evaluated);
        const parent2 = this.selectParent(evaluated);
        
        if (parent1 && parent2) {
          // Cruzar
          const child = this.crossover(parent1, parent2);
          
          // Mutar
          const mutatedChild = this.mutate(child);
          
          newPopulation.push(mutatedChild);
        }
      }
      
      population = newPopulation;
      
      // Mostrar progreso cada 10 generaciones
      if ((gen + 1) % 10 === 0) {
        console.log(`📊 Generación ${gen + 1}/${this.generations} - Mejor fitness: ${this.bestScore.toFixed(2)}`);
      }
    }
    
    console.log(`✅ Algoritmo genético completado. Mejor score: ${this.bestScore.toFixed(2)}`);
    
    return {
      ...this.bestSolution,
      score: this.bestScore,
      generaciones: this.generations,
      poblacion: this.populationSize
    };
  }

  initializePopulation() {
    const population = [];
    
    for (let i = 0; i < this.populationSize; i++) {
      const schedule = this.createRandomSchedule();
      if (schedule && schedule.gruposSeleccionados.length > 0) {
        population.push(schedule);
      }
    }
    
    return population;
  }

  createRandomSchedule() {
    const gruposPorMateria = this.groupByMateria(this.data.grupos);
    const gruposSeleccionados = [];
    const materiasSeleccionadas = new Set();
    
    // Para cada materia seleccionada, elegir un grupo aleatorio
    for (const seleccion of this.data.selecciones) {
      const materiaId = seleccion.materia_id;
      const gruposDisponibles = gruposPorMateria[materiaId] || [];
      
      if (gruposDisponibles.length > 0) {
        // Filtrar grupos sin conflictos con los ya seleccionados
        const gruposSinConflicto = this.filtrarGruposSinConflicto(
          gruposDisponibles,
          gruposSeleccionados
        );
        
        if (gruposSinConflicto.length > 0) {
          const randomIndex = Math.floor(Math.random() * gruposSinConflicto.length);
          const grupoSeleccionado = gruposSinConflicto[randomIndex];
          
          gruposSeleccionados.push(grupoSeleccionado);
          materiasSeleccionadas.add(materiaId);
        }
      }
    }
    
    // Verificar que al menos tengamos un grupo
    if (gruposSeleccionados.length === 0) {
      // Intentar con cualquier grupo disponible
      for (const seleccion of this.data.selecciones) {
        const materiaId = seleccion.materia_id;
        const gruposDisponibles = gruposPorMateria[materiaId] || [];
        
        if (gruposDisponibles.length > 0) {
          const randomIndex = Math.floor(Math.random() * gruposDisponibles.length);
          const grupoSeleccionado = gruposDisponibles[randomIndex];
          
          gruposSeleccionados.push(grupoSeleccionado);
          materiasSeleccionadas.add(materiaId);
          break;
        }
      }
    }
    
    return {
      gruposSeleccionados,
      materiasCubiertas: materiasSeleccionadas.size,
      horario: this.buildScheduleMatrix(gruposSeleccionados)
    };
  }

  filtrarGruposSinConflicto(gruposDisponibles, gruposSeleccionados) {
    if (gruposSeleccionados.length === 0) {
      return gruposDisponibles;
    }
    
    return gruposDisponibles.filter(grupo => {
      // Verificar conflictos con cada grupo ya seleccionado
      for (const grupoSeleccionado of gruposSeleccionados) {
        if (this.tieneConflictoHorario(grupo, grupoSeleccionado)) {
          return false;
        }
      }
      return true;
    });
  }

  tieneConflictoHorario(grupo1, grupo2) {
    // Un grupo no puede tener conflicto consigo mismo
    if (grupo1.id === grupo2.id) {
      return false;
    }
    
    // Verificar conflictos en los horarios
    for (const hd1 of grupo1.horario_detalle) {
      for (const hd2 of grupo2.horario_detalle) {
        if (hd1.dia === hd2.dia) {
          // Verificar si los horarios se solapan
          const inicio1 = new Date(hd1.hora_inicio).getTime();
          const fin1 = new Date(hd1.hora_fin).getTime();
          const inicio2 = new Date(hd2.hora_inicio).getTime();
          const fin2 = new Date(hd2.hora_fin).getTime();
          
          if (inicio1 < fin2 && inicio2 < fin1) {
            return true; // Hay conflicto
          }
        }
      }
    }
    
    return false;
  }

  calculateFitness(schedule) {
    if (!schedule || !schedule.gruposSeleccionados || schedule.gruposSeleccionados.length === 0) {
      return -1000;
    }
    
    let score = 100; // Puntuación base
    
    // 1. Cubrir todas las materias seleccionadas
    const materiasCubiertas = new Set(schedule.gruposSeleccionados.map(g => g.materia_id));
    const totalMaterias = this.data.selecciones.length;
    const porcentajeCobertura = materiasCubiertas.size / totalMaterias;
    
    score += porcentajeCobertura * 200; // Hasta 200 puntos por cobertura
    
    // 2. Preferencias de turno
    score += this.calculateTurnoPreferenceScore(schedule);
    
    // 3. Compactación
    score += this.calculateCompactacionScore(schedule);
    
    // 4. Días a evitar
    score += this.calculateEvitarDiasScore(schedule);
    
    // 5. Conflictos de horario (penalización)
    const conflictos = this.calculateConflictPenalty(schedule);
    score -= conflictos * 100; // Gran penalización por conflictos
    
    // 6. Cupos disponibles
    score += this.calculateCupoScore(schedule);
    
    // 7. Distribución de horarios
    score += this.calculateDistribucionScore(schedule);
    
    return Math.max(0, score);
  }

  calculateTurnoPreferenceScore(schedule) {
    if (!this.data.preferencias.turno_preferido) return 0;
    
    let matches = 0;
    let total = 0;
    
    for (const grupo of schedule.gruposSeleccionados) {
      for (const hd of grupo.horario_detalle) {
        if (hd.turno === this.data.preferencias.turno_preferido) {
          matches++;
        }
        total++;
      }
    }
    
    return total > 0 ? (matches / total) * 30 : 0;
  }

  calculateCompactacionScore(schedule) {
    const compactacion = this.data.preferencias.compactacion || 5;
    const dias = this.groupByDia(schedule);
    let score = 0;
    
    // Calcular dispersión por día
    for (const [dia, bloques] of Object.entries(dias)) {
      if (bloques.length > 1) {
        bloques.sort((a, b) => a.hora_inicio - b.hora_inicio);
        const primerBloque = bloques[0];
        const ultimoBloque = bloques[bloques.length - 1];
        const duracionTotal = ultimoBloque.hora_fin - primerBloque.hora_inicio;
        
        // Si se prefiere compactación alta, penalizar horarios largos
        if (compactacion >= 7) {
          score += Math.max(0, 20 - (duracionTotal / (1000 * 60 * 60)) * 5);
        } else if (compactacion <= 3) {
          // Si se prefiere dispersión, premiar horarios distribuidos
          score += (duracionTotal / (1000 * 60 * 60)) * 2;
        }
      }
    }
    
    return score;
  }

  calculateEvitarDiasScore(schedule) {
    const evitarDias = this.data.preferencias.evitar_dias || [];
    if (evitarDias.length === 0) return 0;
    
    let penalty = 0;
    
    for (const grupo of schedule.gruposSeleccionados) {
      for (const hd of grupo.horario_detalle) {
        if (evitarDias.includes(hd.dia)) {
          penalty += 10;
        }
      }
    }
    
    return -penalty;
  }

  calculateConflictPenalty(schedule) {
    const matriz = schedule.horario || this.buildScheduleMatrix(schedule.gruposSeleccionados);
    let conflictos = 0;
    
    for (const dia in matriz) {
      for (const bloque in matriz[dia]) {
        if (matriz[dia][bloque].length > 1) {
          conflictos += matriz[dia][bloque].length - 1;
        }
      }
    }
    
    return conflictos;
  }

  calculateCupoScore(schedule) {
    let score = 0;
    
    for (const grupo of schedule.gruposSeleccionados) {
      const porcentajeOcupado = (grupo.inscritos / grupo.cupo_max) * 100;
      
      // Preferir grupos con más cupo disponible
      if (porcentajeOcupado < 30) {
        score += 10; // Mucho cupo disponible
      } else if (porcentajeOcupado < 60) {
        score += 5; // Cupo moderado
      } else if (porcentajeOcupado < 80) {
        score += 2; // Poco cupo
      } else {
        score -= 5; // Muy poco cupo
      }
    }
    
    return score;
  }

  calculateDistribucionScore(schedule) {
    const dias = this.groupByDia(schedule);
    const numDias = Object.keys(dias).length;
    const numClases = schedule.gruposSeleccionados.reduce((total, grupo) => 
      total + grupo.horario_detalle.length, 0
    );
    
    if (numDias === 0 || numClases === 0) return 0;
    
    const promedioClasesPorDia = numClases / numDias;
    let score = 0;
    
    // Premiar distribución equilibrada
    for (const [dia, bloques] of Object.entries(dias)) {
      const diferencia = Math.abs(bloques.length - promedioClasesPorDia);
      score += Math.max(0, 5 - diferencia);
    }
    
    return score;
  }

  selectParent(evaluated) {
    if (!evaluated || evaluated.length === 0) return null;
    
    // Ruleta
    const totalFitness = evaluated.reduce((sum, ind) => sum + ind.fitness, 0);
    
    if (totalFitness <= 0) {
      // Si todos tienen fitness negativo, seleccionar aleatoriamente
      const randomIndex = Math.floor(Math.random() * evaluated.length);
      return evaluated[randomIndex].schedule;
    }
    
    let random = Math.random() * totalFitness;
    let cumulative = 0;
    
    for (const ind of evaluated) {
      cumulative += ind.fitness;
      if (cumulative >= random) {
        return ind.schedule;
      }
    }
    
    // Fallback: devolver el mejor
    return evaluated[0].schedule;
  }

  crossover(parent1, parent2) {
    if (!parent1 || !parent2) {
      return this.createRandomSchedule();
    }
    
    // Crossover uniforme: para cada materia, elegir grupo de parent1 o parent2
    const gruposSeleccionados = [];
    const materiasCubiertas = new Set();
    
    // Combinar materias de ambos padres
    const todasMaterias = [
      ...new Set([
        ...parent1.gruposSeleccionados.map(g => g.materia_id),
        ...parent2.gruposSeleccionados.map(g => g.materia_id)
      ])
    ];
    
    for (const materiaId of todasMaterias) {
      // Elegir aleatoriamente de qué padre tomar el grupo
      const useParent1 = Math.random() > 0.5;
      const sourceParent = useParent1 ? parent1 : parent2;
      
      // Buscar grupo para esta materia en el padre seleccionado
      const grupoEnParent = sourceParent.gruposSeleccionados.find(
        g => g.materia_id === materiaId
      );
      
      if (grupoEnParent && !this.tieneConflictoConSeleccionados(grupoEnParent, gruposSeleccionados)) {
        gruposSeleccionados.push(grupoEnParent);
        materiasCubiertas.add(materiaId);
      }
    }
    
    // Si no cubrimos todas las materias, intentar completar con grupos aleatorios
    if (materiasCubiertas.size < this.data.selecciones.length) {
      const gruposPorMateria = this.groupByMateria(this.data.grupos);
      
      for (const seleccion of this.data.selecciones) {
        const materiaId = seleccion.materia_id;
        
        if (!materiasCubiertas.has(materiaId)) {
          const gruposDisponibles = gruposPorMateria[materiaId] || [];
          const gruposSinConflicto = this.filtrarGruposSinConflicto(
            gruposDisponibles,
            gruposSeleccionados
          );
          
          if (gruposSinConflicto.length > 0) {
            const randomIndex = Math.floor(Math.random() * gruposSinConflicto.length);
            gruposSeleccionados.push(gruposSinConflicto[randomIndex]);
            materiasCubiertas.add(materiaId);
          }
        }
      }
    }
    
    return {
      gruposSeleccionados,
      materiasCubiertas: materiasCubiertas.size,
      horario: this.buildScheduleMatrix(gruposSeleccionados)
    };
  }

  tieneConflictoConSeleccionados(grupo, gruposSeleccionados) {
    for (const g of gruposSeleccionados) {
      if (this.tieneConflictoHorario(grupo, g)) {
        return true;
      }
    }
    return false;
  }

  mutate(schedule) {
    if (Math.random() > this.mutationRate) {
      return schedule;
    }
    
    const mutated = { ...schedule };
    const gruposPorMateria = this.groupByMateria(this.data.grupos);
    
    // Seleccionar una materia aleatoria para mutar
    if (mutated.gruposSeleccionados.length > 0) {
      const randomIndex = Math.floor(Math.random() * mutated.gruposSeleccionados.length);
      const grupoAMutar = mutated.gruposSeleccionados[randomIndex];
      const materiaId = grupoAMutar.materia_id;
      
      // Obtener otros grupos disponibles para la misma materia
      const gruposMateria = gruposPorMateria[materiaId] || [];
      
      if (gruposMateria.length > 1) {
        // Filtrar grupos sin conflicto
        const otrosGrupos = gruposMateria.filter(g => 
          g.id !== grupoAMutar.id && 
          !this.tieneConflictoConSeleccionados(g, mutated.gruposSeleccionados.filter(gs => gs.id !== grupoAMutar.id))
        );
        
        if (otrosGrupos.length > 0) {
          const newGrupoIndex = Math.floor(Math.random() * otrosGrupos.length);
          const nuevoGrupo = otrosGrupos[newGrupoIndex];
          
          // Reemplazar el grupo
          mutated.gruposSeleccionados[randomIndex] = nuevoGrupo;
          
          // Recalcular horario
          mutated.horario = this.buildScheduleMatrix(mutated.gruposSeleccionados);
        }
      }
    }
    
    return mutated;
  }

  // Helper methods
  groupByMateria(grupos) {
    return grupos.reduce((acc, grupo) => {
      if (!acc[grupo.materia_id]) {
        acc[grupo.materia_id] = [];
      }
      acc[grupo.materia_id].push(grupo);
      return acc;
    }, {});
  }

  groupByDia(schedule) {
    const dias = {};
    
    for (const grupo of schedule.gruposSeleccionados) {
      for (const hd of grupo.horario_detalle) {
        const dia = hd.dia;
        if (!dias[dia]) dias[dia] = [];
        
        dias[dia].push({
          hora_inicio: new Date(hd.hora_inicio).getTime(),
          hora_fin: new Date(hd.hora_fin).getTime(),
          materia: grupo.materia?.nombre
        });
      }
    }
    
    return dias;
  }

  buildScheduleMatrix(gruposSeleccionados) {
    const matriz = {};
    
    // Inicializar matriz con todos los bloques
    for (const bloque of this.data.bloques) {
      if (!matriz[bloque.dia]) matriz[bloque.dia] = {};
      matriz[bloque.dia][bloque.id] = [];
    }
    
    // Llenar matriz
    for (const grupo of gruposSeleccionados) {
      for (const hd of grupo.horario_detalle) {
        const bloqueId = hd.bloque_id;
        const dia = hd.dia;
        
        if (matriz[dia] && matriz[dia][bloqueId]) {
          matriz[dia][bloqueId].push(grupo);
        }
      }
    }
    
    return matriz;
  }

  createEmptySchedule() {
    return {
      gruposSeleccionados: [],
      materiasCubiertas: 0,
      horario: {},
      score: 0
    };
  }
}

export { GeneticAlgorithm };