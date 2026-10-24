# VNPolice Care — Kế hoạch quay video đầy đủ theo góc nhìn người dùng

## Goal

Quay một video sản phẩm liền mạch, ưu tiên giá trị người dùng thay vì kỹ thuật, thể hiện hai nhóm người dùng cùng thao tác trên một hệ thống thật:

1. **Người dân trên Mobile App** tìm thông tin an toàn tại Cà Mau, gửi đánh giá địa điểm, tạo tin báo có vị trí và ảnh hiện trường, nhận mã tin và theo dõi tiến độ.
2. **Cán bộ trực ban trên Admin Web** tiếp nhận đúng dữ liệu vừa phát sinh từ Mobile, kiểm tra bằng chứng, phân công đơn vị, cập nhật vòng đời tin báo, quản trị dữ liệu hiển thị trên Mobile và kiểm duyệt đánh giá.
3. **Người dân quay lại Mobile App** nhìn thấy trạng thái xử lý, đơn vị được phân công, lịch sử thao tác và nội dung vừa được Admin duyệt.

Mạch kể bắt buộc:

`Mobile tạo dữ liệu -> Admin tiếp nhận và vận hành -> Mobile nhận kết quả`

Thời lượng mục tiêu của bản đầy đủ: **11–13 phút**. Có thể dựng một bản rút gọn 3–5 phút từ cùng footage, nhưng không bỏ ba đoạn tạo dữ liệu, xử lý Admin và xác nhận ngược trên Mobile.

## Scope

### Mobile App — người dân (Phần mobile app phải quay được khung hình toàn diện iphone 6 pro thật nhìn chuyên nghiệp)

- Bản đồ an toàn Cà Mau.
- Tìm kiếm, lọc đơn vị công an, địa điểm ăn uống và dịch vụ.
- Xem chi tiết đơn vị công an.
- Xem chi tiết cơ sở và các đánh giá đã duyệt.
- Gửi đánh giá mới để chờ kiểm duyệt.
- Gửi tin báo: loại sự cố, vị trí, GPS thiết bị, mô tả, một ảnh hiện trường, xác nhận và gửi.
- Xem biên nhận, mã tin báo và ảnh đã tải lên.
- Xem lịch sử tin báo, trạng thái, đơn vị xử lý, bản đồ và timeline.
- Xem trang thông tin và các số khẩn cấp.

### Admin Web — cán bộ trực ban

- Đăng nhập nội bộ.
- Dashboard và hàng đợi tin báo.
- Tìm kiếm, lọc và mở đúng tin vừa tạo trên Mobile.
- Kiểm tra trường dữ liệu, tọa độ và ảnh hiện trường.
- Phân công đơn vị công an.
- Chuyển trạng thái đúng thứ tự: `Đã gửi -> Đã tiếp nhận -> Đang xử lý -> Đã giải quyết`.
- Quản trị danh mục đơn vị công an.
- Quản trị cơ sở/dịch vụ.
- Kiểm duyệt đánh giá vừa gửi từ Mobile.
- Đăng xuất.

### Ranh giới sản phẩm phải giữ đúng trong lời dẫn

- Đây là luồng **báo tin an ninh, trật tự và sự cố công cộng**, không phải hồ sơ bảo hiểm.
- Người dân gửi tin ẩn danh; hệ thống hiện không nhập họ tên, số điện thoại, biển số xe, hợp đồng bảo hiểm hoặc số tiền bồi thường.
- Mỗi tin báo hỗ trợ **một ảnh tùy chọn**, định dạng JPEG/PNG/WebP, tối đa 5 MiB.
- Đơn vị gần nhất chỉ là gợi ý khoảng cách; cán bộ trực ban mới thực hiện phân công.
- Video không được tuyên bố có tích hợp điều phối khẩn cấp hoặc hệ thống chính phủ bên ngoài.

## Bộ nội dung dùng xuyên suốt

Mọi cảnh phải dùng đúng một bộ nội dung dưới đây. Không thay tên, địa điểm hoặc mô tả giữa Mobile và Admin.

### C1 — Tìm đơn vị công an

| Trường | Nội dung |
|---|---|
| Từ khóa tìm kiếm | `Công an phường An Xuyên` |
| Kết quả cần mở | `Công an phường An Xuyên` |
| Nội dung cần cho thấy | Trạng thái xác minh, địa chỉ, số trực ban, tọa độ, bản đồ |
| Không thao tác | Không bấm gọi điện hoặc mở ứng dụng chỉ đường trong bản quay |

