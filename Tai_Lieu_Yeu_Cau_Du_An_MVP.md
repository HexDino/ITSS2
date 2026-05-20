# TÀI LIỆU YÊU CẦU DỰ ÁN (PROJECT REQUIREMENTS DOCUMENT - PRD)
## Nền Tảng Tích Hợp Kết Nối Cố Vấn (MentorHub) & Tuyển Dụng Công Nghệ (StuBiz)

---

### 1. TỔNG QUAN DỰ ÁN

#### 1.1. Bối cảnh dự án (Context)
Qua các cuộc khảo sát và phỏng vấn chuyên sâu (Problem Interview) với sinh viên các khối ngành Công nghệ Thông tin và Điện tử Viễn thông (đặc biệt là sinh viên năm 3, năm 4 đang chuẩn bị tốt nghiệp), nhóm dự án nhận thấy một khoảng cách cực kỳ lớn (Gap) giữa môi trường học thuật và thực tế doanh nghiệp. 
* **Tại trường học:** Sinh viên quen với việc làm bài tập lớn một cách độc lập hoặc làm nhóm nhỏ với quy trình lỏng lẻo, công nghệ cơ bản hoặc cũ kỹ.
* **Tại doanh nghiệp:** Quy trình vận hành thực tế cực kỳ nghiêm ngặt và phức tạp. Sinh viên khi đi thực tập hoặc mới ra trường phải đối mặt với "cú sốc quy trình" (Process Shock) như: Luồng làm việc Git phức tạp (Git Workflow/Git Flow), các quy ước lập trình khắt khe (Coding Conventions), quản lý tác vụ nghiêm ngặt bằng công cụ chuyên dụng (Jira/Trello), và các công nghệ mới chưa được cập nhật sâu trong nhà trường (như NestJS, AWS, Docker...).

Sự thiếu chuẩn bị này dẫn đến tâm lý hoang mang, áp lực, và tự ti (hội chứng kẻ giả mạo - Imposter Syndrome) ở sinh viên khi bước vào môi trường thực tế. Các giải pháp tự học hiện tại (YouTube, Udemy, AI) chỉ giải quyết được các lỗi kỹ thuật nhỏ lẻ trước mắt mà không thể đưa ra định hướng lộ trình nghề nghiệp dài hạn hoặc giải thích sâu sắc về cách vận hành hệ thống trong doanh nghiệp.

#### 1.2. Mục tiêu dự án (Objectives)
Dự án hướng đến việc xây dựng một **Nền tảng tích hợp All-in-One** nhằm giải quyết đồng thời hai bài toán cốt lõi:
1. **MentorHub:** Xây dựng một không gian mạng lưới (Network) an toàn và minh bạch để sinh viên kết nối trực tiếp với các tiền bối giàu kinh nghiệm (Senpai/Mentor) trong ngành nhằm học hỏi quy trình làm việc thực tế, giải quyết các lỗi kỹ thuật chuyên sâu và nhận tư vấn hướng nghiệp.
2. **StuBiz:** Kết nối sinh viên với các doanh nghiệp có nhu cầu tuyển dụng thực tập sinh hoặc kỹ sư trẻ, giúp rút ngắn thời gian và tăng cơ hội tiếp cận việc làm thực chiến.

Dựa trên kết quả phỏng vấn giải pháp (Solution Interview), giá trị giữ chân người dùng cốt lõi của ứng dụng nằm ở **giáo dục, tư vấn và kết nối cộng đồng (MentorHub)** chứ không chỉ đơn thuần là một bảng tin tuyển dụng truyền thống.

---

### 2. PHÂN TÍCH BÀI TOÁN & YÊU CẦU CỦA KHÁCH HÀNG

