
import { 
  ObservationData, 
  SpecGroup, 
  OperationTable, 
  ImageGroup, 
  GeneralInfo, 
  CameraInfo, 
  FloodScenario, 
  AppNotification, 
  UserProfile, 
  ForecastData, 
  WaterLevelRecord, 
  SystemSettings,
  DocumentItem,
  AlertLog
} from '../types';

// CHANGED: Version bump to v4
const KEYS = {
  OBSERVATION: 'app_observation_v3',
  FORECAST: 'app_forecast_v3',
  SPECS: 'app_specs_v3',
  OPERATION_TABLES: 'app_op_tables_v3',
  IMAGES: 'app_images_v3',
  GENERAL_INFO: 'app_general_info_v3',
  CAMERAS: 'app_cameras_v3',
  SCENARIOS: 'app_scenarios_v3',
  NOTIFICATIONS: 'app_notifications_v3',
  CURRENT_USER: 'app_current_user_v3',
  USERS_LIST: 'app_users_list_v3',
  WATER_LEVEL_RECORDS: 'app_water_level_records_v3',
  SETTINGS: 'app_settings_v3',
  DOCUMENTS: 'app_documents_v3',
  ALERTS: 'app_alerts_v4' // New key
};

// ... (Existing Default Data: defaultObservation, defaultForecast, defaultSpecs, etc.) ...
// Preserve existing mock data functions/constants
const defaultObservation: ObservationData = {
  waterLevel: 45.2,
  capacity: 340.5,
  inflow: 125.4,
  outflow: 80.0,
  lastUpdated: new Date().toISOString(),
  downstream: [
    { id: 'd1', name: 'Trạm hạ lưu hồ Tả Trạch', level: 3.4, flow: 120 },
    { id: 'd2', name: 'Trạm Kim Long', level: 1.2, flow: 450 }
  ],
  rainfall: [
    { id: 'r1', name: 'Lượng mưa trung bình', data: { current: 12.5, day1: 45.2, day3: 120.5 } },
    { id: 'r2', name: 'Hương Sơn (Nam Đông)', data: { current: 15.0, day1: 52.1, day3: 135.0 } },
    { id: 'r3', name: 'Thượng Quảng (Nam Đông)', data: { current: 10.2, day1: 48.5, day3: 110.2 } },
    { id: 'r4', name: 'Trạm mưa đầu mối Tả Trạch', data: { current: 5.5, day1: 32.0, day3: 85.5 } },
    { id: 'r5', name: 'TT Khe Tre (Nam Đông)', data: { current: 11.0, day1: 41.2, day3: 115.8 } },
  ]
};

const defaultForecast: ForecastData = {
  rainfall: [
     { id: 'f1', name: 'Lượng mưa trung bình', data: { current: 5.0, day1: 20.0, day3: 60.0 } },
     { id: 'f2', name: 'Hương Sơn (Nam Đông)', data: { current: 6.0, day1: 25.0, day3: 70.0 } },
     { id: 'f3', name: 'Thượng Quảng (Nam Đông)', data: { current: 4.0, day1: 18.0, day3: 55.0 } },
     { id: 'f4', name: 'Trạm mưa đầu mối Tả Trạch', data: { current: 2.0, day1: 10.0, day3: 30.0 } },
     { id: 'f5', name: 'TT Khe Tre (Nam Đông)', data: { current: 5.5, day1: 22.0, day3: 65.0 } },
  ],
  results72h: {
    maxLevel: 46.5,
    maxCapacity: 480,
    maxInflow: 1250
  },
  downstreamMax: {
    taTrach: 4.5,
    kimLong: 2.1
  },
  regulationPlan: [
    { time: '11:00 05/01', flow: 120 },
    { time: '17:00 05/01', flow: 150 },
    { time: '11:00 06/01', flow: 200 },
    { time: '11:00 07/01', flow: 180 },
    { time: '11:00 08/01', flow: 120 },
  ]
};