### C2 — Địa điểm và đánh giá của người dân

| Trường | Nội dung |
|---|---|
| Từ khóa tìm kiếm | `Cà phê Bến Gành Hào` |
| Cơ sở cần mở | `Cà phê Bến Gành Hào` |
| Tên hiển thị | `Nguyễn Minh Anh` |
| Điểm đánh giá | `5 sao` |
| Nội dung đánh giá | `Không gian thoáng, dễ tìm trên bản đồ; nhân viên hướng dẫn chỗ để xe rõ ràng. Cà phê muối vừa vị, phù hợp ngồi làm việc buổi chiều.` |
| Kết quả ngay sau gửi | Thông báo đánh giá đang chờ quản trị viên kiểm duyệt; chưa xuất hiện trong danh sách công khai |

Tên và nội dung trên là dữ liệu tổng hợp phục vụ quay video, không đại diện cho cá nhân thật.

### C3 — Tin báo giao thông

| Trường | Nội dung |
|---|---|
| Loại sự cố | `Tai nạn giao thông` |
| Vị trí sự cố | `9.176900, 105.152400` |
| Vị trí thiết bị | `9.176900, 105.152400` |
| Độ chính xác GPS mục tiêu | `±5 m` |
| Mô tả | `Khoảng 17:20, xe máy va chạm với ô tô tại nút giao đường Trần Hưng Đạo và Nguyễn Tất Thành, Phường 5, TP. Cà Mau. Một người bị trầy xước nhẹ; hai phương tiện đã đưa vào lề, giao thông đang di chuyển chậm.` |
| Ảnh | `apps/server/seed-assets/incidents/motorcycle-car-collision.jpg` |
| Đơn vị hệ thống dự kiến gợi ý | `Công an phường An Xuyên` |

Không thêm tên, số điện thoại, giấy tờ hoặc dữ liệu riêng tư của người bị nạn vào mô tả.

### C4 — Tài khoản Admin local

| Trường | Nội dung |
|---|---|
| Tên đăng nhập | `admin` |
| Mật khẩu | `DemoAdmin!2026` |
| Tên cán bộ hiển thị | `Trực ban Trung tâm Chỉ huy` |
| Avatar | Huy hiệu công an cục bộ tại `apps/admin/public/images/cong-an-hieu-avatar.jpg` |

Đây là tài khoản local dành cho môi trường quay; không đọc mật khẩu trong lời dẫn và không phóng to trường mật khẩu.

### C5 — Thao tác xử lý tin báo trên Admin

| Trường | Nội dung |
|---|---|
| Từ khóa tìm kiếm | Mã tin vừa sinh trên màn biên nhận, ký hiệu trong plan là `<REPORT_ID>` |
| Bộ lọc loại | `Tai nạn giao thông` |
| Bộ lọc trạng thái ban đầu | `Đã gửi` |
| Đơn vị phân công | `Công an phường An Xuyên` |
| Vòng đời | `Đã gửi -> Đã tiếp nhận -> Đang xử lý -> Đã giải quyết` |

`<REPORT_ID>` là giá trị hệ thống sinh thật. Không dựng sẵn hoặc thay bằng mã của bản ghi seed.

### C6 — Bản ghi đơn vị mới để minh họa quản trị danh mục

| Trường | Nội dung |
|---|---|
| Tên đơn vị | `Tổ tiếp nhận lưu động Phường 5` |
| Cấp hành chính | `Điểm hỗ trợ địa bàn` |
| Số trực đơn vị | Để trống vì đây là bản ghi tổng hợp chưa xác minh |
| Địa chỉ | `12 đường Trần Hưng Đạo, Phường 5, TP. Cà Mau` |
| Vĩ độ | `9.176600` |
| Kinh độ | `105.153100` |
| Đã xác minh dữ liệu | Bỏ chọn |
| Nguồn xác minh | Để trống |
| Đang hoạt động | Chọn |

Bản ghi cố ý ở trạng thái chưa xác minh: Mobile có thể hiển thị thông tin tham khảo nhưng hệ thống không dùng bản ghi này để gợi ý điều phối.

### C7 — Bản ghi dịch vụ mới để minh họa quản trị danh mục

