import ExcelJS from "exceljs";

const EXCEL_PATH = "/Volumes/Workspace/Development/CHAY/JRISE Statement MASTER File FY 2025-26 (Chay).xlsx";

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(EXCEL_PATH);
  const fySh = wb.getWorksheet("FY 25-26 Data");
  if (fySh) {
    for (let r = 54; r <= 120; r++) {
      const row = fySh.getRow(r);
      const vals = [];
      for (let c = 1; c <= 9; c++) vals.push(JSON.stringify(row.getCell(c).value));
      const allEmpty = vals.every(v => v === 'null' || v === '""');
      if (!allEmpty) {
        console.log(`Row ${r}: ${vals.join(" | ")}`);
      }
    }
  }
}

main();