const defaultSpecs: SpecGroup[] = [
  {
    id: 'hydrology',
    title: 'Đặc trưng thủy văn',
    items: [
      { id: 'h1', name: 'Diện tích lưu vực', value: '717', unit: 'km²' },
      { id: 'h2', name: 'Lưu lượng bình quân năm Qo', value: '38.5', unit: 'm³/s' },
      { id: 'h3', name: 'Tần suất lũ thiết kế', value: '1.0', unit: '%' },
      { id: 'h4', name: 'Lưu lượng đỉnh lũ thiết kế', value: '3920', unit: 'm³/s' },
      { id: 'h5', name: 'Lưu lượng đỉnh lũ kiểm tra', value: '5120', unit: 'm³/s' },
      { id: 'h6', name: 'Tổng lượng lũ thiết kế', value: '650', unit: 'triệu m³' },
    ]
  },
  {
    id: 'reservoir',
    title: 'Hồ chứa',
    items: [
      { id: 'r1', name: 'Mực nước dâng bình thường', value: '45.0', unit: 'm' },
      { id: 'r2', name: 'Mực nước chết', value: '23.0', unit: 'm' },
      { id: 'r3', name: 'Mực nước lũ thiết kế', value: '50.0', unit: 'm' },
      { id: 'r4', name: 'Dung tích toàn bộ', value: '646', unit: 'triệu m³' },
      { id: 'r5', name: 'Dung tích hữu ích Vhi', value: '509.8', unit: 'triệu m³' },
      { id: 'r6', name: 'Diện tích tưới', value: '12000', unit: 'ha' },
    ]
  },
  {
    id: 'maindam',
    title: 'Đập chính Tả Trạch',
    items: [
      { id: 'd1', name: 'Hình thức', value: 'Đập đất', unit: '' },
      { id: 'd2', name: 'Cao trình đỉnh đập', value: '55.0', unit: 'm' },
      { id: 'd3', name: 'Chiều dài đỉnh đập', value: '1125', unit: 'm' },
      { id: 'd4', name: 'Chiều cao lớn nhất Hmax', value: '60', unit: 'm' },
    ]
  },
  {
    id: 'auxdams',
    title: 'Các đập phụ',
    items: [],
    subGroups: [
      {
        id: 'aux1',
        title: 'Đập phụ số 1',
        items: [{ id: 'a1_1', name: 'Cao trình đỉnh', value: '55.0', unit: 'm' }]
      },
      {
        id: 'aux2',
        title: 'Đập phụ số 2',
        items: [{ id: 'a2_1', name: 'Cao trình đỉnh', value: '55.0', unit: 'm' }]
      },
      {
        id: 'aux3',
        title: 'Đập phụ số 3',
        items: [{ id: 'a3_1', name: 'Cao trình đỉnh', value: '55.0', unit: 'm' }]
      },
      {
        id: 'aux4',
        title: 'Đập phụ số 4',
        items: [{ id: 'a4_1', name: 'Cao trình đỉnh', value: '55.0', unit: 'm' }]
      }
    ]
  },
  {
    id: 'spillway',
    title: 'Tràn xả lũ',
    items: [],
    subGroups: [
      {
        id: 'deep',
        title: 'Tràn xả sâu',
        items: [
           { id: 's1_1', name: 'Số khoang', value: '2', unit: '' },
           { id: 's1_2', name: 'Kích thước (BxH)', value: '5x6', unit: 'm' }
        ]
      },
      {
        id: 'gated',
        title: 'Tràn có cửa van',
        items: [
           { id: 's2_1', name: 'Số khoang', value: '4', unit: '' },
           { id: 's2_2', name: 'Lưu lượng xả Qmax', value: '3500', unit: 'm³/s' }
        ]
      }
    ]
  },
  {
    id: 'intakes',
    title: 'Công trình lấy nước',
    items: [],
    subGroups: [
      {
        id: 'culvert',
        title: 'Cống lấy nước',
        items: [{ id: 'c1', name: 'Lưu lượng TK', value: '15', unit: 'm³/s' }]
      },
      {
        id: 'tunnel',
        title: 'Tuynen',
        items: [{ id: 't1', name: 'Lưu lượng TK', value: '30', unit: 'm³/s' }]
      }
    ]
  },
  {
    id: 'hydro',
    title: 'Nhà máy thủy điện',
    items: [
      { id: 'hp1', name: 'Công suất lắp máy', value: '21', unit: 'MW' },
      { id: 'hp2', name: 'Số tổ máy', value: '2', unit: '' },
    ]
  }
];