| Trường | Nội dung |
|---|---|
| Tên cơ sở | `Trạm hỗ trợ xe máy An Tâm` |
| Loại | `Dịch vụ` |
| Địa chỉ | `126 đường Nguyễn Tất Thành, Phường 5, TP. Cà Mau` |
| Vĩ độ | `9.176150` |
| Kinh độ | `105.151980` |
| Nguồn dữ liệu | `Hồ sơ đăng ký của cơ sở` |
| Đã xác minh cơ sở | Bỏ chọn |
| Nguồn xác minh | Để trống |
| Đang hiển thị | Chọn |

Đây là dữ liệu tổng hợp phục vụ kịch bản, không được giới thiệu là cơ sở đã được cơ quan chức năng xác minh.

### C8 — Đánh giá cần kiểm duyệt

Admin phải tìm đúng card có đồng thời:

- Cơ sở: `Cà phê Bến Gành Hào`.
- Tác giả: `Nguyễn Minh Anh`.
- Điểm: `5/5`.
- Nội dung khớp C2.
- Trạng thái trước thao tác: `Chờ duyệt`.
- Thao tác: `Duyệt`.

## Chuẩn bị trước khi quay — không đưa vào footage

1. Chạy `npm run demo:reset` để có dữ liệu nền cố định.
2. Khởi động API bằng `npm run dev:server` và Admin bằng `npm run dev:admin`.
3. Build/cài release Mobile bằng `make ios-release IOS_DEVICE="iPhone 16 Pro"`.
4. Xóa dữ liệu ứng dụng cũ hoặc xác nhận tab **Tin đã báo** không còn credential từ lần quay trước.
5. Đặt Simulator tại `9.176900,105.152400` với độ chính xác gần `±5 m`.
6. Nạp ảnh C3 vào Photos của Simulator.
7. Mở Mobile tại tab **Bản đồ**; đóng bàn phím và mọi popup hệ thống.
8. Mở Admin tại trang đăng nhập trong một browser context sạch.
9. Tắt notification, con trỏ highlight, debug overlay, Metro/Xcode/terminal khỏi vùng quay.
10. Chuẩn bị clipboard cho C1, C2, C3, C6 và C7 để không gõ chậm hoặc sai chính tả.
11. Quay Mobile ở khung dọc tương đương `390 × 844`; quay Admin ở `1440 × 900`.
12. Bắt đầu quay chỉ sau khi API health trả về thành công và cả hai giao diện tải ổn định.

## Cấu trúc bản quay

| Phần | Bề mặt | Nội dung | Thời lượng mục tiêu |
|---|---|---|---:|
| 1 | Mobile App | Khám phá bản đồ, đơn vị, cơ sở và gửi đánh giá | 2:00–2:30 |
| 2 | Mobile App | Tạo và gửi tin báo có GPS + ảnh | 2:30–3:00 |
| 3 | Admin Web | Tiếp nhận, kiểm tra, phân công và xử lý tin | 2:30–3:00 |
| 4 | Admin Web | Quản trị đơn vị/cơ sở và kiểm duyệt đánh giá | 2:00–2:30 |
| 5 | Mobile App | Xác nhận dữ liệu Admin đã đồng bộ về người dân | 1:30–2:00 |
| 6 | Closing | Kết luận vòng lặp end-to-end | 0:10–0:15 |

## Flow 1 — Mobile App: người dân khám phá và tạo dữ liệu

### Chương 1 — Bản đồ an toàn và thông tin địa phương

