/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Interfaz genérica para la capa de Persistencia (Patrón Repository).
 */
export interface IRepository<T> {
  /**
   * Obtiene todos los elementos persistidos de la entidad.
   */
  getAll(): Promise<T[]>;

  /**
   * Obtiene un elemento específico por su Identificador único.
   * @param id Identificador único de la entidad
   */
  getById(id: string): Promise<T | null>;

  /**
   * Persiste un nuevo elemento.
   * @param item Entidad a crear
   */
  create(item: T): Promise<T>;

  /**
   * Actualiza parcialmente una entidad existente.
   * @param id Identificador de la entidad
   * @param item Datos parciales a actualizar
   */
  update(id: string, item: Partial<T>): Promise<T>;

  /**
   * Elimina un elemento por su Identificador único.
   * @param id Identificador de la entidad a eliminar
   */
  delete(id: string): Promise<boolean>;

  /**
   * Guarda un lote completo de elementos (útil para sincronizaciones masivas).
   * @param items Lista completa de entidades
   */
  saveAll(items: T[]): Promise<void>;
}
