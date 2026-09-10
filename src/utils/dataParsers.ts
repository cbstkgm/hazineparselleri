import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export const parseCSVString = <T>(text: string): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    let lines = text.split(/\r?\n/);
    let startIndex = 0;
    let delimiter = ',';

    // Find the first line that looks like a header (contains delimiters)
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const semiCount = (lines[i].match(/;/g) || []).length;
      const commaCount = (lines[i].match(/,/g) || []).length;
      if (semiCount >= 3 || commaCount >= 3) {
        startIndex = i;
        delimiter = semiCount > commaCount ? ';' : ',';
        break;
      }
    }

    const validText = lines.slice(startIndex).join('\n');

    Papa.parse(validText, {
      delimiter: delimiter,
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => {
        const original = header.trim();
        const h = original
          .replace(/İ/g, 'i')
          .replace(/I/g, 'ı')
          .toLowerCase()
          .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u')
          .replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ç/g, 'c');

        const cleanH = h.replace(/[\s_]/g, '');

        if (cleanH === 'ilad' || cleanH === 'iladi' || cleanH === 'il') return 'ilad';
        if (cleanH === 'ilcead' || cleanH === 'ilceadi' || cleanH === 'ilce') return 'ilcead';
        if (cleanH === 'mahallead' || cleanH === 'mahalleadi' || cleanH === 'mahalle' || cleanH === 'mah') return 'mahallead';

        if (cleanH === 'thaihdasadano' || cleanH === 'thaada' || cleanH === 'thaadano' || cleanH === 'thaihdasada') return 'tha_ihdas_adano';
        if (cleanH === 'thaihdasparselno' || cleanH === 'thaparsel' || cleanH === 'thaparselno' || cleanH === 'thaihdasparsel') return 'tha_ihdas_parselno';

        if (cleanH === 'mukerreradano' || cleanH === 'mukerrerada') return 'mukerrer_adano';
        if (cleanH === 'mukerrerparselno' || cleanH === 'mukerrerparsel') return 'mukerrer_parselno';

        if (cleanH === 'adano' || cleanH === 'ada') return 'adano';
        if (cleanH === 'parselno' || cleanH === 'parsel') return 'parselno';

        if (cleanH === 'yuzolcum' || cleanH === 'alan' || cleanH === 'hesapalan') return 'yuzolcum';

        if (cleanH === 'islemtanimad' || cleanH === 'islemtanim') return 'islemtanimad';

        if (cleanH === 'kadbasvuruno' || cleanH === 'basvuruno') return 'kad_basvuruno';
        if (cleanH === 'kadbasvurualinmatarihi' || cleanH === 'basvurualinmatarihi') return 'kad_basvurualinmatarihi';
        if (cleanH === 'kadbasvuruolusturmatarihi' || cleanH === 'basvurutarihi') return 'kad_basvuru_olusturmatarihi';

        if (cleanH === 'kadfenkayitno' || cleanH === 'fenkayitno') return 'kad_fenkayitno';
        if (cleanH === 'kadfenkayittarih' || cleanH === 'fenkayittarihi') return 'kad_fenkayittarih';

        if (cleanH === 'taputesciltarih') return 'tapu_tesciltarih';
        if (cleanH === 'tesciltarih') return 'tesciltarih';
        if (cleanH === 'taputescilyevmiyeno' || cleanH === 'tescilyevmiyeno' || cleanH === 'yevmiyeno') return 'tescilyevmiyeno';
        if (cleanH === 'olusanparselid' || cleanH === 'parselid') return 'olusanparselid';

        if (cleanH === 'kesisenalanm2' || cleanH === 'kesisenalan') return 'kesisen_alan_m2';
        if (cleanH === 'durum' || cleanH === 'mukerrerparseldurum') return 'mukerrer_parsel_durum';
        if (cleanH === 'onaydurum' || cleanH === 'mukerrerparselonaydurum') return 'mukerrer_parsel_onaydurum';

        if (cleanH === 'mukerrerparselgeom') return 'mukerrer_parsel_geom';
        if (cleanH === 'thageom') return 'tha_geom';
        if (cleanH === 'wkt' || cleanH === 'geometry' || cleanH === 'geom' || cleanH === 'parselgeom') return 'geom';

        if (['tapualan', 'toplamalan(m2)', 'tokihissesi(m2)', 'imardurumu', 'satisbedeli', 'satisbirimbedeli', 'muhammenbedel', 'aciklama'].includes(cleanH)) return cleanH;

        return original;
      },
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          console.warn('CSV Parsing Warnings:', results.errors);
        }
        resolve(results.data as T[]);
      },
      error: (error: any) => {
        reject(error);
      }
    });
  });
};

export const parseFile = <T>(file: File): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      const readAsEncoding = (encoding: string): Promise<string> => {
        return new Promise((resolveReader, rejectReader) => {
          const reader = new FileReader();
          reader.onload = (e) => resolveReader(e.target?.result as string);
          reader.onerror = () => rejectReader(new Error('Dosya okunamadı'));
          reader.readAsText(file, encoding);
        });
      };

      readAsEncoding('UTF-8').then(text => {
        // If it failed to read UTF-8 properly (e.g. it's Turkish ANSI), it contains many replacement characters (\uFFFD)
        // We use a threshold > 10 to avoid failing the whole file due to a single corrupt byte.
        const replacementCount = (text.match(/\uFFFD/g) || []).length;
        if (replacementCount > 10) {
          readAsEncoding('windows-1254').then(res => parseCSVString<T>(res).then(resolve).catch(reject)).catch(reject);
        } else {
          parseCSVString<T>(text).then(resolve).catch(reject);
        }
      }).catch(reject);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          resolve(json as T[]);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error: any) => reject(error);
      reader.readAsBinaryString(file);
    } else {
      reject(new Error('Desteklenmeyen dosya formatı. Lütfen .csv veya .xlsx yükleyin.'));
    }
  });
};