#### 2.1. Các "Nỗi đau" chính của người dùng mục tiêu (User Pain Points)
* **Gặp rào cản lớn về quy trình doanh nghiệp:** 82% sinh viên gặp khó khăn nghiêm trọng khi làm quen với Git workflow, quy ước viết commit, phân nhánh, và coding convention của công ty.
* **Bị ngợp trước công nghệ mới:** Các lỗi chuyên sâu về hệ thống (Docker, AWS) hoặc framework nâng cao khiến sinh viên bế tắc. Việc tự học qua tài liệu mạng tốn quá nhiều thời gian (81% sinh viên không hài lòng với việc tự bơi).
* **Thiếu tâm lý an toàn và khó tiếp cận người trợ giúp:** Sinh viên thực tập thường sợ làm phiền các Mentor bận rộn tại công ty, hoặc gặp phải Mentor quá nghiêm khắc, dẫn đến việc giấu dốt và làm đình trệ công việc. Họ sợ bị đánh giá là bất tài khi để lộ lỗ hổng kiến thức hoặc làm hỏng môi trường Production.
* **Mơ hồ về định hướng tương lai:** Sinh viên không biết các tập đoàn lớn cần tiêu chuẩn tuyển dụng cụ thể như thế nào để chuẩn bị lộ trình học tập tối ưu.

#### 2.2. Kỳ vọng của khách hàng đối với hệ thống (Customer Expectations)
* **Sự kết nối thực tế:** Cần một nền tảng chuyên biệt giúp kết nối với đúng người có kinh nghiệm trong lĩnh vực cần hỏi (ví dụ: Kỹ sư mạng, Full-stack developer).
* **Tính bảo mật và tâm lý an toàn (Psychological Safety):** Có cơ chế đặt câu hỏi hoặc thảo luận ẩn danh để sinh viên thoải mái chia sẻ sai lầm, thất bại hoặc các câu hỏi "ngô nghê" mà không sợ bị ảnh hưởng đến uy tín hay cơ hội việc làm.
* **Tính minh bạch (Trust & Transparency):** Thông tin hồ sơ của Mentor (kinh nghiệm, công ty đang làm việc, thế mạnh công nghệ) phải rõ ràng để sinh viên an tâm và tin tưởng khi kết nối.
* **Trải nghiệm mượt mà (UI/UX đồng nhất):** Hệ thống tích hợp cả hỏi đáp lẫn tìm việc phải nhất quán, trực quan, dễ thao tác và tiết kiệm thời gian.

---

### 3. CÁC ĐỐI TƯỢNG NGƯỜI DÙNG (USER PERSONAS & ROLES)

Hệ thống bao gồm 4 nhóm đối tượng người dùng chính với các vai trò và quyền hạn được định nghĩa rõ ràng:

#### 3.1. Sinh viên / Ứng viên (Student / Mentee / Job Seeker)
* **Đặc điểm:** Sinh viên các ngành kỹ thuật (IT, Điện tử viễn thông, Cơ điện tử...) đang tìm kiếm kiến thức thực tế, giải pháp sửa lỗi kỹ thuật hoặc cơ hội thực tập/việc làm.
* **Hành vi trên hệ thống:**
  * Tạo hồ sơ cá nhân và tải lên/đăng ký CV.
  * Tìm kiếm, tham gia và theo dõi các kênh/chủ đề thảo luận.
  * Đăng câu hỏi, đăng câu trả lời (chế độ công khai hoặc ẩn danh).
  * Tra cứu thông tin doanh nghiệp và nộp đơn ứng tuyển dự án/việc làm.
  * Xem hồ sơ chi tiết của Mentor và chat trực tiếp với Mentor khi được đồng ý.

#### 3.2. Cố vấn / Tiền bối (Mentor / Senpai / Industry Expert)
* **Đặc điểm:** Các kỹ sư đang làm việc tại các doanh nghiệp công nghệ, cựu sinh viên có nhiều kinh nghiệm thực chiến, mong muốn chia sẻ kiến thức hoặc hỗ trợ thế hệ đàn em.
* **Hành vi trên hệ thống:**
  * Tạo hồ sơ chuyên gia minh bạch (thông tin công ty, kỹ năng chuyên sâu, số năm kinh nghiệm).
  * Tham gia vào các kênh công nghệ theo thế mạnh cá nhân (ví dụ: kênh `#Docker`, `#NestJS`).
  * Trả lời các câu hỏi của sinh viên để xây dựng uy tín cá nhân trong cộng đồng.
  * Nhận tin nhắn trò chuyện trực tiếp (Chat) từ sinh viên để tư vấn sâu hoặc định hướng lộ trình.

