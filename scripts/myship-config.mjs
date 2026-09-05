export const MYSHIP_CONFIG = Object.freeze({
  source: 'myship',
  sourceUrl: 'https://myship.7-11.com.tw/general/detail/GM2602274753732',
  storeId: 'GM2602274753732',
  imageBaseUrl: 'https://myship.7-11.com.tw',
});

// Only these source labels describe an option that cannot be selected. Names
// such as private-order or bundle wording remain valid when inventory exists.
export const UNAVAILABLE_NAME_SIGNALS = Object.freeze([
  '無庫存',
  '无库存',
  '不可選',
  '不可选',
  '售罄',
  '缺貨',
  '缺货',
  '暫停販售',
  '暂停贩售',
]);

export function hasUnavailableNameSignal(name) {
  const normalizedName = String(name || '').replace(/\s+/g, '');
  return UNAVAILABLE_NAME_SIGNALS.some((signal) => normalizedName.includes(signal.replace(/\s+/g, '')));
}