const defaultOpTables: OperationTable[] = [
  {
    id: 'sabotage',
    name: 'Đường phòng phá hoại',
    headers: ['Thời gian', 'Mực nước cao nhất (m)'],
    data: [
      { id: '1', col1: '01/09 - 30/09', col2: '48.0' },
      { id: '2', col1: '01/10 - 30/11', col2: '46.0' },
    ]
  },
  {
    id: 'supply_limit',
    name: 'Đường hạn chế cấp nước',
    headers: ['Từ ngày', 'Đến ngày', 'Mực nước thấp nhất (m)'],
    data: [
      { id: '1', col1: '01/01', col2: '15/04', col3: '25.0' },
      { id: '2', col1: '16/04', col2: '31/08', col3: '23.0' },
    ]
  },
  {
    id: 'pre_flood',
    name: 'Mực nước cao nhất trước lũ',
    headers: ['Từ ngày', 'Đến ngày', 'Mực nước cao nhất (m)'],
    data: [
       { id: '1', col1: '01/09', col2: '15/10', col3: '35.0' },
    ]
  },
  {
    id: 'welcome_flood',
    name: 'Mực nước đón lũ',
    headers: ['Từ ngày', 'Đến ngày', 'Mực nước cao nhất (m)'],
    data: [
       { id: '1', col1: '15/10', col2: '15/11', col3: '40.0' },
    ]
  },
  {
    id: 'accumulation',
    name: 'Thời gian tích nước',
    headers: ['Từ ngày', 'Đến ngày', 'Giá trị (m)'],
    data: []
  },
  {
    id: 'min_discharge',
    name: 'Lưu lượng xả tối thiểu',
    headers: ['Từ ngày', 'Đến ngày', 'Giá trị (m³/s)'],
    data: [
       { id: '1', col1: 'Quanh năm', col2: 'Quanh năm', col3: '5.0' },
    ]
  }
];

const defaultImages: ImageGroup[] = [
  { 
    id: 'g1', 
    title: 'Hồ chứa', 
    images: Array(6).fill(0).map((_, i) => ({ id: `i${i}`, title: `Hồ chứa ${i+1}`, url: `https://picsum.photos/400/300?random=${i}` }))
  },
  { 
    id: 'g2', 
    title: 'Tràn xả lũ', 
    images: Array(4).fill(0).map((_, i) => ({ id: `t${i}`, title: `Tràn ${i+1}`, url: `https://picsum.photos/400/300?random=${20+i}` }))
  },
  { 
    id: 'g3', 
    title: 'Đập chính', 
    images: Array(5).fill(0).map((_, i) => ({ id: `d${i}`, title: `Đập ${i+1}`, url: `https://picsum.photos/400/300?random=${40+i}` }))
  },
];

const defaultGeneral: GeneralInfo = {
  projectLevel: "I",
  floodFreqDesign: "1%",
  floodFreqCheck: "0.2%",
  waterSupplyIrrigationFreq: "85%",
  waterSupplyDomesticFreq: "95%",
  waterSupplyIndustrialFreq: "90%",
  waterSupplyEnvFreq: "90%",
  basin: "Sông Hương",
  location: "Xã Dương Hòa, Thị xã Hương Thủy, Tỉnh Thừa Thiên Huế",
  longitude: "107°35' E",
  latitude: "16°20' N",
  manager: "Công ty TNHH MTV Khai thác công trình thủy lợi Tả Trạch",
  mission: "Cắt giảm lũ cho hạ du, cấp nước sinh hoạt và công nghiệp, phát điện...",
  constructionTime: "2005 - 2013"
};

