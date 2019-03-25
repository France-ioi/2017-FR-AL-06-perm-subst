
import runTask from 'alkindi-task-lib';
import update from 'immutability-helper';
import range from 'node-range';
import {select, takeLatest, takeEvery, put} from 'redux-saga/effects';
import {DragDropContext} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import {eventChannel} from 'redux-saga';

import 'font-awesome/css/font-awesome.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'rc-tooltip/assets/bootstrap.css';
import './style.css';

import Intro from './intro';
import AnswerBundle from './answer';
import {Workspace} from './workspace';

const isDevel = process.env.NODE_ENV !== 'production';

export function run (container, options) {
  options = {...options, wrapper: App => DragDropContext(HTML5Backend)(App)};
  runTask(container, options, TaskBundle);
};

function TaskBundle (bundle, deps) {

/*
  bundle.addEarlyReducer(function (state, action) {
    console.log('before', action.type, action, state && state.view);
    return state;
  });
  bundle.addLateReducer(function (state, action) {
    console.log('after', action.type, action, state && state.view);
    return state;
  });
*/

  /*** Start of required task definitions ***/

  const workspaceOperations = {
    taskLoaded,
    taskUpdated,
    workspaceLoaded,
    dumpWorkspace,
    isWorkspaceReady
  };

  bundle.addReducer('init', function (state, action) {
    return {
      ...state,
      workspaceOperations,
      submitAnswer: {},
      showSolve: false
    };
  });


  const WorkspaceActions = bundle.pack('submitAnswer', 'SaveButton',
    'gridMounted', 'gridScrolled', 'resizeGrid', 'gridResized',
    'colSelected', 'rowSelected', 'modeChanged', 'rowMoved', 'colMoved',
    'substItemsSwapped', 'substItemLocked', 'cipherTextChanged',
    'solveSubst', 'solvePerm', 'Answer'
  );
  console.log('WorkspaceActions :', WorkspaceActions);
  bundle.defineView('Workspace', WorkspaceSelector, Workspace(WorkspaceActions));

  bundle.defineAction('modeChanged', 'Grid.Mode.Changed');
  bundle.addReducer('modeChanged', function (state, action) {
    const {mode} = action;
    return updateWorkspace(update(state,
      {workspace: {mode: {$set: mode}}}));
  });

  bundle.defineAction('gridMounted', 'Grid.Mounted');
  bundle.addReducer('gridMounted', function (state, action) {
    const {grid} = action;
    return update(state, {workspace: {grid: {$set: grid}}});
  });

  bundle.defineAction('gridScrolled', 'Grid.Scrolled');
  bundle.addReducer('gridScrolled', function (state, action) {
    const {hPos, vPos} = action;
    state = update(state, {
      workspace: {
        hPos: {$set: hPos},
        vPos: {$set: vPos}
      }
    });
    if (state.workspace.mode === 'text') {
      /* updateWorkspace is not needed in text mode */
      return state;
    }
    return updateWorkspace(state);
  });

  bundle.defineAction('resizeGrid', 'Grid.Resize');
  bundle.addReducer('resizeGrid', function (state, action) {
    const {nCols} = action;
    return update(state, {workspace: {nColsTemp: {$set: nCols}}});
  });

  bundle.defineAction('gridResized', 'Grid.Resized');
  bundle.addReducer('gridResized', function (state, action) {
    const {nCols} = action;
    const dump = makeDump(state.task, nCols);
    /* Preserve the substitution. */
    dump.substitution = state.dump.substitution;
    return updateWorkspace(update(state, {
      dump: {$set: dump},
      workspace: {nColsTemp: {$set: nCols}}
    }));
  });

  bundle.defineAction('rowSelected', 'Grid.Row.Selected');
  bundle.addReducer('rowSelected', function (state, action) {
    const {row} = action;
    function toggleSelection (prev) {
      return row === prev ? undefined : row;
    }
    /* updateWorkspace is not needed */
    return update(state,
      {workspace: {selectedRow: {$apply: toggleSelection}}});
  });

  bundle.defineAction('colSelected', 'Grid.Col.Selected');
  bundle.addReducer('colSelected', function (state, action) {
    const {col} = action;
    function toggleSelection (prev) {
      return col === prev ? undefined : col;
    }
    /* updateWorkspace is not needed */
    return update(state,
      {workspace: {selectedCol: {$apply: toggleSelection}}});
  });

  bundle.defineAction('rowMoved', 'Grid.Row.Moved');
  bundle.addReducer('rowMoved', function (state, action) {
    const {nRows, rowPerm} = state.dump;
    const {row, direction, position} = action;
    let perm, newRow;
    if (typeof direction === 'number') {
      newRow = row + direction;
      if (newRow < 0 || newRow >= nRows) {
        return state;
      }
      perm = arraySwap(rowPerm, row, newRow);
    } else if (typeof position === 'string') {
      if (position === 'first') {
        newRow = 0;
        perm = arrayRotate(rowPerm, row, newRow);
      } else if (position === 'last') {
        newRow = nRows - 1;
        perm = arrayRotate(rowPerm, row, newRow);
      } else {
        return state;
      }
    }
    return updateWorkspace(update(state, {
      workspace: {selectedRow: {$set: newRow}},
      dump: {
        rowPerm: perm,
        permChanged: {$set: true}
      }
    }));
  });

  bundle.defineAction('colMoved', 'Grid.Col.Moved');
  bundle.addReducer('colMoved', function (state, action) {
    const {nCols, colPerm} = state.dump;
    const {col, direction, position} = action;
    let perm, newCol;
    if (typeof direction === 'number') {
      newCol = col + direction;
      if (newCol < 0 || newCol >= nCols) {
        return state;
      }
      perm = arraySwap(colPerm, col, newCol);
    } else if (typeof position === 'string') {
      if (position === 'first') {
        newCol = 0;
        perm = arrayRotate(colPerm, col, newCol);
      } else if (position === 'last') {
        newCol = nCols - 1;
        perm = arrayRotate(colPerm, col, newCol);
      } else {
        return state;
      }
    }
    return updateWorkspace(update(state, {
      workspace: {selectedCol: {$set: newCol}},
      dump: {
        colPerm: perm,
        permChanged: {$set: true}
      }
    }));
  });

  bundle.defineAction('substItemsSwapped', 'Subst.Items.Swapped');
  bundle.addReducer('substItemsSwapped', function (state, action) {
    const {substitution} = state.dump;
    const {rank1, rank2} = action;
    return updateWorkspace(update(state, {
      dump: {substitution: arraySwap(substitution, rank1, rank2)}
    }));
  });

  bundle.defineAction('substItemLocked', 'Subst.Item.Locked');
  bundle.addReducer('substItemLocked', function (state, action) {
    const {rank} = action;
    return updateWorkspace(update(state, {
      dump: {substitution: {[rank]: {locked: {$apply: b => !b}}}}
    }));
  });

  bundle.defineAction('cipherTextChanged', 'Task.CipherText.Changed');
  bundle.addReducer('cipherTextChanged', function (state, action) {
    const {text} = action;
    const task = {cipher_text: text};
    const dump = makeDump(task, 40);
    return initWorkspace({...state, task}, dump);
  });

  bundle.addSaga(function* () {
    yield takeLatest(deps.gridMounted, function* (action) {
      const {grid} = action;
      if (grid) {
        const hPos = yield select(state => state.workspace.hPos);
        const vPos = yield select(state => state.workspace.vPos);
        grid.scrollTo(vPos, hPos);
        yield takeEvery([deps.rowSelected, deps.rowMoved], function* (action) {
          const row = yield select(state => state.workspace.selectedRow);
          grid.ensureRowVisible(row);
        });
        yield takeEvery([deps.colSelected, deps.colMoved], function* (action) {
          const col = yield select(state => state.workspace.selectedCol);
          grid.ensureColVisible(col);
        });
      }
    });
  });

  bundle.include(AnswerBundle);
  bundle.use('Answer');

  /* auto-save */

  bundle.use('saveWorkspace');
  bundle.addSaga(function* () {
    const channel = intervalChannel(5 * 60 * 1000); // every 5 minutes
    yield takeEvery(channel, function* () {
      const isUnsaved = yield select(state => state.isWorkspaceUnsaved);
      if (isUnsaved) {
        yield put({type: deps.saveWorkspace});
      }
    });
  });

  function intervalChannel (millis) {
    return eventChannel(function (emitter) {
      const interval = setInterval(function () {
        emitter(true);
      }, millis);
      return function () {
        clearInterval(interval);
      };
    });
  }

  /* DEVELOPMENT ACTIONS */

  bundle.defineAction('showSolve', 'Task.Solve.Show');
  bundle.addReducer('showSolve', function (state, action) {
    return {...state, showSolve: true};
  });

  bundle.defineAction('solveSubst', 'Task.Subst.Solve');
  bundle.addReducer('solveSubst', function (state, action) {
    const substitution = inverseSubstitution(state.full_task.substitution);
    return updateWorkspace(update(state, {dump: {substitution: {$set: substitution}}}));
  });

  bundle.defineAction('solvePerm', 'Task.Perm.Solve');
  bundle.addReducer('solvePerm', function (state, action) {
    const nCols = state.full_task.colsPermutation.length;
    const nRows = state.full_task.rowsPermutation.length;
    const substitution = state.dump.substitution;
    const rowPerm = inversePermutation(state.full_task.rowsPermutation);
    const colPerm = inversePermutation(state.full_task.colsPermutation);
    const dump = {nCols, nRows, substitution, rowPerm, colPerm};
    return updateWorkspace(update(state, {dump: {$set: dump}}));
  });

}

