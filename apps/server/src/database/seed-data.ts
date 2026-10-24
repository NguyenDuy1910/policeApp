import type { IncidentType, PlaceCategory, ReviewStatus } from '@vnpolice/shared';

/**
 * Seed timestamps are relative to the moment of seeding so the dashboard always shows
 * a current workload. `daysAgo` + local `at` (Asia/Ho_Chi_Minh) for past days,
 * `minutesAgo` for events earlier today.
 */
export type SeedMoment = { daysAgo: number; at: string } | { minutesAgo: number };

export interface SeedPoliceUnit {
  id: number;
  name: string;
  level: string;
  area: string;
  hotline: string;
  latitude: number;
  longitude: number;
}

export interface SeedPlace {
  id: number;
  name: string;
  category: PlaceCategory;
  address: string;
  latitude: number;
  longitude: number;
  verified: boolean;
}

export interface SeedReview {
  placeId: number;
  author: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  at: SeedMoment;
}

export interface SeedReport {
  /** Six-character suffix of the VN-YYYYMMDD-XXXXXX report code. */
  code: string;
  incidentType: IncidentType;
  description: string | null;
  incident: readonly [number, number];
  /** Reporter device offset from the incident in degrees; null when the citizen did not share GPS. */
  reporterOffset: readonly [number, number] | null;
  gpsAccuracy: number | null;
  reportedAt: SeedMoment;
  /** Minutes after submission for received → processing → resolved; length determines the current status. */
  progress: readonly number[];
  attachment?: {
    sourceFile: string;
    originalName: string;
  };
}

export const POLICE_UNIT_VERIFICATION_SOURCE =
  'Danh bạ đường dây nóng Công an tỉnh Cà Mau; vị trí theo trung tâm hành chính phường/xã';
export const PLACE_VERIFICATION_SOURCE = 'Đối chiếu giấy chứng nhận đăng ký hộ kinh doanh và biển hiệu tại địa chỉ';
export const PLACE_DATA_SOURCE = 'Hồ sơ đăng ký của cơ sở';

