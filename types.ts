
export enum ViewMode {
  DASHBOARD = 'dashboard',
  FORECAST = 'forecast',
  CAMERA = 'camera',
  GENERAL_INFO = 'general_info',
  TECHNICAL_SPECS = 'technical_specs',
  IMAGES = 'images',
  RECORDS = 'records',
  OPERATION = 'operation',
  DOCUMENTS = 'documents',
  MANUAL_ENTRY = 'manual_entry',
  FLOOD_FORECAST = 'flood_forecast',
  MAP = 'map',
  WATER_LEVEL = 'water_level',
  DEMO_CHARTS = 'demo_charts',
  USER_PROFILE = 'user_profile',
  SYSTEM_SETTINGS = 'system_settings',
  USER_MANAGEMENT = 'user_management',
  ALERTS = 'alerts',
  SENSORS = 'sensors'
}

export interface WaterLevelRecord {
  id: string;
  time: string; // ISO String
  level: number;
}

export interface RainfallData {
  current: number;
  day1: number;
  day3: number;
}

export interface WeatherStation {
  id: string;
  name: string;
  data: RainfallData;
}

export interface DownstreamStation {
  id: string;
  name: string;
  level: number;
  flow: number;
}

export interface ObservationData {
  waterLevel: number;
  capacity: number;
  inflow: number;
  outflow: number;
  downstream: DownstreamStation[];
  rainfall: WeatherStation[];
  lastUpdated: string;
}

export interface RegulationPlanItem {
  time: string;
  flow: number;
}

export interface ForecastData {
  rainfall: WeatherStation[];
  results72h: {
    maxLevel: number;
    maxCapacity: number;
    maxInflow: number;
  };
  downstreamMax: {
    taTrach: number;
    kimLong: number;
  };
  regulationPlan: RegulationPlanItem[];
}

export interface SpecItem {
  id: string;
  name: string;
  value: string;
  unit?: string;
}

export interface SpecGroup {
  id: string;
  title: string;
  items: SpecItem[];
  subGroups?: SpecGroup[]; // For Aux Dams 1, 2, 3, 4 etc.
}

export interface OperationTableRow {
  id: string;
  col1: string; // Time/Date From
  col2: string; // Value/Date To
  col3?: string; // Value (if col2 is Date To)
}

export interface OperationTable {
  id: string;
  name: string;
  headers: string[];
  data: OperationTableRow[];
}

export interface ImageItem {
  id: string;
  url: string;
  title: string;
}

export interface ImageGroup {
  id: string;
  title: string;
  images: ImageItem[];
}

export interface GeneralInfo {
  projectLevel: string;
  floodFreqDesign: string;
  floodFreqCheck: string;
  waterSupplyIrrigationFreq: string;
  waterSupplyDomesticFreq: string;
  waterSupplyIndustrialFreq: string;
  waterSupplyEnvFreq: string;
  basin: string;
  location: string;
  longitude: string;
  latitude: string;
  manager: string;
  mission: string;
  constructionTime: string;
}

export interface CameraInfo {
  id: string;
  name: string;
  url: string;
  status: 'online' | 'offline';
}

// --- New Simulation Types ---

export interface SimulationStep {
  hour: number;
  rainfall: number; // mm
  inflow: number; // m3/s
  outflow: number; // m3/s
  waterLevel: number; // m
}

export interface FloodScenario {
  id: string;
  name: string;
  description: string;
  createdDate: string;
  lastRun?: string;
  
  // Inputs
  inputs: {
    rainfallTotal: number; // mm
    rainDuration: number; // hours
    initialWaterLevel: number; // m
    soilMoisture: 'dry' | 'normal' | 'wet'; // affects runoff coefficient
    baseInflow: number; // m3/s
  };

  // Outputs (Optional, only if run)
  results?: {
    maxInflow: number;
    maxLevel: number;
    peakTime: number; // hour
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    timeSeries: SimulationStep[];
  };
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'warning' | 'alert';
}

// New Alert Log Interface
export interface AlertLog {
  id: string;
  time: string; // Display time string
  timestamp: string; // ISO for sorting
  sensor: string;
  type: string; // "Nguy hiểm", "Mất kết nối", "Hỏng" (display text)
  station: string;
  severity: 'critical' | 'disconnected' | 'faulty';
  message: string;
  status: 'new' | 'acknowledged' | 'resolved';
}

// New Sensor Item Interface
export interface SensorItem {
  id: string;
  code: string; // e.g., P2-3
  name: string;
  type: string; // Do ap luc tham, Do bien dang...
  station: string;
  unit: string;
  limitInfo: string; // e.g., ">= 1314: Nguy hiem"
  status: 'online' | 'offline' | 'warning';
  lastValue?: number; // Added for Modern UI
  lastUpdated?: string; // Added for Modern UI
}

export interface UserProfile {
  id: string;
  username: string; // Login ID
  password?: string; // Stored (mock only, plain text for this demo)
  name: string;
  role: 'admin' | 'user';
  email: string;
  avatar: string; // Initials
  status: 'active' | 'inactive';
  lastActive: string;
  phone?: string;
  department?: string;
  address?: string;
}

export interface SystemSettings {
  appName: string;
  appSubtitle: string; // Subtitle
  appTitle: string; // Full Title (Browser Tab)
  appFooter: string; // Footer/Copyright text
  maintenanceMode: boolean;
  language: 'vi' | 'en';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY';
  
  // Feature Toggles
  features: {
    enableAIAssistant: boolean;
    aiWelcomeMessage: string; // New: Custom welcome message
    enableDemoCharts: boolean;
    enableFloodSimulation: boolean;
  };

  // Notifications
  notifications: {
    emailAlerts: boolean;
    smsAlerts: boolean;
    pushNotif: boolean;
    alertThresholdLevel: number;
  };

  // Data
  backupFrequency: 'daily' | 'weekly' | 'monthly' | 'manual';
}

export interface DocumentItem {
  id: string;
  number: string;
  date: string;
  title: string;
  signer: string;
  type: string;
  category: 'legal' | 'internal' | 'emergency' | 'reports';
}

// New Interface for Sidebar Configuration
export interface SidebarConfigItem {
  path: string;
  isVisible: boolean;
  order: number;
  customLabel?: string; // Added custom label for renaming
}
