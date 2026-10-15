import { Branch, BranchStockTransfer, Product } from '../types';

const BRANCHES_STORAGE_KEY = 'titufaris_branches_v1';
const TRANSFERS_STORAGE_KEY = 'titufaris_branch_transfers_v1';

export const DEFAULT_BRANCHES: Branch[] = [
  {
    id: 'branch-central',
    name: 'Sucursal Central / Casa Matriz',
    code: 'SUC-01',
    address: 'Av. Corrientes 1250, CABA',
    city: 'Buenos Aires',
    phone: '+54 11 4321-8890',
    isDefault: true,
    isActive: true,
    managerName: 'Administración Central',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'branch-norte',
    name: 'Sucursal Norte',
    code: 'SUC-02',
    address: 'Av. Santa Fe 3420, Palermo',
    city: 'Buenos Aires',
    phone: '+54 11 4822-1100',
    isDefault: false,
    isActive: true,
    managerName: 'Coordinador Sucursal',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'branch-deposito',
    name: 'Depósito Central & Logística',
    code: 'DEP-01',
    address: 'Parque Industrial Nave 4, Don Torcuato',
    city: 'Buenos Aires',
    phone: '+54 11 5199-2300',
    isDefault: false,
    isActive: true,
    managerName: 'Jefe de Depósito',
    createdAt: new Date().toISOString(),
  },
];

function getTenantKey(key: string, tenantId?: string): string {
  if (!tenantId || tenantId === 'titufaris') return key;
  return `${key}_tenant_${tenantId}`;
}

export function loadBranches(tenantId?: string): Branch[] {
  try {
    const key = getTenantKey(BRANCHES_STORAGE_KEY, tenantId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      saveBranches(DEFAULT_BRANCHES, tenantId);
      return DEFAULT_BRANCHES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_BRANCHES;
  } catch {
    return DEFAULT_BRANCHES;
  }
}

export function saveBranches(branches: Branch[], tenantId?: string): void {
  try {
    const key = getTenantKey(BRANCHES_STORAGE_KEY, tenantId);
    localStorage.setItem(key, JSON.stringify(branches));
  } catch (err) {
    console.warn('Error saving branches to localStorage:', err);
  }
}

export function loadStockTransfers(tenantId?: string): BranchStockTransfer[] {
  try {
    const key = getTenantKey(TRANSFERS_STORAGE_KEY, tenantId);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStockTransfers(transfers: BranchStockTransfer[], tenantId?: string): void {
  try {
    const key = getTenantKey(TRANSFERS_STORAGE_KEY, tenantId);
    localStorage.setItem(key, JSON.stringify(transfers));
  } catch (err) {
    console.warn('Error saving stock transfers to localStorage:', err);
  }
}

/**
 * Ensures product has a populated branchStock object.
 * If undefined, distributes product.stock with majority in default branch and rest in warehouse.
 */
export function ensureProductBranchStock(product: Product, branches: Branch[]): Product {
  const currentBranchStock = { ...(product.branchStock || {}) };
  const defaultBranch = branches.find(b => b.isDefault) || branches[0];
  const secondBranch = branches.find(b => !b.isDefault) || branches[1];

  let hasAssigned = false;
  branches.forEach(b => {
    if (typeof currentBranchStock[b.id] === 'number') {
      hasAssigned = true;
    }
  });

  if (!hasAssigned) {
    const total = Math.max(0, product.stock || 0);
    if (defaultBranch && secondBranch) {
      const mainStock = Math.ceil(total * 0.7);
      const secondStock = total - mainStock;
      currentBranchStock[defaultBranch.id] = mainStock;
      currentBranchStock[secondBranch.id] = secondStock;
    } else if (defaultBranch) {
      currentBranchStock[defaultBranch.id] = total;
    }
  }

  // Ensure all active branches have at least a numeric value
  branches.forEach(b => {
    if (typeof currentBranchStock[b.id] !== 'number') {
      currentBranchStock[b.id] = 0;
    }
  });

  return {
    ...product,
    branchStock: currentBranchStock,
  };
}

/**
 * Transfers stock between branches for a given product.
 */
export function executeStockTransfer(
  product: Product,
  sourceBranch: Branch,
  targetBranch: Branch,
  quantity: number,
  transferredBy: string,
  notes?: string
): { updatedProduct: Product; transferRecord: BranchStockTransfer } {
  const currentBranchStock = { ...(product.branchStock || {}) };
  const sourceQty = currentBranchStock[sourceBranch.id] ?? 0;
  const targetQty = currentBranchStock[targetBranch.id] ?? 0;

  if (quantity > sourceQty) {
    throw new Error(`Stock insuficiente en ${sourceBranch.name}. Disponible: ${sourceQty}, Solicitado: ${quantity}`);
  }

  currentBranchStock[sourceBranch.id] = Math.max(0, sourceQty - quantity);
  currentBranchStock[targetBranch.id] = targetQty + quantity;

  // Total stock stays the same (internal relocation)
  const updatedProduct: Product = {
    ...product,
    branchStock: currentBranchStock,
  };

  const transferRecord: BranchStockTransfer = {
    id: 'trf-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    date: new Date().toISOString(),
    sourceBranchId: sourceBranch.id,
    sourceBranchName: sourceBranch.name,
    targetBranchId: targetBranch.id,
    targetBranchName: targetBranch.name,
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    quantity,
    transferredBy,
    notes,
  };

  return { updatedProduct, transferRecord };
}