// Organisation duty lines from references/Ten_don_vi.docx. Personal officer numbers are intentionally excluded.
export const seedPoliceUnits: readonly SeedPoliceUnit[] = [
  { id: 1, name: 'Công an phường An Xuyên', level: 'Công an phường', area: 'Phường An Xuyên', hotline: '02903831136', latitude: 9.1878, longitude: 105.1462 },
  { id: 2, name: 'Công an phường Hòa Thành', level: 'Công an phường', area: 'Phường Hòa Thành', hotline: '02903675113', latitude: 9.1482, longitude: 105.1648 },
  { id: 3, name: 'Công an phường Lý Văn Lâm', level: 'Công an phường', area: 'Phường Lý Văn Lâm', hotline: '02903831050', latitude: 9.1716, longitude: 105.1183 },
  { id: 4, name: 'Công an phường Tân Thành', level: 'Công an phường', area: 'Phường Tân Thành', hotline: '02903696588', latitude: 9.1791, longitude: 105.1818 },
  { id: 5, name: 'Công an xã Thới Bình', level: 'Công an xã', area: 'Xã Thới Bình', hotline: '02903860189', latitude: 9.3478, longitude: 105.0962 },
  { id: 6, name: 'Công an xã Cái Nước', level: 'Công an xã', area: 'Xã Cái Nước', hotline: '02903883626', latitude: 8.9381, longitude: 105.0128 },
  { id: 7, name: 'Đồn Công an Khu công nghiệp Khí - Điện - Đạm', level: 'Đồn Công an', area: 'Khu công nghiệp Khí - Điện - Đạm, xã Khánh An', hotline: '02903650779', latitude: 9.2142, longitude: 105.0561 },
  { id: 8, name: 'Công an phường Bạc Liêu', level: 'Công an phường', area: 'Phường Bạc Liêu', hotline: '02913932118', latitude: 9.2941, longitude: 105.7244 },
  { id: 9, name: 'Công an phường Hiệp Thành', level: 'Công an phường', area: 'Phường Hiệp Thành', hotline: '02913836021', latitude: 9.2562, longitude: 105.7521 },
  { id: 10, name: 'Công an phường Vĩnh Trạch', level: 'Công an phường', area: 'Phường Vĩnh Trạch', hotline: '02913852731', latitude: 9.2713, longitude: 105.7928 },
  { id: 11, name: 'Công an phường Láng Tròn', level: 'Công an phường', area: 'Phường Láng Tròn', hotline: '02913852731', latitude: 9.2809, longitude: 105.4812 },
  { id: 12, name: 'Công an phường Giá Rai', level: 'Công an phường', area: 'Phường Giá Rai', hotline: '02913850201', latitude: 9.2379, longitude: 105.4518 },
  { id: 13, name: 'Công an xã Trí Phải', level: 'Công an xã', area: 'Xã Trí Phải', hotline: '02903862091', latitude: 9.3812, longitude: 105.1597 },
  { id: 14, name: 'Công an xã Tân Lộc', level: 'Công an xã', area: 'Xã Tân Lộc', hotline: '02903867113', latitude: 9.3205, longitude: 105.1788 },
  { id: 15, name: 'Công an xã Hồ Thị Kỷ', level: 'Công an xã', area: 'Xã Hồ Thị Kỷ', hotline: '02903868325', latitude: 9.2716, longitude: 105.1022 },
  { id: 16, name: 'Công an xã Biển Bạch', level: 'Công an xã', area: 'Xã Biển Bạch', hotline: '0777427752', latitude: 9.3702, longitude: 105.0214 },
  { id: 17, name: 'Công an xã Nguyễn Phích', level: 'Công an xã', area: 'Xã Nguyễn Phích', hotline: '02903863064', latitude: 9.3895, longitude: 104.9512 },
  { id: 18, name: 'Công an xã U Minh', level: 'Công an xã', area: 'Xã U Minh', hotline: '02903866833', latitude: 9.2903, longitude: 104.9804 },
  { id: 19, name: 'Công an xã Khánh An', level: 'Công an xã', area: 'Xã Khánh An', hotline: '0942003209', latitude: 9.2448, longitude: 105.0253 },
  { id: 20, name: 'Công an xã Khánh Lâm', level: 'Công an xã', area: 'Xã Khánh Lâm', hotline: '02903865113', latitude: 9.3204, longitude: 104.8806 },
  { id: 21, name: 'Công an xã Trần Văn Thời', level: 'Công an xã', area: 'Xã Trần Văn Thời', hotline: '0949913113', latitude: 9.0762, longitude: 104.9748 },
  { id: 22, name: 'Công an xã Sông Đốc', level: 'Công an xã', area: 'Xã Sông Đốc', hotline: '02903891113', latitude: 9.0418, longitude: 104.8268 },
  { id: 23, name: 'Công an xã Khánh Hưng', level: 'Công an xã', area: 'Xã Khánh Hưng', hotline: '02903920004', latitude: 9.1203, longitude: 104.9011 },
  { id: 24, name: 'Công an xã Khánh Bình', level: 'Công an xã', area: 'Xã Khánh Bình', hotline: '02903915045', latitude: 9.1508, longitude: 104.9306 },
  { id: 25, name: 'Công an xã Đá Bạc', level: 'Công an xã', area: 'Xã Đá Bạc', hotline: '02903897382', latitude: 9.1552, longitude: 104.8351 },
  { id: 26, name: 'Công an xã Lương Thế Trân', level: 'Công an xã', area: 'Xã Lương Thế Trân', hotline: '0913090129', latitude: 9.0204, longitude: 105.0797 },
  { id: 27, name: 'Công an xã Tân Hưng', level: 'Công an xã', area: 'Xã Tân Hưng', hotline: '02903770113', latitude: 8.9455, longitude: 105.0702 },
  { id: 28, name: 'Công an xã Hưng Mỹ', level: 'Công an xã', area: 'Xã Hưng Mỹ', hotline: '0913780407', latitude: 8.9003, longitude: 104.9603 },
  { id: 29, name: 'Công an xã Đầm Dơi', level: 'Công an xã', area: 'Xã Đầm Dơi', hotline: '02903858040', latitude: 8.9902, longitude: 105.1957 },
  { id: 30, name: 'Công an xã Tân Thuận', level: 'Công an xã', area: 'Xã Tân Thuận', hotline: '02903853077', latitude: 9.0301, longitude: 105.2803 },
  { id: 31, name: 'Công an xã Tân Tiến', level: 'Công an xã', area: 'Xã Tân Tiến', hotline: '02903852242', latitude: 9.0698, longitude: 105.2196 },
  { id: 32, name: 'Công an xã Tạ An Khương', level: 'Công an xã', area: 'Xã Tạ An Khương', hotline: '02903858504', latitude: 9.0305, longitude: 105.1504 },
  { id: 33, name: 'Công an xã Trần Phán', level: 'Công an xã', area: 'Xã Trần Phán', hotline: '0913447790', latitude: 8.9402, longitude: 105.2003 },
  { id: 34, name: 'Công an xã Quách Phẩm', level: 'Công an xã', area: 'Xã Quách Phẩm', hotline: '0918552274', latitude: 8.9204, longitude: 105.2497 },
  { id: 35, name: 'Công an xã Thanh Tùng', level: 'Công an xã', area: 'Xã Thanh Tùng', hotline: '0918906991', latitude: 8.9006, longitude: 105.1602 },
  { id: 36, name: 'Công an xã Phan Ngọc Hiển', level: 'Công an xã', area: 'Xã Phan Ngọc Hiển', hotline: '0913085247', latitude: 8.7012, longitude: 104.8994 },
  { id: 37, name: 'Công an xã Đất Mũi', level: 'Công an xã', area: 'Xã Đất Mũi', hotline: '02903870760', latitude: 8.6148, longitude: 104.7452 },
  { id: 38, name: 'Công an xã Tân Ân', level: 'Công an xã', area: 'Xã Tân Ân', hotline: '0375066902', latitude: 8.6703, longitude: 104.8806 },
  { id: 39, name: 'Công an xã Năm Căn', level: 'Công an xã', area: 'Xã Năm Căn', hotline: '02903877163', latitude: 8.7598, longitude: 104.9903 },
  { id: 40, name: 'Công an xã Đất Mới', level: 'Công an xã', area: 'Xã Đất Mới', hotline: '0919760002', latitude: 8.8002, longitude: 105.0302 },
  { id: 41, name: 'Công an xã Tam Giang', level: 'Công an xã', area: 'Xã Tam Giang', hotline: '0919334453', latitude: 8.7604, longitude: 105.0998 },
  { id: 42, name: 'Công an xã Cái Đôi Vàm', level: 'Công an xã', area: 'Xã Cái Đôi Vàm', hotline: '02903889036', latitude: 8.8503, longitude: 104.8102 },
  { id: 43, name: 'Công an xã Nguyễn Việt Khái', level: 'Công an xã', area: 'Xã Nguyễn Việt Khái', hotline: '0917073113', latitude: 8.8304, longitude: 104.9003 },
  { id: 44, name: 'Công an xã Phú Mỹ', level: 'Công an xã', area: 'Xã Phú Mỹ', hotline: '02903886231', latitude: 8.9302, longitude: 104.8398 },
  { id: 45, name: 'Công an xã Phú Tân', level: 'Công an xã', area: 'Xã Phú Tân', hotline: '02913880438', latitude: 8.8801, longitude: 104.8703 },
  { id: 46, name: 'Công an xã Hòa Bình', level: 'Công an xã', area: 'Xã Hòa Bình', hotline: '02913880438', latitude: 9.2852, longitude: 105.6298 },
  { id: 47, name: 'Công an xã Vĩnh Hậu', level: 'Công an xã', area: 'Xã Vĩnh Hậu', hotline: '02913899007', latitude: 9.2001, longitude: 105.6402 },
  { id: 48, name: 'Công an xã Vĩnh Mỹ', level: 'Công an xã', area: 'Xã Vĩnh Mỹ', hotline: '02913893811', latitude: 9.2503, longitude: 105.6003 },
  { id: 49, name: 'Công an xã Vĩnh Lợi', level: 'Công an xã', area: 'Xã Vĩnh Lợi', hotline: '02913830661', latitude: 9.3602, longitude: 105.7198 },
  { id: 50, name: 'Công an xã Hưng Hội', level: 'Công an xã', area: 'Xã Hưng Hội', hotline: '02913894833', latitude: 9.3503, longitude: 105.7602 },
  { id: 51, name: 'Công an xã Châu Thới', level: 'Công an xã', area: 'Xã Châu Thới', hotline: '02913890723', latitude: 9.3902, longitude: 105.6702 },
  { id: 52, name: 'Công an xã Hồng Dân', level: 'Công an xã', area: 'Xã Hồng Dân', hotline: '0842876959', latitude: 9.5603, longitude: 105.4402 },
  { id: 53, name: 'Công an xã Ninh Quới', level: 'Công an xã', area: 'Xã Ninh Quới', hotline: '0559788113', latitude: 9.5102, longitude: 105.5203 },
  { id: 54, name: 'Công an xã Ninh Thạnh Lợi', level: 'Công an xã', area: 'Xã Ninh Thạnh Lợi', hotline: '0946347445', latitude: 9.4703, longitude: 105.3502 },
  { id: 55, name: 'Công an xã Vĩnh Lộc', level: 'Công an xã', area: 'Xã Vĩnh Lộc', hotline: '0825214930', latitude: 9.5802, longitude: 105.3603 },
  { id: 56, name: 'Công an xã Phong Hiệp', level: 'Công an xã', area: 'Xã Phong Hiệp', hotline: '0943625131', latitude: 9.4302, longitude: 105.4298 },
  { id: 57, name: 'Công an xã Phước Long', level: 'Công an xã', area: 'Xã Phước Long', hotline: '0901081081', latitude: 9.4401, longitude: 105.4603 },
  { id: 58, name: 'Công an xã Vĩnh Phước', level: 'Công an xã', area: 'Xã Vĩnh Phước', hotline: '02913866634', latitude: 9.4002, longitude: 105.5003 },
  { id: 59, name: 'Công an xã Vĩnh Thanh', level: 'Công an xã', area: 'Xã Vĩnh Thanh', hotline: '02913869222', latitude: 9.3603, longitude: 105.4902 },
  { id: 60, name: 'Công an xã An Trạch', level: 'Công an xã', area: 'Xã An Trạch', hotline: '0854108729', latitude: 9.1402, longitude: 105.5702 },
  { id: 61, name: 'Công an xã Định Thành', level: 'Công an xã', area: 'Xã Định Thành', hotline: '02913857005', latitude: 9.1803, longitude: 105.5302 },
  { id: 62, name: 'Công an xã Đông Hải', level: 'Công an xã', area: 'Xã Đông Hải', hotline: '02913757007', latitude: 9.1002, longitude: 105.4803 },
  { id: 63, name: 'Công an xã Gành Hào', level: 'Công an xã', area: 'Xã Gành Hào', hotline: '02913845115', latitude: 9.0302, longitude: 105.4198 },
  { id: 64, name: 'Công an xã Long Điền', level: 'Công an xã', area: 'Xã Long Điền', hotline: '02913840686', latitude: 9.1302, longitude: 105.4502 },
  { id: 65, name: 'Công an xã Phong Thạnh', level: 'Công an xã', area: 'Xã Phong Thạnh', hotline: '02913853445', latitude: 9.2803, longitude: 105.3802 },
];

