import type { User, Producto, Empresa, UserRole } from "./user";

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  roleDistribution: RoleDistribution[];
  connectionStats: ConnectionStats[];
  topUsers: User[];
  recentConnections: RecentConnection[];
  userGrowth: GrowthData[];
  activityHeatmap: ActivityData[];
}

export interface ProductAnalytics {
  totalProducts: number;
  topProducts: ProductPerformance[];
  categoryDistribution: CategoryData[];
  salesTrends: SalesData[];
  inventoryAlerts: InventoryAlert[];
  productGrowth: GrowthData[];
}

export interface CompanyAnalytics {
  totalCompanies: number;
  topCompanies: CompanyPerformance[];
  companyGrowth: GrowthData[];
  vendedorDistribution: VendedorData[];
}

export interface RoleDistribution {
  role: UserRole;
  count: number;
  percentage: number;
}

export interface ConnectionStats {
  date: string;
  connections: number;
  uniqueUsers: number;
}

export interface RecentConnection {
  user: User;
  timestamp: string;
  duration: number;
  device: string;
  location: string;
}

export interface GrowthData {
  date: string;
  value: number;
  change: number;
}

export interface ActivityData {
  hour: number;
  day: string;
  activity: number;
}

export interface ProductPerformance {
  product: Producto;
  sales: number;
  revenue: number;
  views: number;
  conversionRate: number;
}

export interface CategoryData {
  category: string;
  count: number;
  revenue: number;
}

export interface SalesData {
  date: string;
  sales: number;
  revenue: number;
}

export interface InventoryAlert {
  product: Producto;
  currentStock: number;
  alertLevel: "low" | "critical" | "out";
}

export interface CompanyPerformance {
  empresa: Empresa;
  totalRevenue: number;
  totalProducts: number;
  totalSales: number;
  averageRating: number;
}

export interface VendedorData {
  empresaId: string;
  empresaNombre: string;
  vendedorCount: number;
  activeVendedores: number;
}

export interface AnalyticsFilters {
  dateRange: {
    start: string;
    end: string;
  };
  roles: UserRole[];
  companies: string[];
  activityLevel: "all" | "active" | "inactive";
  productCategories: string[];
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  activeUsers: number;
  conversionRate: number;
  revenueGrowth: number;
  orderGrowth: number;
  userGrowth: number;
  conversionGrowth: number;
}
