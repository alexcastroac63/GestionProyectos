/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PortainerContainer } from '../features/devops/DevOpsPipeline';

/**
 * Servicio de Dominio para cálculos, simulaciones de telemetría y métricas de DevOps
 * para la plataforma de PMO de Grupo Campestre.
 */

/**
 * Calcula el avance porcentual del listado de pasos de instalación / ejecución de DevOps.
 * Formula: (Pasos Completados / Total Pasos) * 100
 */
export function calculateDevOpsProgress(completedCount: number, totalCount: number): number {
  if (totalCount <= 0) return 100;
  return Math.round((completedCount / totalCount) * 100);
}

/**
 * Genera un ETag robusto simulado a partir de la llave o nombre de un objeto en el almacenamiento local seguro.
 * Emplea un algoritmo de hashing bitwise determinista para evitar colisiones en la simulación.
 */
export function getSimulatedETag(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return `"${Math.abs(hash).toString(16)}09825b4bc7038e1e"`;
}

/**
 * Devuelve un valor base de uso de CPU aleatorio simulado (para inicialización o picos).
 */
export function getRandomCpuUsage(): number {
  return Number((Math.random() * 2 + 0.5).toFixed(1));
}

/**
 * Simula la fluctuación incremental de CPU para un contenedor en ejecución.
 * Asegura que se mantenga en rangos seguros superiores a 0.1%.
 */
export function getNextCpuUsage(currentCpu: number): number {
  const diff = (Math.random() - 0.5) * 0.4;
  return Math.max(0.1, Number((currentCpu + diff).toFixed(1)));
}

/**
 * Simula la fluctuación de consumo en megabytes (MB) de un contenedor en ejecución.
 * Recibe el string de memoria original tipo "48.2 MB / 8.0 GB" y retorna la nueva cadena fluctuada.
 */
export function getNextMemoryUsage(currentMemString: string): string {
  const memParts = currentMemString.split(' ');
  if (memParts.length > 0) {
    const numericMem = parseFloat(memParts[0]);
    if (!isNaN(numericMem)) {
      const nextNumericMem = Math.max(5, Number((numericMem + (Math.random() - 0.5) * 0.8).toFixed(1)));
      // Restar o mantener la sección de límite de gigabytes total
      const totalPart = currentMemString.substring(currentMemString.indexOf('/'));
      return `${nextNumericMem} MB ${totalPart}`;
    }
  }
  return currentMemString;
}

/**
 * Interfaz para almacenar el resultado consolidado del estado de contenedores en Portainer.
 */
export interface ContainersMetrics {
  total: number;
  running: number;
  stopped: number;
  paused: number;
  aggregateCpuLoad: number;
  totalMemoryUsedMB: number;
}

/**
 * Consolida todas las métricas operativas de los servicios de Docker Portainer en un solo snapshot.
 */
export function calculateTotalContainersMetrics(containers: PortainerContainer[]): ContainersMetrics {
  let running = 0;
  let stopped = 0;
  let paused = 0;
  let aggregateCpuLoad = 0;
  let totalMemoryUsedMB = 0;

  containers.forEach(c => {
    if (c.status === 'running') {
      running++;
      aggregateCpuLoad += c.cpu;
      const memParts = c.memory.split(' ');
      if (memParts.length > 0) {
        const numericMem = parseFloat(memParts[0]);
        if (!isNaN(numericMem)) {
          totalMemoryUsedMB += numericMem;
        }
      }
    } else if (c.status === 'stopped') {
      stopped++;
    } else if (c.status === 'paused') {
      paused++;
    }
  });

  return {
    total: containers.length,
    running,
    stopped,
    paused,
    aggregateCpuLoad: Number(aggregateCpuLoad.toFixed(1)),
    totalMemoryUsedMB: Number(totalMemoryUsedMB.toFixed(1))
  };
}