export const seedPlaces: readonly SeedPlace[] = [
  { id: 1, name: 'Bánh canh cua Bà Tư', category: 'food', address: '52 Phan Ngọc Hiển, phường An Xuyên, Cà Mau', latitude: 9.17724, longitude: 105.15118, verified: true },
  { id: 2, name: 'Cơm tấm Thuận Phát', category: 'food', address: '118 Trần Hưng Đạo, phường An Xuyên, Cà Mau', latitude: 9.17452, longitude: 105.15731, verified: true },
  { id: 3, name: 'Cà phê Bến Gành Hào', category: 'food', address: '7 Lý Thường Kiệt, phường An Xuyên, Cà Mau', latitude: 9.17518, longitude: 105.15452, verified: true },
  { id: 4, name: 'Lẩu mắm U Minh Quán', category: 'food', address: '215 Nguyễn Tất Thành, phường An Xuyên, Cà Mau', latitude: 9.18322, longitude: 105.14183, verified: true },
  { id: 5, name: 'Bún nước lèo Cô Ba Sóc Trăng', category: 'food', address: '34 Ngô Quyền, phường An Xuyên, Cà Mau', latitude: 9.17984, longitude: 105.14893, verified: true },
  { id: 6, name: 'Nhà hàng Đất Mũi Xanh', category: 'food', address: '88 Hùng Vương, phường An Xuyên, Cà Mau', latitude: 9.18031, longitude: 105.15302, verified: true },
  { id: 7, name: 'Bánh mì Hòa Lợi', category: 'food', address: '21 Lê Lợi, phường An Xuyên, Cà Mau', latitude: 9.17641, longitude: 105.14952, verified: true },
  { id: 8, name: 'Mộc Miên Coffee & Tea', category: 'food', address: '146 Ngô Quyền, phường An Xuyên, Cà Mau', latitude: 9.18153, longitude: 105.14702, verified: false },
  { id: 9, name: 'Sửa xe máy Minh Phát', category: 'service', address: '309 Nguyễn Trãi, phường Tân Thành, Cà Mau', latitude: 9.17012, longitude: 105.15548, verified: true },
  { id: 10, name: 'Nhà thuốc Phước Thiện', category: 'service', address: '63 Phan Đình Phùng, phường An Xuyên, Cà Mau', latitude: 9.17812, longitude: 105.15284, verified: true },
  { id: 11, name: 'Rửa xe & thay nhớt An Khang', category: 'service', address: '402 Lý Văn Lâm, phường Lý Văn Lâm, Cà Mau', latitude: 9.16953, longitude: 105.13851, verified: true },
  { id: 12, name: 'Cứu hộ xe 24/7 Tấn Lộc', category: 'service', address: '77 Quang Trung, phường Tân Thành, Cà Mau', latitude: 9.17403, longitude: 105.16102, verified: true },
  { id: 13, name: 'Khóa – chìa khóa Hưng Thịnh', category: 'service', address: '12 Lý Bôn, phường An Xuyên, Cà Mau', latitude: 9.17861, longitude: 105.14772, verified: false },
  { id: 14, name: 'Khách sạn Mũi Cà Mau', category: 'service', address: '25 Phan Bội Châu, phường An Xuyên, Cà Mau', latitude: 9.17583, longitude: 105.15251, verified: true },
];

