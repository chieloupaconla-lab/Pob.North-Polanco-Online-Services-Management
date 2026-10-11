import assert from "node:assert/strict";
import { test } from "node:test";
import { parseResidentCsv } from "@/lib/residentBulkImport";

test("parses quoted names containing commas", () => {
  const result = parseResidentCsv(
    'fullName,purok,active,archived\n"Paconla, Juan, Dela Cruz","Purok Rizal",true,false\n',
  );

  assert.equal(result.invalidRows.length, 0);
  assert.equal(result.validRecords[0]?.fullName, "Paconla, Juan, Dela Cruz");
  assert.equal(result.validRecords[0]?.purok, "Purok Rizal");
});

test("reports missing names and unsupported Puroks by CSV row", () => {
  const result = parseResidentCsv(
    "fullName,purok,active,archived\n,Purok Rizal,true,false\n\"Santos, Ana\",Purok Unknown,true,false\n",
  );

  assert.equal(result.invalidRows.length, 2);
  assert.deepEqual(result.invalidRows.map((issue) => issue.rowNumber), [2, 3]);
});

test("reports duplicate names and Puroks within one file", () => {
  const result = parseResidentCsv(
    'fullName,purok,active,archived\n"Santos, Ana",Purok Rizal,true,false\n"Santos,  Ana",purok rizal,true,false\n',
  );

  assert.equal(result.validRecords.length, 1);
  assert.deepEqual(result.duplicateRows.map((issue) => issue.rowNumber), [3]);
});
