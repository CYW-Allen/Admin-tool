import { Notify, exportFile } from 'quasar';
import papaparse from 'papaparse';
import { byIso } from 'country-code-lookup';

function downloadCsv(filename, data) {
  const isSuccess = exportFile(
    `${filename}.csv`,
    `\uFEFF${papaparse.unparse(data)}`,
    'text/csv',
  );

  if (!isSuccess) Notify.create('資料匯出失敗');
}

// formula https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_RGB_alternative
function hsl2Hex(hsl) {
  const { h, s, l } = hsl;
  const a = s * Math.min(h, 1 - h);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const colorVal = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));

    return Math.round(colorVal * 255).toString(16).padStart(2, '0');
  };

  return `#${f(0)}${f(8)}${f(4)}`;
}

function getRandomHexColor() {
  return hsl2Hex({
    h: Math.floor(Math.random() * 360),
    s: Math.floor(Math.random() * 100) * 0.01,
    l: 0.2,
  });
}

function getFontColorInBg(bgColor) {
  if (
    !bgColor.length || bgColor[0] !== '#'
    || (bgColor.length !== 4 && bgColor.length !== 7)
  ) {
    throw new Error('Invalid color value');
  }

  const colorVal = bgColor.length === 4
    ? `${bgColor[1]}${bgColor[1]}${bgColor[2]}${bgColor[2]}${bgColor[3]}${bgColor[3]}`
    : bgColor.slice(1);
  const rVal = parseInt(colorVal.substring(0, 2), 16);
  const gVal = parseInt(colorVal.substring(2, 4), 16);
  const bVal = parseInt(colorVal.substring(4, 6), 16);

  return ((rVal * 0.299 + gVal * 0.587 + bVal * 0.114) > 150) ? '#000000' : '#ffffff';
}

function transIso2Country(countryCode) {
  try {
    return byIso(countryCode).country;
  } catch (err) {
    console.log(`[transIso2Country] Error: ${err.message}`);
    return 'Not Found';
  }
}

function transformArr(arr) {
  return arr.reduce((result, e) => {
    result[0].push(e[0]);
    result[1].push(e[1]);
    return result;
  }, [[], []]);
}

export {
  getFontColorInBg, getRandomHexColor, transformArr, downloadCsv, transIso2Country,
};