const approved = 'approved' as const;

export const seedReviews: readonly SeedReview[] = [
  { placeId: 1, author: 'Ngọc Trâm', rating: 5, comment: 'Bánh canh sợi dai, nước dùng ngọt từ cua thật, chả cua nhiều. Sáng 6h30 đã đông, nên đi sớm.', status: approved, at: { daysAgo: 41, at: '07:12' } },
  { placeId: 1, author: 'Trần Minh Khoa', rating: 4, comment: 'Ngon, giá 45k một tô đầy đủ. Chỗ ngồi hơi chật vào cuối tuần.', status: approved, at: { daysAgo: 23, at: '08:05' } },
  { placeId: 1, author: 'Lê Thị Hồng', rating: 5, comment: 'Ăn ở đây từ hồi còn đi học, vẫn giữ được vị. Cô chủ dễ thương.', status: approved, at: { daysAgo: 9, at: '06:48' } },
  { placeId: 1, author: 'Huỳnh Phát', rating: 4, comment: 'Cua tươi, nêm vừa. Gửi xe miễn phí ngay trước quán.', status: approved, at: { daysAgo: 2, at: '07:35' } },

  { placeId: 2, author: 'Phạm Quốc Bảo', rating: 4, comment: 'Sườn nướng thơm, mềm, cơm tấm hạt nhỏ đúng kiểu. Mở tới 22h nên tiện ăn khuya.', status: approved, at: { daysAgo: 35, at: '19:40' } },
  { placeId: 2, author: 'Đặng Thu Hà', rating: 5, comment: 'Phần bì chả trứng làm kỹ, nước mắm pha vừa miệng. Phục vụ nhanh dù đông khách.', status: approved, at: { daysAgo: 14, at: '12:10' } },
  { placeId: 2, author: 'Nguyễn Văn Lực', rating: 3, comment: 'Đồ ăn ổn nhưng hôm mình tới phải đợi gần 20 phút mới có món.', status: approved, at: { daysAgo: 6, at: '18:55' } },

  { placeId: 3, author: 'Thanh Tuyền', rating: 5, comment: 'View sông Gành Hào rất chill, chiều ngồi hóng gió thích lắm. Cà phê muối ngon.', status: approved, at: { daysAgo: 30, at: '16:20' } },
  { placeId: 3, author: 'Võ Hoàng Nam', rating: 4, comment: 'Không gian rộng, wifi mạnh, phù hợp ngồi làm việc. Cuối tuần hơi ồn.', status: approved, at: { daysAgo: 12, at: '09:30' } },
  { placeId: 3, author: 'Kim Ngân', rating: 5, comment: 'Nhân viên thân thiện, nước ép tươi. Có chỗ để xe rộng có bảo vệ.', status: approved, at: { daysAgo: 4, at: '15:05' } },

  { placeId: 4, author: 'Lâm Chí Thiện', rating: 5, comment: 'Lẩu mắm đậm vị miền Tây, rau đồng nhiều loại tươi. Dẫn bạn ở Sài Gòn xuống ai cũng khen.', status: approved, at: { daysAgo: 52, at: '19:15' } },
  { placeId: 4, author: 'Trương Mỹ Linh', rating: 4, comment: 'Nồi lẩu cho 4 người khoảng 350k, cá kèo tươi. Nên đặt bàn trước vào tối thứ Bảy.', status: approved, at: { daysAgo: 19, at: '20:02' } },
  { placeId: 4, author: 'Hồ Tấn Phúc', rating: 4, comment: 'Ngon, phục vụ chu đáo. Bãi giữ xe hơi xa nhưng có người hướng dẫn.', status: approved, at: { daysAgo: 8, at: '18:30' } },
  { placeId: 4, author: 'Diệp Anh Thư', rating: 5, comment: 'Mắm thơm không bị gắt, ba khía rang me ăn kèm rất bắt cơm.', status: approved, at: { daysAgo: 1, at: '19:48' } },

  { placeId: 5, author: 'Thạch Sô Phi', rating: 5, comment: 'Bún nước lèo chuẩn vị Sóc Trăng, mắm bò hóc thơm, có heo quay giòn.', status: approved, at: { daysAgo: 27, at: '07:20' } },
  { placeId: 5, author: 'Nguyễn Thị Mai', rating: 4, comment: 'Giá bình dân, 35k một tô. Quán sạch sẽ, có quạt mát.', status: approved, at: { daysAgo: 10, at: '06:55' } },

  { placeId: 6, author: 'Tô Gia Huy', rating: 5, comment: 'Đặt tiệc 3 bàn cho gia đình, món cua rang me và lẩu cá bông lau rất ngon, phòng riêng sạch sẽ.', status: approved, at: { daysAgo: 45, at: '21:10' } },
  { placeId: 6, author: 'Phan Thùy Dương', rating: 4, comment: 'Hải sản tươi, giá niêm yết rõ ràng. Có chỗ đậu ô tô.', status: approved, at: { daysAgo: 16, at: '20:25' } },
  { placeId: 6, author: 'Lý Thành Đạt', rating: 4, comment: 'Phục vụ chuyên nghiệp, tôm càng nướng muối ớt đáng thử.', status: approved, at: { daysAgo: 5, at: '19:05' } },

  { placeId: 7, author: 'Châu Minh Tú', rating: 5, comment: 'Bánh mì giòn rụm, pate tự làm béo ngậy. 20k một ổ đầy đủ.', status: approved, at: { daysAgo: 21, at: '06:40' } },
  { placeId: 7, author: 'Đoàn Bích Ngọc', rating: 4, comment: 'Sáng nào đi làm cũng ghé, bán nhanh, có cả bánh mì chay.', status: approved, at: { daysAgo: 3, at: '06:58' } },

  { placeId: 8, author: 'Quang Vinh', rating: 4, comment: 'Quán mới mở, trà sữa ít ngọt vừa uống, decor đẹp chụp hình nhiều góc.', status: approved, at: { daysAgo: 6, at: '15:40' } },

  { placeId: 9, author: 'Trần Văn Hậu', rating: 5, comment: 'Xe bị thủng ruột lúc 21h, gọi điện anh chủ vẫn mở cửa vá giúp. Giá hợp lý, làm cẩn thận.', status: approved, at: { daysAgo: 33, at: '21:20' } },
  { placeId: 9, author: 'Lê Hoàng Yến', rating: 4, comment: 'Thay nhớt, kiểm tra thắng miễn phí. Báo giá trước khi sửa nên rất yên tâm.', status: approved, at: { daysAgo: 11, at: '10:15' } },
  { placeId: 9, author: 'Nguyễn Thanh Sang', rating: 5, comment: 'Thợ có tay nghề, chẩn đoán đúng bệnh xe ngay lần đầu.', status: approved, at: { daysAgo: 2, at: '16:45' } },

  { placeId: 10, author: 'Phạm Thị Thu', rating: 5, comment: 'Dược sĩ tư vấn kỹ, có hóa đơn đầy đủ. Mở cửa tới 22h30.', status: approved, at: { daysAgo: 29, at: '20:50' } },
  { placeId: 10, author: 'Bùi Đức Anh', rating: 4, comment: 'Thuốc đầy đủ, giá niêm yết. Đông khách vào buổi tối.', status: approved, at: { daysAgo: 7, at: '19:30' } },

  { placeId: 11, author: 'Mã Thanh Long', rating: 4, comment: 'Rửa xe máy 25k, sạch kỹ cả gầm. Có ghế chờ và nước uống.', status: approved, at: { daysAgo: 18, at: '08:40' } },
  { placeId: 11, author: 'Nguyễn Hữu Tài', rating: 5, comment: 'Rửa ô tô nhanh, nhân viên lau khô kỹ, không bị đọng nước.', status: approved, at: { daysAgo: 4, at: '09:10' } },

  { placeId: 12, author: 'Võ Thị Kiều', rating: 5, comment: 'Xe chết máy trên đường Quang Trung lúc gần nửa đêm, gọi 15 phút là có người tới kéo về. Rất cảm ơn.', status: approved, at: { daysAgo: 25, at: '23:40' } },
  { placeId: 12, author: 'Đinh Công Danh', rating: 4, comment: 'Phản hồi điện thoại nhanh, báo giá kéo xe rõ ràng.', status: approved, at: { daysAgo: 9, at: '13:20' } },

  { placeId: 13, author: 'Tăng Mỹ Hạnh', rating: 5, comment: 'Mất chìa khóa xe, anh thợ làm lại chìa mới trong 10 phút, giá hợp lý.', status: approved, at: { daysAgo: 13, at: '17:35' } },

  { placeId: 14, author: 'Lưu Bảo Ngọc', rating: 4, comment: 'Phòng sạch, máy lạnh êm, gần chợ và công viên Hùng Vương. Lễ tân hỗ trợ đặt tour Đất Mũi.', status: approved, at: { daysAgo: 38, at: '22:05' } },
  { placeId: 14, author: 'Hoàng Khải', rating: 5, comment: 'Đi công tác ở 2 đêm, nhân viên nhiệt tình, bữa sáng ổn.', status: approved, at: { daysAgo: 15, at: '07:50' } },
  { placeId: 14, author: 'Trịnh Gia Bảo', rating: 3, comment: 'Phòng ổn nhưng cách âm hơi kém, nghe tiếng xe ngoài đường.', status: approved, at: { daysAgo: 3, at: '08:20' } },

  // Moderation queue: recent submissions awaiting review, plus one rejected advertisement.
  { placeId: 2, author: 'Kiều Oanh', rating: 5, comment: 'Mới ăn trưa xong, sườn hôm nay nướng vừa tới, nước mắm ngon. Sẽ quay lại.', status: 'pending', at: { minutesAgo: 95 } },
  { placeId: 7, author: 'Phú Nguyễn', rating: 2, comment: 'Sáng nay mua bánh mì nhưng nhân viên làm thiếu chả, gọi lại thì được đổi nhưng phải chờ lâu.', status: 'pending', at: { minutesAgo: 210 } },
  { placeId: 8, author: 'Thảo My', rating: 5, comment: 'Trà đào cam sả ngon, chỗ ngồi tầng 2 yên tĩnh, có ổ cắm sạc điện thoại.', status: 'pending', at: { minutesAgo: 35 } },
  { placeId: 3, author: 'Shop giày giá rẻ', rating: 1, comment: 'Ghé shop giày ABC giảm giá 50% toàn bộ, inbox zalo 09xx để nhận mã ưu đãi!!!', status: 'rejected', at: { daysAgo: 2, at: '11:02' } },
];

