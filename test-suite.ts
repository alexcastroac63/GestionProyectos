/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';

// Import domain mappers and types
import {
  mapStoryStatusToWorkItemStatus,
  mapUserStoryToWorkItem,
  syncStoriesWithWorkItems
} from './src/features/backlog/domain/backlogToScrum.mapper';
import { UserStory } from './src/features/backlog/domain/backlog.types';
import { WorkItem } from './src/types';

// Let's mirror or load security functions from server code to test them
const PASSWORD_SALT = process.env.PASSWORD_SALT || "9de8a3b8c31e24ef";
const JWT_SECRET = process.env.JWT_SECRET || "a1b2c3d4e5f67890a1b2c3d4e5f67890";

function hashPassword(password: string): string {
  return crypto.createHmac('sha256', PASSWORD_SALT).update(password).digest('hex');
}

function signSession(payload: { email: string }, expiresInMs = 2 * 60 * 60 * 1000): string {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Date.now() + expiresInMs;
  const fullPayload = { ...payload, exp };

  const sHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const sPayload = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");

  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${sHeader}.${sPayload}`)
    .digest("base64url");

  return `${sHeader}.${sPayload}.${signature}`;
}

function verifySession(token: string): { email: string; exp: number } | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [sHeader, sPayload, signature] = parts;
  const calculatedSignature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${sHeader}.${sPayload}`)
    .digest("base64url");

  if (signature !== calculatedSignature) {
    return null; // Altered session signature
  }

  try {
    const payload = JSON.parse(Buffer.from(sPayload, "base64url").toString("utf-8"));
    if (Date.now() > payload.exp) {
      return null; // Expired session token
    }
    return payload;
  } catch {
    return null;
  }
}

// --- Test Framework Runner Mini-Implementation ---
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(` ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(` ❌ FAIL: ${message}`);
    failedTests++;
  }
}

console.log("==========================================");
console.log("⚙️  EJECUTANDO PRUEBAS DE ARQUITECTURA PMO ");
console.log("==========================================\n");

// --- Group 1: Security Testing ---
console.log("🔒 [GRUPO 1: SEGURIDAD Y TOKENIZACIÓN]");

const plainText = "Admin1234$";
const hash1 = hashPassword(plainText);
const hash2 = hashPassword(plainText);
const hashOther = hashPassword("Admin1234_other");

assert(hash1 === hash2, "Las contraseñas iguales producen el mismo hash SHA-256.");
assert(hash1 !== plainText, "La contraseña no se almacena en texto plano.");
assert(hash1 !== hashOther, "Contraseñas distintas producen hashes diferentes.");

// Session Signatures & Expiration Tests
const tokenValid = signSession({ email: "pmo@auditoria.com" });
const verified = verifySession(tokenValid);
assert(verified !== null && verified.email === "pmo@auditoria.com", "Se firman y verifican tokens de sesión correctos.");

const tokenExpired = signSession({ email: "pmo@auditoria.com" }, -1000); // 1 sec in past
const verifiedExpired = verifySession(tokenExpired);
assert(verifiedExpired === null, "Los tokens de sesión expirados son rechazados de forma proactiva.");

const brokenToken = tokenValid.substring(0, tokenValid.length - 1) + "X";
const verifiedBroken = verifySession(brokenToken);
assert(verifiedBroken === null, "Tokens de sesión con firma alterada son rechazados rotundamente.");

console.log("");

// --- Group 2: Backlog to Scrum Data Synchronization Maps ---
console.log("📋 [GRUPO 2: MAPEO DOMINIO Y REGLAS DE TRANSCIÓN SINCRÓNICA]");

const sampleStory: UserStory = {
  id: "story-101",
  project_id: "proy-7",
  code: "HU-001",
  title: "Permitir auditoría de transacciones financieras",
  role: "Auditor",
  want: "Visualizar el log de mutaciones",
  benefit: "Prevenir fraude impositivo",
  description: "Como auditor quiero...",
  type: "Funcional",
  priority: "Alta",
  status: "Ready",
  businessValue: 5,
  risk: 2,
  urgency: 4,
  moscow: "Must",
  backlogOrder: 1,
  storyPoints: 5,
  complexity: "Media",
  uncertainty: "Baja",
  company: "Lifecycle PM Corp",
  createdAt: "2026-06-22",
  dorChecklist: {},
  dodChecklist: {},
  acceptanceCriteria: [],
  dependencies: [],
  comments: [],
  attachments: [],
  history: []
};

// Test status translations
assert(mapStoryStatusToWorkItemStatus("Borrador") === "BACKLOG", "Borrador mapea a BACKLOG.");
assert(mapStoryStatusToWorkItemStatus("En refinamiento") === "BACKLOG", "En refinamiento mapea a BACKLOG.");
assert(mapStoryStatusToWorkItemStatus("Ready") === "POR_HACER", "Ready mapea a POR_HACER.");
assert(mapStoryStatusToWorkItemStatus("En desarrollo") === "EN_CURSO", "En desarrollo mapea a EN_CURSO.");
assert(mapStoryStatusToWorkItemStatus("En pruebas internas") === "QA", "En pruebas internas mapea a QA.");
assert(mapStoryStatusToWorkItemStatus("Aprobada") === "FINALIZADO", "Aprobada mapea a FINALIZADO.");

// Test UserStory conversion to WorkItem
const mappedWorkItem = mapUserStoryToWorkItem(sampleStory);
assert(mappedWorkItem.id === sampleStory.id, "ID se transfiere de forma consistente.");
assert(mappedWorkItem.key === sampleStory.code, "Código de HU mapea a key.");
assert(mappedWorkItem.status === "POR_HACER", "Estatus del backlog mapea correctamente en ausencia de overrides.");
assert(mappedWorkItem.priority === "HIGH", "Prioridad 'Alta' mapea a de tipo HIGH.");
assert(mappedWorkItem.story_points === 5, "Story Points coherentes.");

// Sync test preserving existing Scrum Board tasks
const existingItemsOnBoard: WorkItem[] = [
  {
    id: "item-task-99",
    project_id: "proy-7",
    key: "TASK-001",
    title: "Crear migración BD del log de transacciones",
    description: "",
    type: "TAREA",
    status: "EN_CURSO",
    priority: "MEDIUM",
    created_at: "2026-06-21"
  },
  {
    id: "story-101", // Represents story HU-001 already pulled into board
    project_id: "proy-7",
    key: "HU-001",
    title: "Permitir auditoría de transacciones financieras",
    description: "",
    type: "HISTORIA_USUARIO",
    status: "EN_CURSO", // State override: Developer already started work on the Scrum Board
    priority: "MEDIUM",
    created_at: "2026-06-22"
  }
];

const finalBoardItems = syncStoriesWithWorkItems([sampleStory], existingItemsOnBoard);

// Assertions on final synchronized board state
const taskStillOnline = finalBoardItems.find(item => item.id === "item-task-99");
const huOnBoard = finalBoardItems.find(item => item.id === "story-101");

assert(taskStillOnline !== undefined, "Las tareas manuales creadas en el Scrum Board no se eliminan al sincronizar.");
assert(huOnBoard !== undefined, "La Historia de Usuario se encuentra presente en el Scrum Board unificado.");
assert(huOnBoard?.status === "EN_CURSO", "Se respeta el Estatus override ('EN_CURSO') configurado directamente en el Scrum Board.");

console.log("\n==========================================");
console.log(`🏁 RESUMEN GENERAL: ${passedTests} APROBADAS / ${failedTests} FALLIDAS`);
console.log("==========================================");

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