#### 3.3. Doanh nghiệp tuyển dụng (Enterprise / Employer / Recruiter)
* **Đặc điểm:** Các bộ phận tuyển dụng hoặc quản lý dự án tại các công ty công nghệ có nhu cầu tìm kiếm nguồn nhân lực trẻ, thực tập sinh tiềm năng.
* **Hành vi trên hệ thống:**
  * Đăng ký và cập nhật trang thông tin doanh nghiệp (StuBiz profile).
  * Đăng tải các tin tuyển dụng, dự án thực tập, yêu cầu công việc (JD).
  * Tìm kiếm, sàng lọc ứng viên dựa trên hồ sơ và CV mà sinh viên đăng ký.
  * Quản lý các đơn ứng tuyển và phản hồi kết quả ứng tuyển cho sinh viên.

#### 3.4. Quản trị viên hệ thống (System Administrator / Admin)
* **Đặc điểm:** Đội ngũ vận hành nền tảng.
* **Hành vi trên hệ thống:**
  * Quản lý danh mục, phê duyệt và khởi tạo các kênh thảo luận công nghệ (Channels).
  * Kiểm duyệt nội dung, xử lý báo cáo vi phạm tiêu chuẩn cộng đồng để duy trì môi trường lành mạnh.
  * Quản lý người dùng (Sinh viên, Mentor, Doanh nghiệp) và phê duyệt tính xác thực của tài khoản Mentor/Doanh nghiệp.

---

### 4. DANH SÁCH CÁC TÍNH NĂNG CHI TIẾT CỦA HỆ THỐNG

Dựa trên việc tối ưu hóa vòng phản hồi MVP, các tính năng được phân rã thành hai phân hệ lớn tương ứng với hai giá trị cốt lõi của sản phẩm:

#### 4.1. Phân hệ Thảo luận & Kết nối Cố vấn (MentorHub Module)
Đây là phân hệ trọng tâm, thúc đẩy tương tác hàng ngày (DAU) của người dùng.

##### 4.1.1. Tính năng Tìm kiếm & Lọc kênh thảo luận (Channel Search & Filtering)
* **Mô tả:** Cho phép sinh viên nhanh chóng tìm thấy các không gian thảo luận phù hợp với nhu cầu.
* **Chi tiết kỹ thuật:**
  * Tìm kiếm kênh dựa trên từ khóa (ví dụ: tên công ty cụ thể, tên quy trình vận hành, hoặc thẻ công nghệ như `#GitFlow`, `#React`).
  * Bộ lọc kênh theo danh mục: Công nghệ (Frontend, Backend, DevOps), Quy trình (Git, Scrum), Định hướng nghề nghiệp.

##### 4.1.2. Tính năng Đăng tải nội dung vào kênh (Thread/Question Posting)
* **Mô tả:** Sinh viên hoặc Mentor có thể khởi tạo một chủ đề thảo luận hoặc đặt câu hỏi về lỗi kỹ thuật/quy trình trong kênh tương ứng.
* **Chi tiết kỹ thuật:** Hỗ trợ nhập tiêu đề, nội dung văn bản đi kèm gắn các thẻ hashtag công nghệ để hệ thống điều hướng thông minh.