const alphabet = makeAlphabet('abcdefghijklmnopqrstuvwxyz0123456789 .-+|'.split(''));
const paddingCell = {symbol: ' ', locked: false, padding: true};

const blankAnswer =  {
  "nbCols": "",
  "sentence": "",
  "countries": "",
  "animals": "",
  "user2Password": "",
  "user1Password": "",
  "gridTotal": ""
};

const identitySubstitution = alphabet.symbols.map(function (symbol) {
  return {symbol, locked: false};
});

function taskLoaded (state) {
  const dump = makeDump(state.task, 40);
  return initWorkspace(state, dump);
}

function taskUpdated (state) {
  const dump = reconcileDump(state.task, state.dump);
  const cells = textToCells(alphabet, state.task.cipher_text);
  const workspace = {...state.workspace, cells};
  return updateWorkspace({...state, workspace}, dump);
}

function workspaceLoaded (state, dump) {
  if (!dump.answer) {
    dump = {...dump, answer: blankAnswer};
  }
  state = updateWorkspace(state, dump);
  /* Reset nColsTemp in workspace */
  state = update(state, {
    workspace: {nColsTemp: {$set: state.dump.nCols}}
  });
  return state;
}

function isWorkspaceReady (state) {
  return state.workspace && state.workspace.ready;
}