| ID | Màn hình | Thao tác quay | Nội dung nhập | Kết quả bắt buộc nhìn thấy | Lời dẫn gợi ý | Thời lượng |
|---|---|---|---|---|---|---:|
| M01 | Bản đồ | Giữ khung hình toàn màn, sau đó lướt qua các bộ lọc **Tất cả / Công an / Ăn uống / Dịch vụ** | Không nhập | Tiêu đề Cà Mau, số lượng đơn vị/địa điểm, marker và CTA **Báo tin sự cố** | “Người dân bắt đầu từ bản đồ an toàn, nơi tập hợp đơn vị công an và các địa điểm đã được quản lý dữ liệu.” | 15–20 giây |
| M02 | Bản đồ — tìm đơn vị | Chọn bộ lọc **Công an**, nhập từ khóa, mở kết quả | C1 | Bottom sheet hiển thị tên, trạng thái xác minh, địa chỉ và số trực | “Tìm kiếm hỗ trợ tên, đường và phường/xã; trạng thái xác minh luôn được hiển thị rõ.” | 15–20 giây |
| M03 | Chi tiết đơn vị | Chọn **Xem thông tin chi tiết**, cuộn chậm qua các trường và bản đồ | Không nhập | Tên đơn vị, cấp hành chính, badge xác minh, địa chỉ, số trực, tọa độ, nguồn và hai CTA | “Người dân có thể kiểm tra nguồn, số trực và vị trí trước khi liên hệ.” | 20–25 giây |
| M04 | Bản đồ — tìm địa điểm | Quay lại bản đồ, chọn **Ăn uống**, tìm và mở cơ sở | Từ khóa C2 | Card của `Cà phê Bến Gành Hào`, điểm đánh giá, số lượt đánh giá và badge xác minh | “Thông tin cơ sở được tách biệt với đánh giá do cộng đồng đóng góp.” | 15–20 giây |
| M05 | Chi tiết cơ sở | Cuộn qua địa chỉ, nguồn dữ liệu và một vài đánh giá đã duyệt | Không nhập | Bản đồ, địa chỉ, nguồn, cảnh báo phân biệt dữ liệu xác minh và review cộng đồng | “Chỉ các đánh giá đã qua kiểm duyệt mới xuất hiện công khai.” | 20–25 giây |
| M06 | Form gửi đánh giá | Nhập tên, chọn 5 sao, dán nội dung rồi gửi | C2 | Nút **Gửi đánh giá** hoạt động; alert xác nhận đánh giá đang chờ kiểm duyệt; nội dung chưa xuất hiện ngay | “Người dùng gửi trải nghiệm thật; nội dung được đưa vào hàng đợi kiểm duyệt trước khi công khai.” | 25–35 giây |

### Chương 2 — Tạo tin báo sự cố

| ID | Màn hình | Thao tác quay | Nội dung nhập | Kết quả bắt buộc nhìn thấy | Lời dẫn gợi ý | Thời lượng |
|---|---|---|---|---|---|---:|
| M07 | Bản đồ | Quay về tab **Bản đồ**, bấm **Báo tin sự cố** | Không nhập | Màn chọn loại sự cố, tiến độ bước 1 | “Từ cùng bản đồ, người dân có thể tạo một tin báo mới.” | 10–15 giây |
| M08 | Chọn loại sự cố | Chọn **Tai nạn giao thông** | Loại trong C3 | Chuyển sang bước xác nhận vị trí | “Loại sự cố giúp trực ban phân loại nhanh ngay từ đầu.” | 8–12 giây |
| M09 | Xác nhận vị trí | Bấm **Dùng GPS của tôi**; giữ khung hình sau khi ghim xuất hiện | Tọa độ C3 | Ghim đỏ, GPS thiết bị, `Trong khu vực tiếp nhận Cà Mau`, độ chính xác và đơn vị gần nhất dự kiến | “Vị trí sự cố và vị trí thiết bị được lưu riêng, chỉ lấy GPS khi người dùng chủ động cho phép.” | 25–35 giây |
| M10 | Xác nhận vị trí | Bấm **Tiếp tục thêm chi tiết** | Không nhập | Màn **Kiểm tra và gửi tin**, tiến độ bước 3 | Không cần lời dẫn mới; để chuyển cảnh tự nhiên | 5–8 giây |
| M11 | Mô tả hiện trường | Dán mô tả vào textarea; đóng bàn phím rồi giữ 2 giây | Mô tả C3 | Đúng loại sự cố, tọa độ, trạng thái chia sẻ GPS và toàn bộ mô tả tiếng Việt | “Mô tả tập trung vào diễn biến, mức độ ảnh hưởng và tình trạng giao thông; không thu thập dữ liệu riêng tư không cần thiết.” | 25–30 giây |
| M12 | Ảnh hiện trường | Chọn **Chụp hoặc chọn ảnh -> Chọn từ thư viện**, chọn ảnh C3 | Ảnh C3 | Preview đúng ảnh, tên file, kích thước/dung lượng và nhãn **Sẵn sàng tải lên** | “Ảnh được xem lại trước khi gửi; ứng dụng chỉ nhận một ảnh tương thích, tối đa 5 MiB.” | 25–30 giây |
| M13 | Kiểm tra trước gửi | Cuộn chậm qua card sẵn sàng và lưu ý an toàn | Không nhập | Hai điều kiện loại/vị trí và ảnh được đánh dấu; cảnh báo 113/114/115 | “Người dùng kiểm tra lại toàn bộ nội dung và được nhắc không tiếp cận hiện trường nguy hiểm chỉ để chụp ảnh.” | 15–20 giây |
| M14 | Gửi tin | Bấm **Xác nhận và gửi tin báo** một lần | Không nhập | Progress upload tăng; không bấm lại; tự chuyển sang biên nhận | “Tin báo và ảnh được gửi trong một thao tác, đồng thời chống gửi trùng khi đang tải lên.” | 15–25 giây |
| M15 | Biên nhận | Giữ màn hình, cuộn đủ để thấy receipt và ảnh đã tải | Ghi lại mã sinh thật thành `<REPORT_ID>` | **Gửi tin báo thành công**, mã tin, loại, thời gian, tọa độ, trạng thái **Đã gửi**, đơn vị gợi ý và ảnh hiện trường | “Hệ thống sinh một mã tin và lưu quyền theo dõi riêng trên thiết bị đã gửi.” | 25–35 giây |
| M16 | Theo dõi ban đầu | Bấm **Theo dõi tin báo** | Không nhập | Timeline chỉ có mốc **Đã gửi tin báo**; các mốc sau ở trạng thái chưa đến bước | “Ngay sau khi gửi, người dân đã có một timeline minh bạch để theo dõi.” | 15–20 giây |
| M17 | Tab Thông tin | Mở tab **Thông tin**, cuộn nhẹ qua 113/114/115 và các cam kết dữ liệu | Không nhập | Ba số khẩn cấp, giải thích GPS, SecureStore và kiểm duyệt dữ liệu | “Ứng dụng bổ sung hướng dẫn khẩn cấp và giải thích rõ cách sử dụng vị trí, quyền truy cập và dữ liệu kiểm duyệt.” | 15–20 giây |

