import range from "node-range";

const paddingCell = {symbol: " ", locked: false, padding: true};
export const alphabet = makeAlphabet(
  "abcdefghijklmnopqrstuvwxyz0123456789 .-+|".split("")
);

export const blankAnswer = {
  nbCols: "",
  sentence: "",
  countries: "",
  animals: "",
  user2Password: "",
  user1Password: "",
  gridTotal: ""
};

export const identitySubstitution = alphabet.symbols.map(function (symbol) {
  return {symbol, locked: false};
});

export function makeDump (task, nCols) {
  const textLength = task.cipher_text.length;
  const nRows = Math.floor((textLength + nCols - 1) / nCols);
  const rowPerm = range(0, nRows).toArray();
  const colPerm = range(0, nCols).toArray();
  const substitution = identitySubstitution;
  return {nCols, nRows, rowPerm, colPerm, substitution, answer: blankAnswer};
}

export function initWorkspace (state, dump) {
  const cells = textToCells(alphabet, state.taskData.cipher_text);
  const workspace = {
    cells,
    mode: "rows",
    nColsTemp: dump.nCols,
    hPos: 0,
    vPos: 0,
    maxVisibleRows: 12,
    maxVisibleCols: 50,
    extraRenderedRows: 2,
    extraRenderedCols: 2,
    selectionHalo: 2 /* number of rows,cols visible around selection */
  };
  return updateWorkspace({...state, workspace}, dump);
}

export function updateWorkspace (state, dump) {
  dump = dump || state.dump;
  const workspace = {...state.workspace};
  state = {...state, dump, workspace};
  const {mode} = state.workspace;
  if (mode === "rows") {
    const frame = getVisibleFrame(state);
    const narrowFrame = getVisibleFrame(state, true);
    const rows = getRows(state, frame);
    workspace.view = {frame, narrowFrame, rows};
  } else if (mode === "cols") {
    const frame = getVisibleFrame(state);
    const narrowFrame = getVisibleFrame(state, true);
    const cols = getCols(state, frame);
    workspace.view = {frame, narrowFrame, cols};
  } else if (mode === "text") {
    const frame = getFullFrame(state);
    const rows = getRows(state, frame);
    workspace.view = {frame, rows};
  }
  return state;
}

function getFullFrame (state) {
  const {nCols, nRows} = state.dump;
  const firstRow = 0;
  const lastRow = nRows - 1;
  const firstCol = 0;
  const lastCol = nCols - 1;
  return {firstRow, lastRow, firstCol, lastCol};
}

function getVisibleFrame (state, narrow) {
  const {
    extraRenderedRows,
    extraRenderedCols,
    maxVisibleRows,
    maxVisibleCols
  } = state.workspace;
  const extraRows = narrow ? 0 : extraRenderedRows;
  const extraCols = narrow ? 0 : extraRenderedCols;
  const {hPos, vPos} = state.workspace;
  const {nCols, nRows} = state.dump;
  const firstRow = Math.max(0, vPos - extraRows);
  const lastRow = Math.min(nRows - 1, vPos + maxVisibleRows + extraRows);
  const firstCol = Math.max(0, hPos - extraCols);
  const lastCol = Math.min(nCols - 1, hPos + maxVisibleCols + extraCols);
  return {firstRow, lastRow, firstCol, lastCol};
}

function getRows (state, frame) {
  const {cells} = state.workspace;
  const {nCols, rowPerm, colPerm} = state.dump;
  const {firstRow, lastRow, firstCol, lastCol} = frame;
  const rows = [];
  range(firstRow, lastRow, true).forEach(function (y) {
    const row = rowPerm[y];
    const cols = [];
    range(firstCol, lastCol, true).forEach(function (x) {
      const col = colPerm[x];
      const index = row * nCols + col;
      const content = index < cells.length ? cells[index] : paddingCell;
      cols.push({key: col, content, x, y});
    });
    rows.push({key: row, cols, x1: firstCol, x2: lastCol, y});
  });
  return rows;
}

function getCols (state, frame) {
  const {cells} = state.workspace;
  const {nCols, rowPerm, colPerm} = state.dump;
  const {firstRow, lastRow, firstCol, lastCol} = frame;
  const cols = [];
  range(firstCol, lastCol, true).forEach(function (x) {
    const col = colPerm[x];
    const rows = [];
    range(firstRow, lastRow, true).forEach(function (y) {
      const row = rowPerm[y];
      const index = row * nCols + col;
      const content = index < cells.length ? cells[index] : paddingCell;
      rows.push({key: row, content, x, y});
    });
    cols.push({key: col, rows, x, y1: firstRow, y2: lastRow});
  });
  return cols;
}

export function makeAlphabet (symbols) {
  const size = symbols.length;
  var ranks = {};
  for (var iSymbol = 0; iSymbol < size; iSymbol++) {
    ranks[symbols[iSymbol]] = iSymbol;
  }
  return {symbols, size, ranks};
}

export function textToCells (alphabet, textStr) {
  const cells = [];
  for (let iSymbol = 0; iSymbol < textStr.length; iSymbol++) {
    const symbol = textStr.charAt(iSymbol);
    const rank = alphabet.ranks[symbol];
    if (rank !== undefined) {
      cells.push({rank});
    } else {
      cells.push({symbol});
    }
  }
  return cells;
}

export function arraySwap (array, i, j) {
  return {
    [i]: {$set: array[j]},
    [j]: {$set: array[i]}
  };
}

export function arrayRotate (array, fromPos, toPos) {
  if (fromPos === toPos) {
    return {};
  }
  const result = array.slice();
  const temp = result.splice(fromPos, 1);
  result.splice(toPos, 0, temp[0]);
  return {$set: result};
}

export function inversePermutation (perm) {
  const result = new Array(perm.length);
  perm.forEach(function (val, index) {
    result[val] = index;
  });
  return result;
}

export function inverseSubstitution (subst) {
  const result = new Array(alphabet.size);
  Object.keys(subst).forEach(function (clearSymbol) {
    const cipherSymbol = subst[clearSymbol];
    const cipherRank = alphabet.ranks[cipherSymbol];
    result[cipherRank] = {symbol: clearSymbol, locked: true};
  });
  return result;
}