export const seedReports: readonly SeedReport[] = [
  // Today — live workload awaiting the duty officer.
  {
    code: 'K7M2QD',
    incidentType: 'traffic_accident',
    description:
      'Va chạm giữa xe máy và xe tải nhỏ tại vòng xoay Lý Thường Kiệt – Trần Hưng Đạo. Một người đàn ông bị trầy xước tay chân, đang ngồi bên lề đường. Giao thông hướng về cầu Gành Hào bị chậm.',
    incident: [9.17612, 105.15684],
    reporterOffset: [0.00021, -0.00034],
    gpsAccuracy: 6,
    reportedAt: { minutesAgo: 6 },
    progress: [],
    attachment: { sourceFile: 'motorcycle-car-collision.jpg', originalName: 'hien-truong-va-cham-xe-may-o-to.jpg' },
  },
  {
    code: 'P3XW8N',
    incidentType: 'public_security',
    description:
      'Hai thanh niên đi xe máy không gắn biển số chạy chậm qua lại nhiều lần trong hẻm 51 Phan Ngọc Hiển, nhìn vào các nhà để xe máy ngoài sân. Người dân trong hẻm đang theo dõi.',
    incident: [9.17791, 105.15192],
    reporterOffset: [0.00008, 0.00011],
    gpsAccuracy: 11,
    reportedAt: { minutesAgo: 18 },
    progress: [],
  },
  {
    code: 'B9TF4R',
    incidentType: 'fighting',
    description:
      'Nhóm khoảng 6 người cự cãi rồi xô xát trước quán nhậu đối diện công viên Hùng Vương, có người cầm vỏ chai. Đã có người can ngăn nhưng chưa dừng.',
    incident: [9.18083, 105.15412],
    reporterOffset: [-0.00045, 0.00029],
    gpsAccuracy: 9,
    reportedAt: { minutesAgo: 47 },
    progress: [4],
  },
  {
    code: 'H2LC6V',
    incidentType: 'fire',
    description:
      'Khói đen bốc lên từ bãi chứa phế liệu phía sau dãy nhà trọ đường Lý Văn Lâm, có mùi nhựa cháy. Người dân đang dùng vòi nước dập lửa, lửa chưa lan sang nhà dân.',
    incident: [9.16894, 105.13621],
    reporterOffset: [0.00062, 0.00048],
    gpsAccuracy: 14,
    reportedAt: { minutesAgo: 135 },
    progress: [3, 11],
  },
  {
    code: 'D5RJ1S',
    incidentType: 'other',
    description:
      'Cây me lớn bật gốc sau cơn mưa giông, ngã chắn gần hết làn đường Ngô Quyền và đè lên dây điện. Xe máy phải chạy lên lề.',
    incident: [9.18121, 105.14763],
    reporterOffset: [0.00015, -0.00022],
    gpsAccuracy: 8,
    reportedAt: { minutesAgo: 220 },
    progress: [6, 25],
  },
  {
    code: 'W4ZN7E',
    incidentType: 'traffic_accident',
    description:
      'Ô tô con va quẹt xe máy khi chuyển làn trên đường Nguyễn Tất Thành, không ai bị thương nặng nhưng hai bên đang tranh cãi và chiếm một phần lòng đường.',
    incident: [9.18402, 105.14051],
    reporterOffset: [-0.00018, 0.00012],
    gpsAccuracy: 5,
    reportedAt: { minutesAgo: 300 },
    progress: [5, 14, 96],
    attachment: { sourceFile: 'road-incident-response.jpg', originalName: 'hien-truong-xu-ly-va-cham.jpg' },
  },

  // Previous days — closed cases.
  {
    code: 'G8YB3K',
    incidentType: 'fighting',
    description:
      'Hai nhóm thanh niên xem bóng đá tại quán cà phê đường Lê Lợi, sau trận đấu lời qua tiếng lại rồi đánh nhau, một người chảy máu ở trán.',
    incident: [9.17662, 105.14971],
    reporterOffset: [0.00031, 0.00026],
    gpsAccuracy: 10,
    reportedAt: { daysAgo: 1, at: '21:42' },
    progress: [4, 12, 58],
  },
  {
    code: 'T6QH2M',
    incidentType: 'public_security',
    description:
      'Phát hiện một xe máy Honda Wave màu đỏ bị bỏ lại ven bờ sông Gành Hào gần bến tàu B đã 3 ngày, không có người trông coi, nghi xe bị trộm rồi vứt bỏ.',
    incident: [9.17392, 105.15903],
    reporterOffset: null,
    gpsAccuracy: null,
    reportedAt: { daysAgo: 1, at: '14:10' },
    progress: [8, 20, 140],
  },
  {
    code: 'N1VK9A',
    incidentType: 'public_security',
    description:
      'Nhà số 27 hẻm 16 Phan Đình Phùng hát karaoke loa công suất lớn từ 20h đến giờ chưa tắt, ảnh hưởng người già và trẻ nhỏ trong xóm.',
    incident: [9.17862, 105.15342],
    reporterOffset: [0.00052, -0.00041],
    gpsAccuracy: 18,
    reportedAt: { daysAgo: 1, at: '23:05' },
    progress: [5, 16, 47],
  },
  {
    code: 'F7CX5L',
    incidentType: 'traffic_accident',
    description:
      'Xe tải chở cát làm rơi vãi cát dày trên mặt đường đoạn dốc cầu Phan Ngọc Hiển, đã có 2 xe máy bị trượt ngã.',
    incident: [9.17571, 105.14972],
    reporterOffset: [-0.00024, -0.00017],
    gpsAccuracy: 7,
    reportedAt: { daysAgo: 2, at: '07:35' },
    progress: [3, 9, 72],
    attachment: { sourceFile: 'crashed-motorcycle.jpg', originalName: 'xe-may-truot-nga-tai-hien-truong.jpg' },
  },
  {
    code: 'R2JS8U',
    incidentType: 'other',
    description:
      'Bé trai khoảng 5 tuổi, mặc áo thun màu vàng, đi lạc ở khu vui chơi công viên Hùng Vương, đang được một chị bán nước giữ lại, chưa tìm thấy người thân.',
    incident: [9.18052, 105.15463],
    reporterOffset: [0.00006, 0.00009],
    gpsAccuracy: 6,
    reportedAt: { daysAgo: 2, at: '16:20' },
    progress: [7, 18, 85],
  },
  {
    code: 'C4MP6Y',
    incidentType: 'fire',
    description:
      'Chập điện ở trụ điện trước nhà số 140 đường Trần Hưng Đạo, có tia lửa và khói, nhiều hộ xung quanh bị mất điện.',
    incident: [9.17481, 105.15772],
    reporterOffset: [0.00038, 0.00021],
    gpsAccuracy: 9,
    reportedAt: { daysAgo: 3, at: '19:05' },
    progress: [2, 6, 64],
  },
  {
    code: 'X8EA3W',
    incidentType: 'public_security',
    description:
      'Bị giật túi xách khi đang đi bộ trên đường Hùng Vương, đối tượng đi xe Exciter màu xanh, chạy hướng về chợ Cà Mau. Trong túi có điện thoại và giấy tờ tùy thân.',
    incident: [9.17982, 105.15221],
    reporterOffset: [0.00003, -0.00005],
    gpsAccuracy: 12,
    reportedAt: { daysAgo: 3, at: '10:30' },
    progress: [10, 30, 210],
  },
  {
    code: 'L5UZ1H',
    incidentType: 'traffic_accident',
    description:
      'Xe máy tự gây tai nạn khi tông vào dải phân cách trên Quốc lộ 1 đoạn qua phường Bạc Liêu, người điều khiển có biểu hiện say rượu, bị thương ở đầu.',
    incident: [9.29052, 105.71803],
    reporterOffset: [0.00072, 0.00055],
    gpsAccuracy: 15,
    reportedAt: { daysAgo: 4, at: '22:50' },
    progress: [4, 13, 95],
  },
  {
    code: 'S3GD7B',
    incidentType: 'other',
    description:
      'Ghe đánh cá bị chìm một phần tại cửa biển Sông Đốc do sóng lớn, 3 ngư dân đã bơi vào bờ an toàn, cần hỗ trợ kéo ghe và giữ tài sản.',
    incident: [9.04402, 104.82903],
    reporterOffset: [0.00121, -0.00064],
    gpsAccuracy: 24,
    reportedAt: { daysAgo: 5, at: '05:40' },
    progress: [6, 20, 180],
  },
  {
    code: 'V9NR4C',
    incidentType: 'fighting',
    description:
      'Hai hộ dân ở khóm 2 tranh chấp ranh đất, hai bên cầm gậy đe dọa nhau, có nguy cơ xảy ra xô xát.',
    incident: [8.76051, 104.98802],
    reporterOffset: [-0.00033, 0.00027],
    gpsAccuracy: 13,
    reportedAt: { daysAgo: 5, at: '13:15' },
    progress: [5, 15, 120],
  },
  {
    code: 'E6KT2P',
    incidentType: 'public_security',
    description:
      'Nhóm người lạ thường tụ tập ở bãi đất trống cuối đường Quang Trung vào ban đêm, nghi sử dụng ma túy, để lại nhiều ống tiêm.',
    incident: [9.17281, 105.16221],
    reporterOffset: null,
    gpsAccuracy: null,
    reportedAt: { daysAgo: 6, at: '20:15' },
    progress: [9, 26, 300],
  },
  {
    code: 'A1WQ5F',
    incidentType: 'traffic_accident',
    description:
      'Xe khách va chạm xe ba gác trên đường qua trung tâm xã Thới Bình, ba gác bị lật, hàng hóa đổ tràn mặt đường.',
    incident: [9.34621, 105.09453],
    reporterOffset: [0.00042, 0.00018],
    gpsAccuracy: 10,
    reportedAt: { daysAgo: 6, at: '09:05' },
    progress: [3, 12, 70],
  },
];