const defaultCameras: CameraInfo[] = [
  { id: 'c1', name: 'Camera Đập Chính', url: 'https://www.youtube.com/embed/qRTVg8HHzUo?autoplay=1&mute=1', status: 'online' },
  { id: 'c2', name: 'Camera Tràn Xả Lũ', url: 'https://www.youtube.com/embed/S2H378d3c50?autoplay=1&mute=1', status: 'online' },
  { id: 'c3', name: 'Camera Thượng Lưu', url: 'https://www.youtube.com/embed/N9ppshL89dA?autoplay=1&mute=1', status: 'online' },
];

const defaultNotifications: AppNotification[] = [
  { id: 'n1', title: 'Cảnh báo lũ', message: 'Mực nước đang tiến sát mức báo động I. Cần theo dõi sát sao.', time: '10 phút trước', read: false, type: 'alert' },
  { id: 'n2', title: 'Mất tín hiệu cảm biến', message: 'Cảm biến áp lực thấm tại vị trí P12 bị mất kết nối. Vui lòng kiểm tra.', time: '1 giờ trước', read: false, type: 'warning' },
  { id: 'n3', title: 'Báo cáo định kỳ', message: 'Báo cáo thủy văn tháng 1/2026 đã sẵn sàng để tải về.', time: '3 giờ trước', read: false, type: 'info' },
  { id: 'n4', title: 'Đăng nhập lạ', message: 'Phát hiện đăng nhập từ IP lạ (113.161.x.x) vào lúc 08:30 sáng nay.', time: '5 giờ trước', read: true, type: 'warning' },
  { id: 'n5', title: 'Kế hoạch bảo trì', message: 'Hệ thống sẽ bảo trì định kỳ vào 00:00 ngày 25/01/2026.', time: '1 ngày trước', read: true, type: 'info' },
  { id: 'n6', title: 'Dự báo mưa lớn', message: 'Đài KTTV cảnh báo mưa lớn diện rộng trong 24h tới tại lưu vực sông Hương.', time: '1 ngày trước', read: true, type: 'alert' },
];

const defaultDocuments: DocumentItem[] = [
  { id: '1', number: '114/2018/NĐ-CP', date: '04/09/2018', title: 'Nghị định về quản lý an toàn đập, hồ chứa nước', signer: 'Chính phủ', type: 'Nghị định', category: 'legal' },
  { id: '2', number: '03/2022/TT-BNNPTNT', date: '15/04/2022', title: 'Quy định kỹ thuật về vận hành hồ chứa', signer: 'Bộ NN&PTNT', type: 'Thông tư', category: 'legal' },
  { id: '3', number: '15/2023/QĐ-UBND', date: '20/10/2023', title: 'Quyết định phê duyệt quy trình vận hành liên hồ chứa', signer: 'UBND Tỉnh', type: 'Quyết định', category: 'legal' },
  { id: '4', number: 'NB-01/2024', date: '01/01/2024', title: 'Quy trình kiểm tra đập hàng ngày', signer: 'Giám đốc', type: 'Nội bộ', category: 'internal' },
  { id: '5', number: 'NB-05/2023', date: '15/12/2023', title: 'Quy định về an toàn lao động tại nhà máy', signer: 'Giám đốc', type: 'Nội bộ', category: 'internal' },
  { id: '6', number: 'PA-PCTT-2024', date: '01/05/2024', title: 'Phương án ứng phó thiên tai năm 2024', signer: 'BCH PCTT Tỉnh', type: 'Phương án', category: 'emergency' },
  { id: '7', number: 'PA-XALU-24', date: '05/09/2024', title: 'Kịch bản xả lũ khẩn cấp', signer: 'Công ty', type: 'Phương án', category: 'emergency' },
  { id: '8', number: 'BC-Q1-2024', date: '30/03/2024', title: 'Báo cáo tình hình thủy văn Quý I/2024', signer: 'Phòng Kỹ thuật', type: 'Báo cáo', category: 'reports' },
  { id: '9', number: 'BC-NAM-2023', date: '31/12/2023', title: 'Báo cáo tổng kết công tác vận hành năm 2023', signer: 'Giám đốc', type: 'Báo cáo', category: 'reports' },
];