### Điểm handoff bắt buộc trước khi sang Admin

- `<REPORT_ID>` đã được chụp rõ ít nhất 2 giây và được copy chính xác.
- Ảnh hiện trường đã hiển thị trên biên nhận.
- Review C2 đã báo **đang chờ kiểm duyệt**.
- Không reset dữ liệu, không cài lại Mobile và không đổi browser context sau thời điểm này.

## Flow 2 — Admin Web: cán bộ trực ban vận hành dữ liệu người dân vừa tạo

### Chương 3 — Đăng nhập và tiếp nhận tin báo

| ID | Màn hình | Thao tác quay | Nội dung nhập | Kết quả bắt buộc nhìn thấy | Lời dẫn gợi ý | Thời lượng |
|---|---|---|---|---|---|---:|
| A01 | Đăng nhập | Nhập tài khoản C4 và bấm **Đăng nhập** | C4 | Vào shell quản trị; sidebar có avatar huy hiệu và tên trực ban | “Cán bộ trực ban truy cập qua phiên nội bộ được bảo vệ bằng cookie HttpOnly.” | 15–20 giây |
| A02 | Quản lý tin báo | Giữ dashboard 2–3 giây, cho thấy các count card và trạng thái đồng bộ | Không nhập | Tổng tin, Mới gửi, Đã tiếp nhận, Đang xử lý, Đã giải quyết và **Đang đồng bộ** | “Hàng đợi tự đồng bộ, giúp trực ban thấy tin mới mà không cần tải lại thủ công.” | 12–18 giây |
| A03 | Bộ lọc và tìm kiếm | Chọn loại/trạng thái rồi dán mã vừa sinh | C5 | Bảng chỉ còn đúng `<REPORT_ID>`; hàng có icon ảnh và tọa độ C3 | “Trực ban tìm đúng bản ghi vừa được người dân gửi, không chuyển sang một dữ liệu mẫu khác.” | 15–20 giây |
| A04 | Chi tiết tin báo | Bấm **Mở chi tiết**, cuộn từ map đến mô tả | Không nhập | Loại, thời gian, trạng thái, vị trí sự cố, vị trí thiết bị, GPS, đơn vị gợi ý và mô tả khớp C3 | “Mọi trường quan trọng được ánh xạ nhất quán từ Mobile sang màn hình vận hành.” | 25–35 giây |
| A05 | Bằng chứng | Giữ preview 2 giây, mở ảnh gốc trong tab mới rồi quay lại | Không nhập | Cùng ảnh C3, đúng tên file/dung lượng, không có broken image | “Bằng chứng không nằm trong thư mục public; Admin xem qua phiên đã xác thực.” | 15–20 giây |

