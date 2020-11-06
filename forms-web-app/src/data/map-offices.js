import * as lpas from 'lpas.json';

const mapLpas = (lpas) =>
  lpas.map((lpas) => ({
    value: lpas.name,
    text: lpas['official-name'],
  }));

export default mapLpas;
