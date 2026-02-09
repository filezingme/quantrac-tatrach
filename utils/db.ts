
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
  AlertLog,
  SensorItem,
  SidebarConfigItem
} from '../types';

// CHANGED: Version bump to force data refresh with new time format and logo field
const KEYS = {
  OBSERVATION: 'app_observation_v3',
  FORECAST: 'app_forecast_v3',
  SPECS: 'app_specs_v3',
  OPERATION_TABLES: 'app_op_tables_v3',
  IMAGES: 'app_images_v6', 
  GENERAL_INFO: 'app_general_info_v3',
  CAMERAS: 'app_cameras_v4', 
  SCENARIOS: 'app_scenarios_v3',
  NOTIFICATIONS: 'app_notifications_v4', // Bumped version for new data
  CURRENT_USER: 'app_current_user_v3',
  USERS_LIST: 'app_users_list_v3',
  WATER_LEVEL_RECORDS: 'app_water_level_records_v3',
  SETTINGS: 'app_settings_v12', // Version bump for logo persistence
  DOCUMENTS: 'app_documents_v3',
  ALERTS: 'app_alerts_v5', 
  SENSORS: 'app_sensors_v3', 
  SIDEBAR_CONFIG: 'app_sidebar_config_v2' 
};

// ... (Existing Default Data) ...
// KEEP ALL EXISTING DEFAULT DATA ABOVE THIS LINE UNCHANGED

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
    title: 'Hồ chứa & Phong cảnh', 
    images: [
      { id: 'i1', title: 'Toàn cảnh hồ Tả Trạch', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80' },
      { id: 'i2', title: 'Mặt nước hồ mùa kiệt', url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80' },
      { id: 'i3', title: 'Hoàng hôn trên hồ', url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=800&q=80' },
      { id: 'i4', title: 'Khu vực thượng lưu', url: 'https://images.unsplash.com/photo-1497436072909-60f360e1d4b0?auto=format&fit=crop&w=800&q=80' }
    ]
  },
  { 
    id: 'g2', 
    title: 'Đập chính & Công trình', 
    images: [
      { id: 'd1', title: 'Thân đập chính nhìn từ hạ lưu', url: 'https://images.unsplash.com/photo-1574786198875-49f5d09ec2d3?auto=format&fit=crop&w=800&q=80' },
      { id: 'd2', title: 'Cửa lấy nước tuynel', url: 'https://images.unsplash.com/photo-1524514587602-57223788730b?auto=format&fit=crop&w=800&q=80' },
      { id: 'd3', title: 'Kiểm tra kỹ thuật đập', url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=800&q=80' },
      { id: 'd4', title: 'Nhà máy thủy điện', url: 'https://images.unsplash.com/photo-1565610261709-5c5697d29491?auto=format&fit=crop&w=800&q=80' },
      { id: 'd5', title: 'Hệ thống van vận hành', url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=800&q=80' },
      { id: 'd6', title: 'Trung tâm điều hành', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80' }
    ]
  },
  { 
    id: 'g3', 
    title: 'Tràn xả lũ', 
    images: [
      { id: 't1', title: 'Vận hành xả lũ 2023', url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=800&q=80' },
      { id: 't2', title: 'Dòng chảy sau tràn', url: 'https://images.unsplash.com/photo-1455582916367-25f75bfc6710?auto=format&fit=crop&w=800&q=80' },
      { id: 't3', title: 'Cửa van cung', url: 'https://images.unsplash.com/photo-1535581652167-3d6b98c06d3c?auto=format&fit=crop&w=800&q=80' }
    ]
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
  { id: 'c1', name: 'Đập Chính (Drone View)', url: 'https://www.youtube.com/embed/ScMzIvxBSi4', status: 'online' },
  { id: 'c2', name: 'Giám sát Tràn xả lũ', url: 'https://www.youtube.com/embed/k7p3Y_QY6-o', status: 'online' },
  { id: 'c3', name: 'Mặt hồ Thượng lưu', url: 'https://www.youtube.com/embed/ysz5S6PUM-U', status: 'online' },
  { id: 'c4', name: 'Cửa lấy nước & Nhà máy', url: 'https://www.youtube.com/embed/3Q3eR6_s7iI', status: 'online' },
];

const defaultNotifications: AppNotification[] = [
  { id: 'n1', title: 'Cảnh báo lũ', message: 'Mực nước đang tiến sát mức báo động I. Cần theo dõi sát sao.', time: '10 phút trước', read: false, type: 'alert' },
  { id: 'n2', title: 'Mất tín hiệu cảm biến', message: 'Cảm biến áp lực thấm tại vị trí P12 bị mất kết nối. Vui lòng kiểm tra.', time: '1 giờ trước', read: false, type: 'warning' },
  { id: 'n3', title: 'Báo cáo định kỳ', message: 'Báo cáo thủy văn tháng 1/2026 đã sẵn sàng để tải về.', time: '3 giờ trước', read: false, type: 'info' },
  { id: 'n4', title: 'Đăng nhập lạ', message: 'Phát hiện đăng nhập từ IP lạ (113.161.x.x) vào lúc 08:30 sáng nay.', time: '5 giờ trước', read: true, type: 'warning' },
  { id: 'n5', title: 'Kế hoạch bảo trì', message: 'Hệ thống sẽ bảo trì định kỳ vào 00:00 ngày 25/01/2026.', time: '1 ngày trước', read: true, type: 'info' },
  { id: 'n6', title: 'Dự báo mưa lớn', message: 'Đài KTTV cảnh báo mưa lớn diện rộng trong 24h tới tại lưu vực sông Hương.', time: '1 ngày trước', read: true, type: 'alert' },
  { id: 'n7', title: 'Thay đổi quy trình', message: 'Quy trình vận hành liên hồ chứa vừa được cập nhật phiên bản mới.', time: '2 ngày trước', read: true, type: 'info' },
  { id: 'n8', title: 'Kiểm tra định kỳ', message: 'Nhắc nhở: Kiểm tra hệ thống camera an ninh khu vực đập tràn.', time: '2 ngày trước', read: true, type: 'info' },
  { id: 'n9', title: 'Cảnh báo nhiệt độ', message: 'Nhiệt độ máy biến áp T1 tăng cao bất thường (58°C).', time: '3 ngày trước', read: true, type: 'warning' },
  { id: 'n10', title: 'Sự cố mạng', message: 'Mất kết nối server trung tâm trong 5 phút. Đã khôi phục.', time: '3 ngày trước', read: true, type: 'warning' },
  { id: 'n11', title: 'Hoàn thành bảo trì', message: 'Tổ máy H2 đã hoàn thành bảo trì và hòa lưới điện quốc gia.', time: '4 ngày trước', read: true, type: 'success' as any }, // Using 'success' visually maps to info/check
  { id: 'n12', title: 'Họp giao ban', message: 'Lịch họp giao ban tuần vào 8:00 sáng thứ Hai.', time: '5 ngày trước', read: true, type: 'info' },
  { id: 'n13', title: 'Cập nhật phần mềm', message: 'Hệ thống SCADA đã được nâng cấp lên phiên bản 2.4.1.', time: '1 tuần trước', read: true, type: 'info' },
  { id: 'n14', title: 'Cảnh báo xâm nhập', message: 'Phát hiện chuyển động tại khu vực hàng rào bảo vệ phía Nam.', time: '1 tuần trước', read: true, type: 'alert' },
  { id: 'n15', title: 'Báo cáo tháng', message: 'Báo cáo vận hành tháng trước đã được phê duyệt.', time: '2 tuần trước', read: true, type: 'info' }
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
  appName: 'TP Geo Monitoring',
  appSubtitle: 'Hệ thống quản lý',
  appTitle: 'Hệ thống Quản lý TP Geo Monitoring', 
  appFooter: 'Version 3.0.1 © 2026',
  // SVG Favicon as default
  favicon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%232563eb' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1'/%3E%3Cpath d='M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 1.3 0 1.9.5 2.5 1'/%3E%3Cpath d='M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 1.3 0 1.9.5 2.5 1'/%3E%3C/svg%3E",
  // Logo default is empty to use the Waves icon fallback
  logo: "",
  maintenanceMode: false,
  language: 'vi',
  dateFormat: 'DD/MM/YYYY',
  features: {
    enableAIAssistant: true,
    aiWelcomeMessage: 'Xin chào! Tôi là Trợ lý AI. Tôi có thể giúp bạn tra cứu số liệu, vẽ biểu đồ và giải đáp quy trình vận hành.', // Default Plain Text Message
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

// Helper: Strict date formatting
const formatDateTime = (date: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
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

  for (let i = 0; i < 85; i++) {
    const t = new Date(baseTime.getTime() - i * Math.floor(Math.random() * 3600 * 1000 * 2)); // Spread over time
    const severityRoll = Math.random();
    const severity: 'critical' | 'warning' | 'info' = 
        severityRoll > 0.85 ? 'critical' : severityRoll > 0.5 ? 'warning' : 'info';
    
    alerts.push({
      id: `alert-${i}`,
      time: formatDateTime(t), // UPDATED: Use strict formatting
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

// --- MOCK DATA FOR SENSORS ---
const generateMockSensors = (): SensorItem[] => {
  const sensors: SensorItem[] = [];
  const stations = ['Trạm an toàn đập', 'Trạm thủy văn', 'Đập tràn', 'Nhà máy thủy điện', 'Cửa lấy nước'];
  const types = [
    { name: 'Đo áp lực thấm', unit: 'kPa', limit: '≥ 1314: Nguy hiểm' },
    { name: 'Đo biến dạng khe hở', unit: 'mm', limit: '≥ 15: Nguy hiểm' },
    { name: 'Đo mưa', unit: 'mm', limit: '≥ 200: Cảnh báo' },
    { name: 'Đo mực nước', unit: 'm', limit: '> 45: Tràn' },
    // Removed Concrete Temperature as requested
  ];

  // Helper to get random time in past hour with full Date Time format
  const getRandomTime = () => {
      const date = new Date();
      date.setMinutes(date.getMinutes() - Math.floor(Math.random() * 60));
      return formatDateTime(date); // UPDATED: Use strict formatting
  }

  // Helper to get random value
  const getRandomVal = (base: number) => parseFloat((base + (Math.random() * 10 - 5)).toFixed(2));

  // Manually add some to match the user's screenshot request
  sensors.push({ id: 's1', code: 'P2-3', name: 'P2-3', type: 'Đo áp lực thấm', station: 'Trạm an toàn đập', unit: 'kPa', limitInfo: '≥ 1314: Nguy hiểm', status: 'offline', lastValue: 1205.4, lastUpdated: getRandomTime() });
  sensors.push({ id: 's2', code: 'P2-2', name: 'P2-2', type: 'Đo áp lực thấm', station: 'Trạm an toàn đập', unit: 'kPa', limitInfo: '≥ 1402: Nguy hiểm', status: 'offline', lastValue: 1390.2, lastUpdated: getRandomTime() });
  sensors.push({ id: 's3', code: 'P2-1', name: 'P2-1', type: 'Đo áp lực thấm', station: 'Trạm an toàn đập', unit: 'kPa', limitInfo: '≥ 1343: Nguy hiểm', status: 'offline', lastValue: 1310.5, lastUpdated: getRandomTime() });
  sensors.push({ id: 's4', code: 'P1-3', name: 'P1-3', type: 'Đo áp lực thấm', station: 'Trạm an toàn đập', unit: 'kPa', limitInfo: '≥ 1314: Nguy hiểm', status: 'offline', lastValue: 1280.1, lastUpdated: getRandomTime() });
  
  // Add more random ones
  for (let i = 11; i <= 50; i++) {
    const type = types[i % types.length];
    const statusRoll = Math.random();
    const status = statusRoll > 0.8 ? 'offline' : statusRoll > 0.7 ? 'warning' : 'online';
    
    // Always provide value, even if offline (last known value)
    const base = type.name.includes('áp lực') ? 1200 : type.name.includes('mưa') ? 0 : 20;
    const val = getRandomVal(base);

    sensors.push({
      id: `s${i}`,
      code: `S-${100+i}`,
      name: `S-${100+i}`,
      type: type.name,
      station: stations[i % stations.length],
      unit: type.unit,
      limitInfo: type.limit,
      status: status as any,
      lastValue: val,
      lastUpdated: getRandomTime()
    });
  }

  return sensors;
};

// --- DEFAULT SIDEBAR CONFIG ---
const defaultSidebarConfig: SidebarConfigItem[] = [
  { path: '/dashboard', isVisible: true, order: 0 },
  { path: '/map', isVisible: true, order: 1 },
  { path: '/alerts', isVisible: true, order: 2 },
  { path: '/sensors', isVisible: true, order: 3 },
  { path: '/water-level', isVisible: true, order: 4 }, 
  { path: '/camera', isVisible: true, order: 5 },      
  { path: '/images', isVisible: true, order: 6 },      
  { path: '/ai-safety', isVisible: true, order: 7 },
  { path: '/forecast', isVisible: true, order: 8 },
  { path: '/flood-forecast', isVisible: true, order: 9 },
  { path: '/operation', isVisible: true, order: 10 },
  { path: '/documents', isVisible: true, order: 11 },
  { path: '/records', isVisible: true, order: 12 },
  { path: '/demo-charts', isVisible: true, order: 13 },
  { path: '/specs', isVisible: true, order: 14 },
  { path: '/general-info', isVisible: true, order: 15 },
  { path: '/manual-entry', isVisible: true, order: 16 },
  { path: '/users', isVisible: true, order: 17 }
];

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
  sensors: {
    get: () => db.get<SensorItem[]>(KEYS.SENSORS, generateMockSensors()),
    set: (data: SensorItem[]) => db.set(KEYS.SENSORS, data),
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
  },
  sidebar: {
    get: () => db.get<SidebarConfigItem[]>(KEYS.SIDEBAR_CONFIG, defaultSidebarConfig),
    set: (data: SidebarConfigItem[]) => db.set(KEYS.SIDEBAR_CONFIG, data),
    reset: () => db.set(KEYS.SIDEBAR_CONFIG, defaultSidebarConfig)
  }
};
