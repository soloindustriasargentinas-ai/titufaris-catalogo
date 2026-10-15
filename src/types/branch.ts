export interface Branch {
  id: string;
  name: string;
  code: string; // e.g. "SUC-01", "SUC-02", "DEP-01"
  address: string;
  city?: string;
  phone?: string;
  isDefault: boolean;
  isActive: boolean;
  managerName?: string;
  createdAt: string;
}

export interface BranchStockTransfer {
  id: string;
  date: string;
  sourceBranchId: string;
  sourceBranchName: string;
  targetBranchId: string;
  targetBranchName: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  transferredBy: string;
  notes?: string;
}
