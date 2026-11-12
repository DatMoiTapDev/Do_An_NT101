# Thuật toán AES.
# Phụ trách: Nguyễn Hữu Tiến Đạt.


def run(mode: str, payload: dict) -> dict:
    """Thực thi mã hoá hoặc giải mã AES.

    mode: 'encrypt' hoặc 'decrypt'
    payload: {'cipher_mode': 'CBC' | 'ECB', 'key': str, 'iv': str, 'text': str}
    Trả về dict gồm: {'result': str, 'metadata': dict, 'steps': list}
    """
    raise NotImplementedError("Chưa cài đặt logic AES bằng Python.")