### Chương 4 — Phân công và cập nhật vòng đời

| ID | Màn hình | Thao tác quay | Nội dung nhập | Kết quả bắt buộc nhìn thấy | Lời dẫn gợi ý | Thời lượng |
|---|---|---|---|---|---|---:|
| A06 | Drawer tin báo | Chọn đơn vị trong **Đơn vị được phân công** | `Công an phường An Xuyên` | Dropdown giữ đúng đơn vị sau khi request hoàn tất; bảng phía sau cập nhật | “Gợi ý khoảng cách hỗ trợ quyết định, còn phân công cuối cùng thuộc cán bộ trực ban.” | 15–20 giây |
| A07 | Drawer tin báo | Bấm **Chuyển sang “Đã tiếp nhận”** | Không nhập | Badge thành **Đã tiếp nhận**; timeline thêm actor `Trực ban Trung tâm Chỉ huy` | “Tin được xác nhận đã tiếp nhận và ghi lại người thao tác.” | 15–20 giây |
| A08 | Drawer tin báo | Dùng một cut ngắn để biểu thị thời gian nghiệp vụ, sau đó bấm **Chuyển sang “Đang xử lý”** | Không nhập | Badge và timeline thêm mốc **Đang xử lý** | “Sau khi đơn vị bắt đầu xử lý, trạng thái tiếp tục được cập nhật theo đúng thứ tự.” | 12–18 giây |
| A09 | Drawer tin báo | Dùng cut thứ hai, bấm **Chuyển sang “Đã giải quyết”** | Không nhập | Badge **Đã giải quyết**, resolved box và đủ bốn dòng timeline | “Khi hoàn tất, tin báo đạt trạng thái cuối và toàn bộ lịch sử vẫn được giữ lại.” | 15–20 giây |

Không quay ba lần chuyển trạng thái như ba click tức thời. Dùng chapter card hoặc dissolve 0,5–1 giây giữa các mốc để truyền đạt đây là vòng đời được rút gọn cho video.

### Chương 5 — Quản trị dữ liệu hiển thị cho người dân

| ID | Màn hình | Thao tác quay | Nội dung nhập | Kết quả bắt buộc nhìn thấy | Lời dẫn gợi ý | Thời lượng |
|---|---|---|---|---|---|---:|
| A10 | Đơn vị công an | Mở module, giữ danh sách hiện có, sau đó chọn **Thêm đơn vị** | C6 | Form hiển thị đủ trường bắt buộc, tọa độ và bản đồ | “Admin quản lý riêng trạng thái hoạt động và xác minh của từng đơn vị.” | 15–20 giây |
| A11 | Form đơn vị | Điền C6, kiểm tra `Đã xác minh` bỏ chọn và `Đang hoạt động` được chọn, rồi lưu | C6 | Modal đóng; bản ghi mới xuất hiện với **Chưa xác minh** và **Đang bật** | “Bản ghi chưa có nguồn xác minh vẫn được gắn nhãn rõ và không được dùng để gợi ý điều phối.” | 35–45 giây |
| A12 | Cơ sở & dịch vụ | Mở module, giữ lưới dữ liệu, chọn **Thêm cơ sở** | C7 | Form có loại, địa chỉ, tọa độ, nguồn dữ liệu và trạng thái xác minh | “Dữ liệu cơ sở được quản trị độc lập với nội dung đánh giá của cộng đồng.” | 15–20 giây |
| A13 | Form cơ sở | Điền C7, giữ `Đã xác minh` bỏ chọn và `Đang hiển thị` được chọn, rồi lưu | C7 | Card `Trạm hỗ trợ xe máy An Tâm` xuất hiện với loại **Dịch vụ** và **Chưa xác minh** | “Nguồn dữ liệu và trạng thái xác minh luôn đi cùng bản ghi được công khai.” | 35–45 giây |
| A14 | Kiểm duyệt đánh giá | Mở **Đánh giá**, giữ bộ lọc **Chờ duyệt**, tìm card C8 | C8 | Card đúng cơ sở, tác giả, điểm và nội dung từ Mobile | “Đánh giá người dùng đi vào hàng đợi kiểm duyệt thay vì xuất hiện ngay.” | 20–25 giây |
| A15 | Kiểm duyệt đánh giá | Bấm **Duyệt** đúng card C8 | Không nhập | Card rời hàng đợi chờ duyệt; khi chuyển bộ lọc **Đã duyệt**, card xuất hiện | “Sau khi duyệt, nội dung đủ điều kiện hiển thị trở lại trên Mobile.” | 15–20 giây |
| A16 | Sidebar | Giữ avatar/tên trực ban 2 giây; chưa đăng xuất nếu còn quay xác nhận | Không nhập | Avatar huy hiệu và danh tính trực ban rõ nét | Không cần lời dẫn; dùng làm nhịp chuyển về Mobile | 5–8 giây |

