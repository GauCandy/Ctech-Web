// Ghi chu: Ham tien ich cho phep chuyen gia tri ve chuoi hoac null khi rong.
function toNullableString(value) {
  if (value === undefined || value === null) {
    return null;
  }
  const str = String(value).trim();
  return str.length ? str : null;
}

module.exports = {
  toNullableString,
};
