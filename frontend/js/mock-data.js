// Dữ liệu mô phỏng mẫu phục vụ kiểm thử hoạt ảnh độc lập.

window.NT101 = window.NT101 || {};

window.NT101.MockData = {
  rsaSamplePrimes: [
    [61, 53, 17],
    [67, 71, 13],
    [89, 97, 19],
    [101, 113, 23]
  ],
  defaults: {
    playfair: { key: 'MONARCHY', text: 'INSTRUMENTS' },
    rsa: { p: 61, q: 53, e: 17, text: 'NT101' },
    des: { key: 'NT101DES', iv: '12345678', text: 'An toan mang NT101' },
    aes: { key: 'NT101-SECRET-KEY', iv: '1234567890ABCDEF', text: 'An toan mang NT101' }
  }
};