const defaultAdminUser: UserProfile = {
  id: 'u1',
  username: 'admin',
  password: '123',
  name: 'Quản trị viên',
  role: 'admin',
  email: 'admin@tatrach.vn',
  avatar: 'AD',
  status: 'active',
  lastActive: new Date().toISOString(),
  phone: '0912.345.678',
  department: 'Ban Giám đốc',
  address: 'Hương Thủy, Thừa Thiên Huế'
};

const generateMockUsers = (): UserProfile[] => {
  const users: UserProfile[] = [defaultAdminUser];
  const depts = ['Phòng Kỹ thuật', 'Phòng Hành chính', 'Tổ Bảo vệ', 'Tổ Vận hành', 'Ban Giám đốc'];
  const firstNames = ['Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Huynh', 'Phan', 'Vu', 'Vo', 'Dang'];
  const lastNames = ['Van A', 'Thi B', 'Minh C', 'Quang D', 'Thanh E', 'Duc F', 'Ngoc G', 'Tuan H', 'Huy I', 'Lan K'];

  for (let i = 2; i <= 20; i++) {
    const role = i <= 3 ? 'admin' : 'user';
    const fname = firstNames[i % firstNames.length];
    const lname = lastNames[i % lastNames.length];
    
    users.push({
      id: `u${i}`,
      username: `user${i}`,
      password: '123',
      name: `${fname} ${lname}`,
      role: role as 'admin' | 'user',
      email: `user${i}@tatrach.vn`,
      avatar: `${fname[0]}${lname[lname.length-1]}`,
      status: Math.random() > 0.8 ? 'inactive' : 'active',
      lastActive: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString(),
      phone: `09${Math.floor(Math.random() * 90000000)}`,
      department: depts[i % depts.length],
      address: 'Thừa Thiên Huế'
    });
  }
  return users;
};

const defaultScenarios: FloodScenario[] = [
  {
    id: 'sc-001',
    name: 'Lũ thiết kế tần suất 1%',
    description: 'Mô phỏng kịch bản mưa lớn diện rộng, đất bão hòa nước.',
    createdDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    inputs: {
      rainfallTotal: 450,
      rainDuration: 24,
      initialWaterLevel: 35.0,
      soilMoisture: 'wet',
      baseInflow: 50
    },
    results: {
      maxInflow: 3850,
      maxLevel: 48.2,
      peakTime: 14,
      riskLevel: 'high',
      timeSeries: []
    }
  }
];

const now = new Date();
const hourlyRecords: WaterLevelRecord[] = Array.from({length: 24}).map((_, i) => {
  const d = new Date(now);
  d.setHours(d.getHours() - (23 - i));
  d.setMinutes(0);
  d.setSeconds(0);
  const level = 35 + Math.sin(i / 5) * 2 + (Math.random() * 0.2);
  return {
    id: `wl-${i}`,
    time: d.toISOString().slice(0, 16),
    level: parseFloat(level.toFixed(2))
  };
});

const specific2026Records: WaterLevelRecord[] = [];
for(let h=0; h<24; h++) {
  const level = 38.5 + Math.sin(h / 8) * 0.5 + Math.random() * 0.1;
  specific2026Records.push({
    id: `wl-2026-01-19-${h}`,
    time: `2026-01-19T${h.toString().padStart(2, '0')}:00`,
    level: parseFloat(level.toFixed(2))
  });
}
for(let h=0; h<24; h++) {
  const level = 39.0 + Math.cos(h / 8) * 0.6 + Math.random() * 0.1;
  specific2026Records.push({
    id: `wl-2026-01-20-${h}`,
    time: `2026-01-20T${h.toString().padStart(2, '0')}:00`,
    level: parseFloat(level.toFixed(2))
  });
}

