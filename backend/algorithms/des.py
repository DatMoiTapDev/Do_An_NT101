# Thuật toán DES.
# Phụ trách: Nguyễn Hữu Tiến Đạt.


def run(mode: str, payload: dict) -> dict:
    """Thực thi mã hoá hoặc giải mã DES.

    mode: 'encrypt' hoặc 'decrypt'
    payload: {'cipher_mode': 'CBC' | 'ECB', 'key': str, 'iv': str, 'text': str}
    Trả về dict gồm: {'result': str, 'metadata': dict, 'steps': list}
    """
    raise NotImplementedError("Chưa cài đặt logic DES bằng Python.")