## Flow 3 — Mobile App: người dân nhận kết quả từ Admin

Trước phần này, đưa Mobile app về foreground hoặc đóng/mở lại app để các query công khai lấy dữ liệu mới. Không xóa SecureStore vì credential của `<REPORT_ID>` phải còn nguyên.

| ID | Màn hình | Thao tác quay | Nội dung nhập | Kết quả bắt buộc nhìn thấy | Lời dẫn gợi ý | Thời lượng |
|---|---|---|---|---|---|---:|
| M18 | Tin đã báo | Mở tab **Tin đã báo**, chờ đồng bộ, giữ card của `<REPORT_ID>` | Không nhập | Tổng tin, badge **Đã giải quyết**, đơn vị `Công an phường An Xuyên`, badge **Có ảnh** | “Không cần nhập lại mã: quyền theo dõi đã được lưu an toàn trên thiết bị gửi tin.” | 15–20 giây |
| M19 | Theo dõi tin báo | Mở card `<REPORT_ID>`, giữ phần timeline | Không nhập | Đủ bốn mốc; các mốc Admin có actor `Trực ban Trung tâm Chỉ huy` và timestamp | “Người dân nhìn thấy toàn bộ tiến độ thực tế, người cập nhật và thời điểm xử lý.” | 25–35 giây |
| M20 | Theo dõi tin báo | Cuộn qua bản đồ, ảnh và thông tin đã gửi | Không nhập | Vị trí sự cố, marker đơn vị xử lý, ảnh C3, tọa độ, mô tả và đơn vị phân công | “Dữ liệu gốc không bị thay đổi khi trạng thái vận hành được cập nhật.” | 20–30 giây |
| M21 | Bản đồ — dữ liệu từ Admin | Quay về bản đồ; tìm lần lượt hai tên mới | `Tổ tiếp nhận lưu động Phường 5`, sau đó `Trạm hỗ trợ xe máy An Tâm` | Hai bản ghi xuất hiện; badge **Chưa xác minh** đúng với C6/C7 | “Danh mục do Admin quản lý được đồng bộ ra bản đồ, đồng thời giữ nguyên nhãn xác minh để người dân hiểu mức độ tin cậy.” | 25–35 giây |
| M22 | Chi tiết cơ sở | Tìm lại `Cà phê Bến Gành Hào`, mở chi tiết và cuộn đến đánh giá mới | Từ khóa C2 | Review `Nguyễn Minh Anh`, 5 sao và nội dung C2 xuất hiện sau khi Admin duyệt | “Vòng kiểm duyệt hoàn tất: nội dung chỉ được công khai sau quyết định của cán bộ quản trị.” | 20–30 giây |
| M23 | Thông tin | Mở tab **Thông tin**, giữ CTA 113/114/115 và thông điệp an toàn | Không nhập | Ba số khẩn cấp và giải thích bảo mật | “VNPolice Care bổ trợ kết nối thông tin; trong tình huống nguy hiểm, người dân vẫn được hướng dẫn gọi số khẩn cấp.” | 12–18 giây |
| M24 | Closing | Fade sang title card | Không nhập | Dòng kết: `Người dân gửi tin -> Trực ban xử lý -> Người dân theo dõi kết quả` | “Một luồng thống nhất từ người dân đến trung tâm tiếp nhận và trở lại thiết bị ban đầu.” | 10–15 giây |

Sau cảnh M24 mới quay lại Admin và bấm **Đăng xuất** nếu cần một shot kết thúc phụ. Không đặt thao tác đăng xuất giữa A16 và M18 vì sẽ làm đứt nhịp câu chuyện.

## Quy tắc quay và dựng

### Mobile