const defaultWaterLevels = [...hourlyRecords, ...specific2026Records];

const defaultSettings: SystemSettings = {
  appName: 'Hệ thống Quản lý Hồ Tả Trạch',
  maintenanceMode: false,
  language: 'vi',
  dateFormat: 'DD/MM/YYYY',
  features: {
    enableAIAssistant: true,
    enableDemoCharts: true,
    enableFloodSimulation: true,
  },
  notifications: {
    emailAlerts: true,
    smsAlerts: false,
    pushNotif: true,
    alertThresholdLevel: 44.5,
  },
  backupFrequency: 'daily'
};

// Generate Mock Alerts
const generateMockAlerts = (): AlertLog[] => {
  const sensors = [
    'Đo mực nước WL-01', 'Cảm biến áp lực P2-3', 'Quan trắc thấm KN4', 
    'Nhiệt kế bê tông T-22', 'Cảm biến thấm T1', 'Trạm mưa Hương Sơn', 
    'Hệ thống Camera', 'Máy biến áp T2', 'Cửa van cung số 1', 'Cảm biến dòng chảy F-02'
  ];
  const types = ['Mất kết nối', 'Lỗi thiết bị', 'Vượt ngưỡng', 'Cảnh báo', 'Mưa lớn', 'Bảo trì', 'Điện áp thấp', 'Nhiệt độ cao'];
  const stations = ['Trạm đo đầu mối', 'Hành lang đập', 'Kênh xả', 'Khối K12', 'Đập chính (Vai phải)', 'Thượng lưu', 'Đập tràn', 'Nhà máy', 'Cửa lấy nước'];
  
  const alerts: AlertLog[] = [];
  const baseTime = new Date('2026-02-03T09:30:02');

  for (let i = 0; i < 25; i++) {
    const t = new Date(baseTime.getTime() - i * Math.floor(Math.random() * 3600 * 1000 * 2)); // Spread over time
    const severityRoll = Math.random();
    const severity: 'critical' | 'warning' | 'info' = 
        severityRoll > 0.85 ? 'critical' : severityRoll > 0.5 ? 'warning' : 'info';
    
    alerts.push({
      id: `alert-${i}`,
      time: t.toLocaleString('vi-VN'),
      timestamp: t.toISOString(),
      sensor: sensors[i % sensors.length],
      type: types[i % types.length],
      station: stations[i % stations.length],
      severity,
      message: `Chi tiết: ${types[i % types.length]} tại ${stations[i % stations.length]}. Giá trị đo ghi nhận bất thường.`,
      status: i < 3 ? 'new' : i < 10 ? 'acknowledged' : 'resolved'
    });
  }
  
  return alerts;
};

// --- DB Operations ---

