# Đồ Án Môn Học NT101 — Ứng Dụng Thực Thi và Minh Hoạ Các Giải Thuật Mật Mã

Ứng dụng chạy cục bộ trên máy tính cá nhân nhằm thực thi và mô phỏng trực quan ba nhóm giải thuật mật mã học:
1. Mã hoá PlayFair
2. Mã hoá RSA
3. Mã hoá DES và AES

---

## 1. Kiến trúc hệ thống và luồng hoạt động

- **Tầng xử lý thuật toán:** Xây dựng bằng ngôn ngữ Python. Mỗi thuật toán được tách thành một module độc lập, tiếp nhận dữ liệu đầu vào và trả về kết quả cuối cùng cùng danh sách trạng thái từng bước để phục vụ mô phỏng.
- **Tầng giao diện người dùng:** Xây dựng bằng HTML, CSS và JavaScript thuần. Ứng dụng hoạt động hoàn toàn ngoại tuyến với ba nút lựa chọn thuật toán chính.

### Luồng tương tác trên giao diện
1. Người dùng chọn một trong ba thuật toán: **PlayFair**, **RSA**, hoặc **DES & AES**.
2. Hệ thống hiển thị vùng nhập dữ liệu đầu vào và cấu hình khoá tương ứng.
3. Khi nhấn nút chạy thuật toán, hệ thống trả về đáp án ngay lập tức và tự động phát hoạt ảnh mô phỏng từng bước xử lý.
4. Thanh điều khiển hỗ trợ tạm dừng, tiếp tục, chuyển tới bước tiếp theo hoặc quay lại bước trước tuỳ theo nhu cầu quan sát ở từng thuật toán.

---

## 2. Cấu trúc thư mục và phân công tệp mã nguồn

```text
Do_An_NT101/
├── README.md
├── .gitignore
├── DoAn_NT101.exe
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── algorithms/
│       ├── __init__.py
│       ├── playfair.py
│       ├── rsa.py
│       ├── des.py
│       └── aes.py
└── frontend/
    ├── index.html
    ├── css/
    │   └── style.css
    └── js/
        ├── main.js
        ├── mock-data.js
        └── animators/
            ├── playfair-anim.js
            ├── rsa-anim.js
            └── symmetric-anim.js
```

### Bảng phân công chi tiết

| Đường dẫn tệp | Chức năng chính | Thành viên phụ trách |
| :--- | :--- | :--- |
| `DoAn_NT101.exe` | Tệp thực thi đóng gói ứng dụng trên Windows, cho phép nhấp đúp để khởi chạy trực tiếp mà không cần thao tác với terminal. | Dùng chung |
| `backend/algorithms/playfair.py` | Cài đặt thuật toán PlayFair gồm dựng ma trận 5×5, chuẩn hoá chuỗi theo cặp, mã hoá, giải mã và xuất dữ liệu từng bước. | Lê Quang Huy |
| `backend/algorithms/rsa.py` | Cài đặt thuật toán RSA gồm kiểm tra số nguyên tố, sinh cặp khoá, mã hoá, giải mã và xuất dữ liệu tính toán theo từng bước. | Ngô Đình Khôi |
| `backend/algorithms/des.py` | Cài đặt thuật toán DES trên khối 64-bit, sinh 16 khoá con, thực thi mạng Feistel 16 vòng và xuất dữ liệu từng vòng. | Nguyễn Hữu Tiến Đạt |
| `backend/algorithms/aes.py` | Cài đặt thuật toán AES trên ma trận trạng thái 4×4 gồm các phép biến đổi `SubBytes`, `ShiftRows`, `MixColumns`, `AddRoundKey` và xuất dữ liệu từng vòng. | Nguyễn Hữu Tiến Đạt |
| `backend/app.py` | Khởi chạy máy chủ Python cục bộ, phục vụ giao diện HTML và cung cấp API kết nối tới các module thuật toán. | Dùng chung |
| `backend/requirements.txt` | Liệt kê các gói thư viện Python cần thiết cho máy chủ. | Dùng chung |
| `frontend/index.html` | Giao diện chính chứa ba nút chọn thuật toán, biểu mẫu nhập liệu, khung hiển thị đáp án và sân khấu hoạt ảnh. | Giao diện chung |
| `frontend/css/style.css` | Quy định bảng màu, kiểu chữ, bố cục trang và các hiệu ứng chuyển động CSS. | Giao diện chung |
| `frontend/js/main.js` | Xử lý chuyển đổi giữa ba thuật toán, gửi dữ liệu tới Python, hiển thị kết quả và điều phối tự động phát hoạt ảnh cùng các nút điều khiển. | Giao diện chung |
| `frontend/js/animators/playfair-anim.js` | Kết xuất hoạt ảnh dựng ma trận 5×5 và đường nối biến đổi từng cặp ký tự cho PlayFair. | Giao diện chung |
| `frontend/js/animators/rsa-anim.js` | Kết xuất hoạt ảnh quy trình sinh khoá và phép tính luỹ thừa mô-đun cho RSA. | Giao diện chung |
| `frontend/js/animators/symmetric-anim.js` | Kết xuất hoạt ảnh mạng Feistel cho DES và ma trận trạng thái 4×4 cho AES. | Giao diện chung |
| `frontend/js/mock-data.js` | Lưu trữ dữ liệu mô phỏng mẫu phục vụ kiểm thử hoạt ảnh độc lập trên trình duyệt. | Giao diện chung |

---

## 3. Chuẩn dữ liệu trao đổi giữa Python và giao diện

Mỗi hàm thực thi trong `backend/algorithms/` trả về một đối tượng JSON theo cấu trúc thống nhất:

```python
{
    "algorithm": "playfair",
    "mode": "encrypt",
    "result": "Chuỗi kết quả cuối cùng",
    "metadata": {},
    "steps": [
        {
            "step_index": 1,
            "title": "Tiêu đề bước xử lý",
            "description": "Mô tả trạng thái biến đổi tại bước hiện tại",
            "state": {}
        }
    ]
}
```
