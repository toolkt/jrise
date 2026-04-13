import ExcelJS from "exceljs";

const EXCEL_PATH = "/Volumes/Workspace/Development/CHAY/JRISE Statement MASTER File FY 2025-26 (Chay).xlsx";

async function main() {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.readFile(EXCEL_PATH);
    console.log("ExcelJS SUCCESS");
    console.log("Sheets:", wb.worksheets.map(s => s.name));
    
    const cl = wb.getWorksheet("Client List");
    if (cl) {
      console.log("\n=== Client List sheet ===");
      for (let r = 1; r <= 10; r++) {
        const row = cl.getRow(r);
        const vals = [];
        for (let c = 1; c <= 8; c++) vals.push(JSON.stringify(row.getCell(c).value));
        console.log(`Row ${r}: ${vals.join(" | ")}`);
      }
    } else {
      console.log("Client List sheet NOT FOUND. Available:", wb.worksheets.map(s => s.name));
    }

    const fySh = wb.getWorksheet("FY 25-26 Data");
    if (fySh) {
      console.log("\n=== FY 25-26 Data sheet ===");
      for (let r = 1; r <= 55; r++) {
        const row = fySh.getRow(r);
        const vals = [];
        for (let c = 1; c <= 9; c++) vals.push(JSON.stringify(row.getCell(c).value));
        const allEmpty = vals.every(v => v === 'null' || v === '""');
        if (!allEmpty) {
          console.log(`Row ${r}: ${vals.join(" | ")}`);
        }
      }
    } else {
      console.log("FY 25-26 Data sheet NOT FOUND");
    }
  } catch (err: any) {
    console.log("ExcelJS FAILED:", err.message?.substring(0, 300));
  }
}

main();
