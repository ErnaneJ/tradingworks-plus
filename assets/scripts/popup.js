function updateContent(document, data){
  console.log(data);
  updateTable(document, data.tableRows, data.workedTimes);
}

function updateTable(document, tableRows, workedTimes){
  const tableBody = document.getElementById('table-body');

  tableBody.innerHTML = tableRows.map((row, index) => {
    console.log(row, index)
    return (`<div class="table--row">
      <div class="table--item">${row[0]}</div>
      <div class="table--item">${row[1]}</div>
      <div class="table--item">${String(Math.floor(workedTimes[index].worked.workedMinutes/60)).padStart(2, '0')}:${String(workedTimes[index].worked.workedMinutes%60).padStart(2, '0')}</div>
    </div>` + (row[2] != "" ? `
    <div class="table--row">
      <div class="table--item break">
        ${String(Math.floor(workedTimes[index].break/60)).padStart(2, '0')}:${String(workedTimes[index].break%60).padStart(2, '0')}
      </div>
    </div>
    ` : ''))
}).join('');
}

// {
//   "workedHours": {
//     "0": {}
//   },
//   "workedTimes": [
//     {
//       "worked": {
//         "startInText": " 10:49",
//         "endInText": " __:__",
//         "workedMinutes": 43
//       },
//       "break": 0
//     }
//   ],
//   "totalWorkedTime": 43,
//   "totalBreakTime": 0,
//   "minutesToFinish": 317,
//   "tableRows": [
//     [
//       " 10:49",
//       " __:__",
//       ""
//     ]
//   ]
// }