export const db = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) { return defaultValue; }
  },
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(new Event('db-change'));
    } catch (e) {}
  },
  observation: {
    get: () => db.get<ObservationData>(KEYS.OBSERVATION, defaultObservation),
    set: (data: ObservationData) => db.set(KEYS.OBSERVATION, data),
  },
  forecast: {
    get: () => db.get<ForecastData>(KEYS.FORECAST, defaultForecast),
    set: (data: ForecastData) => db.set(KEYS.FORECAST, data),
  },
  specs: {
    get: () => db.get<SpecGroup[]>(KEYS.SPECS, defaultSpecs),
    set: (data: SpecGroup[]) => db.set(KEYS.SPECS, data),
  },
  operationTables: {
    get: () => db.get<OperationTable[]>(KEYS.OPERATION_TABLES, defaultOpTables),
    set: (data: OperationTable[]) => db.set(KEYS.OPERATION_TABLES, data),
  },
  images: {
    get: () => db.get<ImageGroup[]>(KEYS.IMAGES, defaultImages),
    set: (data: ImageGroup[]) => db.set(KEYS.IMAGES, data),
  },
  generalInfo: {
    get: () => db.get<GeneralInfo>(KEYS.GENERAL_INFO, defaultGeneral),
    set: (data: GeneralInfo) => db.set(KEYS.GENERAL_INFO, data),
  },
  cameras: {
    get: () => db.get<CameraInfo[]>(KEYS.CAMERAS, defaultCameras),
    set: (data: CameraInfo[]) => db.set(KEYS.CAMERAS, data),
  },
  documents: {
    get: () => db.get<DocumentItem[]>(KEYS.DOCUMENTS, defaultDocuments),
    set: (data: DocumentItem[]) => db.set(KEYS.DOCUMENTS, data),
  },
  notifications: {
    get: () => db.get<AppNotification[]>(KEYS.NOTIFICATIONS, defaultNotifications),
    set: (data: AppNotification[]) => db.set(KEYS.NOTIFICATIONS, data),
    markAllRead: () => {
      const notifs = db.notifications.get();
      db.notifications.set(notifs.map(n => ({...n, read: true})));
    }
  },
  // Added Alerts DB
  alerts: {
    get: () => db.get<AlertLog[]>(KEYS.ALERTS, generateMockAlerts()),
    set: (data: AlertLog[]) => db.set(KEYS.ALERTS, data),
    resolve: (id: string) => {
        const alerts = db.alerts.get();
        db.alerts.set(alerts.map(a => a.id === id ? { ...a, status: 'resolved' } : a));
    },
    acknowledge: (id: string) => {
        const alerts = db.alerts.get();
        db.alerts.set(alerts.map(a => a.id === id ? { ...a, status: 'acknowledged' } : a));
    }
  },
  user: {
    get: () => db.get<UserProfile>(KEYS.CURRENT_USER, defaultAdminUser),
    set: (data: UserProfile) => db.set(KEYS.CURRENT_USER, data),
  },
  users: {
    get: () => db.get<UserProfile[]>(KEYS.USERS_LIST, generateMockUsers()),
    getAll: () => db.get<UserProfile[]>(KEYS.USERS_LIST, generateMockUsers()),
    add: (user: UserProfile) => {
      const users = db.users.get();
      db.set(KEYS.USERS_LIST, [user, ...users]);
    },
    update: (user: UserProfile) => {
      const users = db.users.get();
      db.set(KEYS.USERS_LIST, users.map(u => u.id === user.id ? user : u));
      const currentUser = db.user.get();
      if(currentUser.id === user.id) {
          db.user.set(user);
      }
    },
    delete: (id: string) => {
      const users = db.users.get();
      db.set(KEYS.USERS_LIST, users.filter(u => u.id !== id));
    }
  },
  scenarios: {
    get: () => db.get<FloodScenario[]>(KEYS.SCENARIOS, defaultScenarios),
    add: (scenario: FloodScenario) => {
      const current = db.scenarios.get();
      db.set(KEYS.SCENARIOS, [scenario, ...current]);
    },
    update: (scenario: FloodScenario) => {
      const current = db.scenarios.get();
      db.set(KEYS.SCENARIOS, current.map(s => s.id === scenario.id ? scenario : s));
    },
    delete: (id: string) => {
      const current = db.scenarios.get();
      db.set(KEYS.SCENARIOS, current.filter(s => s.id !== id));
    }
  },
  waterLevels: {
    get: () => db.get<WaterLevelRecord[]>(KEYS.WATER_LEVEL_RECORDS, defaultWaterLevels),
    set: (data: WaterLevelRecord[]) => db.set(KEYS.WATER_LEVEL_RECORDS, data),
  },
  settings: {
    get: () => db.get<SystemSettings>(KEYS.SETTINGS, defaultSettings),
    set: (data: SystemSettings) => db.set(KEYS.SETTINGS, data),
  }
};
