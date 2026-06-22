/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IRepository } from '../../../domain/repositories/repository.interface';

/**
 * Clase base reusable para repositorios respaldados por localStorage.
 */
export class LocalRepository<T extends { id: string }> implements IRepository<T> {
  protected storageKey: string;

  constructor(storageKey: string) {
    this.storageKey = storageKey;
  }

  protected getStoredItems(): T[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return [];
      return JSON.parse(data) as T[];
    } catch (e) {
      console.error(`Error de parsing en localStorage para la clave "${this.storageKey}":`, e);
      return [];
    }
  }

  protected setStoredItems(items: T[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(items));
    } catch (e) {
      console.error(`Error de escritura en localStorage para la clave "${this.storageKey}":`, e);
    }
  }

  async getAll(): Promise<T[]> {
    return this.getStoredItems();
  }

  async getById(id: string): Promise<T | null> {
    const items = this.getStoredItems();
    return items.find(item => item.id === id) || null;
  }

  async create(item: T): Promise<T> {
    const items = this.getStoredItems();
    // Validar duplicado de ID si es requerido
    const exists = items.some(x => x.id === item.id);
    if (exists) {
      throw new Error(`Entidad con ID "${item.id}" ya existe en "${this.storageKey}".`);
    }
    items.push(item);
    this.setStoredItems(items);
    return item;
  }

  async update(id: string, item: Partial<T>): Promise<T> {
    const items = this.getStoredItems();
    const index = items.findIndex(x => x.id === id);
    if (index === -1) {
      throw new Error(`Entidad con ID "${id}" no encontrada en "${this.storageKey}".`);
    }
    const updated = { ...items[index], ...item } as T;
    items[index] = updated;
    this.setStoredItems(items);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const items = this.getStoredItems();
    const filtered = items.filter(x => x.id !== id);
    if (filtered.length === items.length) {
      return false;
    }
    this.setStoredItems(filtered);
    return true;
  }

  async saveAll(items: T[]): Promise<void> {
    this.setStoredItems(items);
  }
}