function makeDump (task, nCols) {
  const textLength = task.cipher_text.length;
  const nRows = Math.floor((textLength + nCols - 1) / nCols);
  const rowPerm = range(0, nRows).toArray();
  const colPerm = range(0, nCols).toArray();
  const substitution = identitySubstitution;
  return {nCols, nRows, rowPerm, colPerm, substitution, answer: blankAnswer};
}

function reconcileDump (task, dump) {
  return dump;
}

function dumpWorkspace (state) {
  return state.dump;
}

function initWorkspace (state, dump) {
  const cells = textToCells(alphabet, state.task.cipher_text);
  const workspace = {
    cells,
    mode: 'rows',
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

function updateWorkspace (state, dump) {
  dump = dump || state.dump;
  const workspace = {...state.workspace, ready: true};
  state = {...state, dump, workspace};
  const {mode} = state.workspace;
  if (mode === 'rows') {
    const frame = getVisibleFrame(state);
    const narrowFrame = getVisibleFrame(state, true);
    const rows = getRows(state, frame);
    workspace.view = {frame, narrowFrame, rows};
  } else if (mode === 'cols') {
    const frame = getVisibleFrame(state);
    const narrowFrame = getVisibleFrame(state, true);
    const cols = getCols(state, frame);
    workspace.view = {frame, narrowFrame, cols};
  } else if (mode === 'text') {
    const frame = getFullFrame(state);
    const rows = getRows(state, frame);
    workspace.view = {frame, rows};
  }
  return state;
}

function WorkspaceSelector (state, props) {
  const {score, task, dump, workspace, submitAnswer, showSolve} = state;
  return {score, task, dump, workspace, submitAnswer, showSolve, alphabet};
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
  const {extraRenderedRows, extraRenderedCols, maxVisibleRows, maxVisibleCols} = state.workspace;
  const extraRows = narrow ? 0 : extraRenderedRows;
  const extraCols = narrow ? 0 : extraRenderedCols;
  const {cells, hPos, vPos, mode} = state.workspace;
  const {nCols, nRows} = state.dump;
  const firstRow = Math.max(0, vPos - extraRows);
  const lastRow = Math.min(nRows - 1, vPos + maxVisibleRows + extraRows);
  const firstCol = Math.max(0, hPos - extraCols)
  const lastCol = Math.min(nCols - 1, hPos + maxVisibleCols + extraCols);
  return {firstRow, lastRow, firstCol, lastCol};
}

function getRows (state, frame) {
  const {cells} = state.workspace;
  const {nCols, nRows, rowPerm, colPerm} = state.dump;
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
  const {cells, selectedCol} = state.workspace;
  const {nCols, nRows, rowPerm, colPerm} = state.dump;
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

function makeAlphabet (symbols) {
   const size = symbols.length;
   var ranks = {};
   for (var iSymbol = 0; iSymbol < size; iSymbol++) {
      ranks[symbols[iSymbol]] = iSymbol;
   }
   return {symbols, size, ranks};
}

function textToCells (alphabet, textStr) {
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

function arraySwap (array, i, j) {
  return {
    [i]: {$set: array[j]},
    [j]: {$set: array[i]}
  };
}

function arrayRotate (array, fromPos, toPos) {
  if (fromPos === toPos) {
    return {};
  }
  const result = array.slice();
  const temp = result.splice(fromPos, 1);
  result.splice(toPos, 0, temp[0]);
  return {$set: result};
}

function inversePermutation (perm) {
  const result = new Array(perm.length);
  perm.forEach(function (val, index) {
    result[val] = index;
  });
  return result;
}

function inverseSubstitution (subst) {
  const result = new Array(alphabet.size);
  Object.keys(subst).forEach(function (clearSymbol) {
    const cipherSymbol = subst[clearSymbol];
    const cipherRank = alphabet.ranks[cipherSymbol];
    result[cipherRank] = {symbol: clearSymbol, locked: true};
  });
  return result;
}