##### 4.1.3. Tính năng Đăng câu trả lời chuyên sâu (Answer Posting & Anonymous Toggle)
* **Mô tả:** Người dùng (đặc biệt là Mentor và sinh viên khác) có thể đóng góp câu trả lời cho các câu hỏi đã đăng. Tính năng này tích hợp cơ chế ẩn danh để bảo vệ tâm lý an toàn cho người dùng.
* **Giao diện & Luồng xử lý chi tiết (Từ tài liệu vận hành MVP):**
  1. **Thành phần giao diện:**
     * Tiêu đề Pop-up hiển thị rõ ràng: "Viết câu trả lời".
     * Ô nhập liệu sử dụng bộ soạn thảo văn bản phong phú (Rich Text Editor) để người dùng có thể định dạng chữ hoặc chèn mã code trực quan (tối đa 40.000 ký tự).
     * Nút gạt chuyển đổi chế độ đăng (Toggle Switch On/Off) để chọn chế độ hiển thị danh tính:
       * **Chế độ mặc định (Off):** Đăng ở chế độ ẩn danh (Anonymous) - Hệ thống sẽ che giấu tên và ảnh đại diện thật của người đăng để họ thoải mái chia sẻ, tránh tâm lý e ngại.
       * **Chế độ kích hoạt (On):** Đăng công khai (Public) - Hiển thị đầy đủ tên tuổi và danh hiệu chuyên gia (nếu có) để tích lũy điểm uy tín.
     * Nút bấm "Hủy bỏ": Đóng pop-up và xóa dữ liệu đang nhập tạm thời.
     * Nút bấm "Đăng": Thực hiện gửi câu trả lời lên hệ thống.
  2. **Xử lý phía API Back-end:**
     * Sử dụng phương thức `POST` để gửi yêu cầu tạo mới câu trả lời.
     * Đầu vào (Payload) bắt buộc: `question_id` (khớp với bảng dữ liệu câu hỏi), `content` (nội dung câu trả lời), và `is_anonymous` (giá trị logic từ nút Toggle switch: true/false).
     * Hệ thống thực hiện kiểm tra tính hợp lệ (Validation): Nội dung không được để trống, không vượt quá giới hạn ký tự; giá trị switch phải đúng định dạng.
     * Đầu ra (Response): Nếu dữ liệu hợp lệ và lưu thành công, trả về thông báo phản hồi thành công (`message: "OK"`). Nếu có lỗi hệ thống hoặc dữ liệu không hợp lệ, trả về thông báo lỗi cụ thể (`message: "error"` kèm mã lỗi).

##### 4.1.4. Tính năng Minh bạch hồ sơ Cố vấn (Mentor Profile Transparency)
* **Mô tả:** Tính năng bổ sung quan trọng từ phản hồi của người dùng nhằm tăng độ tin cậy.
* **Chi tiết kỹ thuật:** Cho phép sinh viên bấm vào xem chi tiết hồ sơ của Mentor bao gồm: Tên, Công ty hiện tại, Vị trí/Chức vụ, Danh sách các kỹ năng được xác thực (Kỹ năng cứng/mềm), và các chủ đề thế mạnh mà Mentor có thể hỗ trợ.

##### 4.1.5. Tính năng Trò chuyện trực tiếp (Direct Chat)
* **Mô tả:** Hỗ trợ giao tiếp thời gian thực giữa sinh viên và Mentor để tư vấn sâu sau khi kết nối qua các luồng câu hỏi công khai.

#### 4.2. Phân hệ Tuyển dụng & Kết nối Doanh nghiệp (StuBiz Module)
Giúp sinh viên hiện thực hóa mục tiêu tìm kiếm việc làm sau khi đã nâng cao nhận thức quy trình.

##### 4.2.1. Hiển thị & Tìm kiếm thông tin doanh nghiệp (Company Directory & Search)
* **Mô tả:** Liệt kê danh sách các doanh nghiệp đối tác, hỗ trợ tìm kiếm công ty theo tên, địa điểm, quy mô hoặc lĩnh vực công nghệ cốt lõi.

##### 4.2.2. Tạo hồ sơ ứng viên & Đăng ký CV (Profile Creation & CV Registration)
* **Mô tả:** Sinh viên hoàn thiện thông tin cá nhân, cập nhật bảng kỹ năng, kinh nghiệm thực tế từ các bài tập lớn/dự án trường học và tải lên tệp tin CV (PDF).