- Giữ nguyên orientation dọc; không resize Simulator trong footage.
- Mỗi CTA chỉ bấm một lần; không quay double tap hoặc retry nếu không phải chủ đề của cảnh.
- Với text dài C2/C3, dùng clipboard để dán, sau đó đóng bàn phím và giữ màn hình đủ lâu để đọc.
- Không cuộn quá nhanh. Một card quan trọng phải dừng ít nhất 1,5–2 giây.
- Không mở thật ứng dụng Điện thoại, Apple Maps hoặc camera nếu chúng không nằm trong mạch chính.
- Không để ảnh, thông báo hoặc dữ liệu cá nhân khác xuất hiện trong Photos picker.

### Admin Web

- Dùng viewport cố định `1440 × 900`, zoom 100%.
- Không hiển thị DevTools, network panel hoặc URL chứa token.
- Khi PATCH/POST đang chạy, chờ nút hết trạng thái busy và UI hiển thị kết quả rồi mới thao tác tiếp.
- Trong drawer tin báo, luôn quay mô tả và ảnh trước khi phân công hoặc đổi trạng thái.
- Chỉ duyệt đúng review C8; không thao tác các review seed khác.
- Bản ghi C6/C7 phải giữ trạng thái **chưa xác minh** để không trình bày dữ liệu tổng hợp như thông tin đã được chứng thực.


## Những nội dung không đưa vào video sản phẩm

- Terminal, lệnh reset, build log, Xcode, Metro hoặc Playwright report.
- Lỗi `Promise.withResolvers`, lỗi cài `.app` hoặc các bước debug đã hoàn tất.
- Payload API, access token, cookie hoặc nội dung SQLite.
- Dữ liệu seed không liên quan đến câu chuyện chính.
- Thử sai mật khẩu, validation lỗi, ảnh quá dung lượng hoặc mất mạng.
- Các trường khách hàng, phương tiện, bảo hiểm hoặc bồi thường vì sản phẩm không có các domain này.

## Recovery nếu take bị lỗi

1. Dừng và bỏ take lỗi; không nối một cảnh có trạng thái dữ liệu không còn khớp.
2. Chạy lại `npm run demo:reset`.
3. Xóa dữ liệu Mobile hoặc cài lại release app để loại credential/report của take cũ.
4. Xóa cookie Admin hoặc đăng xuất.
5. Nạp lại ảnh C3 và đặt lại vị trí Simulator.
6. Xác nhận review C2 chưa tồn tại, C6/C7 chưa tồn tại và hàng đợi chưa có report của take mới.
7. Rehearse nhanh M07–M16, A03–A09 và M18–M20 trước khi quay lại từ đầu.

## Validation

- **KHI** người dân gửi đánh giá C2, **THÌ** Mobile phải báo chờ kiểm duyệt và đánh giá chưa được hiển thị công khai trước thao tác A15.
- **KHI** người dân gửi tin C3, **THÌ** biên nhận phải hiển thị một `<REPORT_ID>` mới, trạng thái `Đã gửi`, đơn vị gợi ý và đúng ảnh C3.
- **KHI** Admin tìm `<REPORT_ID>`, **THÌ** chỉ đúng bản ghi vừa tạo phải còn lại trong bảng và mọi trường/ảnh phải khớp Mobile.
- **KHI** Admin phân công C5, **THÌ** drawer và Mobile phải cùng hiển thị `Công an phường An Xuyên`.
- **KHI** Admin hoàn thành ba lần chuyển trạng thái hợp lệ, **THÌ** report phải đạt `Đã giải quyết` và timeline phải có đủ bốn mốc theo đúng thứ tự.
- **KHI** Mobile mở lại report, **THÌ** trạng thái, actor, timestamp, đơn vị, tọa độ, mô tả và ảnh phải còn đầy đủ sau đồng bộ.
- **KHI** Admin tạo C6/C7, **THÌ** Mobile phải tìm thấy hai bản ghi và hiển thị chúng là chưa xác minh.
- **KHI** Admin duyệt C8, **THÌ** Mobile phải hiển thị đúng tác giả, 5 sao và nguyên văn nội dung C2 trên `Cà phê Bến Gành Hào`.
- **KHI** xem video hoàn chỉnh, **THÌ** không được có console/debug UI, request lỗi, ảnh vỡ, loading treo, dữ liệu placeholder, thông tin cá nhân thật hoặc gián đoạn continuity của `<REPORT_ID>`.
- **KHI** xuất file cuối, **THÌ** video phải tối thiểu 1920 × 1080, H.264/yuv420p/fast-start cho MP4, có chapter Mobile/Admin/Mobile confirmation và phát hết file không lỗi giải mã.