##### 4.2.3. Nộp đơn ứng tuyển & Nhận dự án (Job Application Workflow)
* **Mô tả:** Sinh viên nhấn ứng tuyển vào các vị trí tin tuyển dụng (Internship/Junior Job) có sẵn trên hệ thống, theo dõi trạng thái của đơn ứng tuyển (Đã nhận đơn, Đang duyệt, Hẹn phỏng vấn, Kết quả).

---

### 5. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)

Để đảm bảo hệ thống vận hành ổn định và mang lại trải nghiệm tốt nhất cho người dùng, các tiêu chuẩn phi chức năng sau cần được tuân thủ nghiêm ngặt:
* **Hiệu năng & Độ phản hồi (Performance):** Thời gian tải trang và thực thi các thao tác cơ bản (như mở Pop-up viết câu trả lời, gửi bộ lọc kênh) phải dưới 2 giây. Các API tương tác thời gian thực như Chat phải có độ trễ cực thấp (dưới 500ms).
* **Trải nghiệm người dùng (UI/UX Consistency):** Giao diện phải được thiết kế đồng nhất về mặt font chữ, màu sắc chủ đạo, và hệ thống nút bấm. Cần sửa đổi triệt để các lỗi UI rời rạc giữa phân hệ hỏi đáp và tuyển dụng đã ghi nhận trong buổi phỏng vấn giải pháp lần 1.
* **Độ tin cậy & Bảo mật dữ liệu (Security & Privacy):** Cơ chế ẩn danh phải được bảo mật tuyệt đối ở tầng cơ sở dữ liệu để đảm bảo không ai (ngoại trừ quản trị viên cấp cao trong trường hợp vi phạm pháp luật) có thể truy ngược ra danh tính thật của người đăng bài ẩn danh. Toàn bộ CV và thông tin liên lạc của sinh viên chỉ hiển thị cho doanh nghiệp khi sinh viên chủ động nhấn nút ứng tuyển.

---

### 6. KẾ HOẠCH PHÁT TRIỂN & TIÊU CHÍ NGHIỆM THU MVP

#### 6.1. Phạm vi phiên bản MVP (MVP Scope)
Tập trung tối đa vào **Thách thức ② (Kết nối sinh viên với người có chuyên môn)** để kiểm chứng giả thuyết cốt lõi của mô hình kinh doanh xã hội này. Phiên bản MVP sẽ ưu tiên hoàn thiện luồng Thảo luận/Hỏi đáp công nghệ có tính năng ẩn danh trên phân hệ MentorHub và luồng hiển thị thông tin doanh nghiệp cơ bản trên StuBiz trước khi mở rộng các tính năng tự động hóa nâng cao (như cơ chế gợi ý việc làm bằng AI hay tổ chức Workshop).

#### 6.2. Tiêu chí nghiệm thu cốt lõi (Core Acceptance Criteria)
1. Người dùng có thể tìm kiếm kênh theo từ khóa chính xác và lọc ra danh sách thớt thảo luận liên quan mà không bị treo ứng dụng.
2. Sinh viên có thể mở Pop-up "Viết câu trả lời", nhập văn bản định dạng Rich text, gạt nút Toggle switch sang chế độ ẩn danh, và nhấn "Đăng" thành công; hệ thống lưu trữ đúng trạng thái ẩn danh và hiển thị bài đăng dưới tên "Người dùng ẩn danh".
3. API POST tạo câu trả lời hoạt động ổn định, thực hiện đầy đủ các bước kiểm tra ràng buộc ký tự (tối đa 40.000 ký tự) và trả về phản hồi `message: "OK"` cho Front-end trong điều kiện mạng bình thường.
4. Hồ sơ Mentor hiển thị đầy đủ thông tin minh bạch về kinh nghiệm và nơi làm việc, giải quyết được rào cản thiếu tin cậy từ phía người dùng thử nghiệm Mockup.
