/* substitution; gris locké; css; selection; réponse; participation code d'équipe */

import runTask from 'alkindi-task-lib';
import update from 'immutability-helper';
import React from 'react';
import EpicComponent from 'epic-component';
import {ButtonToolbar, ButtonGroup, Button} from 'react-bootstrap';
import classnames from 'classnames';
import range from 'node-range';
import {select, takeLatest, takeEvery} from 'redux-saga/effects';
import {DragDropContext} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import 'font-awesome/css/font-awesome.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'rc-tooltip/assets/bootstrap.css';
import './style.css';

import SubstEditor from './subst';
import Intro from './intro';
import AnswerBundle from './answer';

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
      showSolve: false,
      answer: {
        "nbCols": 40,
        "sentence": "",
        "countries": "",
        "animals": "",
        "user2Password": "",
        "user1Password": "",
        "gridTotal": 0
      }
    };
  });

  bundle.defineView('Task', IntroSelector, Intro);

  const WorkspaceActions = bundle.pack('submitAnswer', 'SaveButton',
    'gridMounted', 'gridScrolled', 'gridResized',
    'colSelected', 'rowSelected', 'modeChanged', 'rowMoved', 'colMoved',
    'substItemsSwapped', 'substItemLocked', 'cipherTextChanged',
    'solveSubst', 'solvePerm', 'Answer'
  );
  bundle.defineView('Workspace', WorkspaceSelector, Workspace(WorkspaceActions));

  bundle.defineAction('modeChanged', 'Grid.Mode.Changed');
  bundle.addReducer('modeChanged', function (state, action) {
    const {mode} = action;
    return update(state,
      {workspace: {mode: {$set: mode}}});
  });

  bundle.defineAction('gridMounted', 'Grid.Mounted');
  bundle.addReducer('gridMounted', function (state, action) {
    const {grid} = action;
    return update(state, {workspace: {grid: {$set: grid}}});
  });

  bundle.defineAction('gridScrolled', 'Grid.Scrolled');
  bundle.addReducer('gridScrolled', function (state, action) {
    const {hPos, vPos} = action;
    let {workspace} = state;
    workspace = {...workspace, hPos, vPos};
    return {...state, workspace};
  });

  bundle.defineAction('gridResized', 'Grid.Resized');
  bundle.addReducer('gridResized', function (state, action) {
    const {nCols} = action;
    const dump = makeDump(state.task, nCols);
    /* Preserve the substitution. */
    dump.substitution = state.dump.substitution;
    return update(state, {dump: {$set: dump}});
  });

  bundle.defineAction('rowSelected', 'Grid.Row.Selected');
  bundle.addReducer('rowSelected', function (state, action) {
    const {row} = action;
    function toggleSelection (prev) {
      return row === prev ? undefined : row;
    }
    return update(state,
      {workspace: {selectedRow: {$apply: toggleSelection}}});
  });

  bundle.defineAction('colSelected', 'Grid.Col.Selected');
  bundle.addReducer('colSelected', function (state, action) {
    const {col} = action;
    function toggleSelection (prev) {
      return col === prev ? undefined : col;
    }
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
    return update(state, {
      workspace: {selectedRow: {$set: newRow}},
      dump: {
        rowPerm: perm,
        permChanged: {$set: true}
      }
    });
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
    return update(state, {
      workspace: {selectedCol: {$set: newCol}},
      dump: {
        colPerm: perm,
        permChanged: {$set: true}
      }
    });
  });

  bundle.defineAction('substItemsSwapped', 'Subst.Items.Swapped');
  bundle.addReducer('substItemsSwapped', function (state, action) {
    const {substitution} = state.dump;
    const {rank1, rank2} = action;
    return update(state, {
      dump: {substitution: arraySwap(substitution, rank1, rank2)}
    });
  });

  bundle.defineAction('substItemLocked', 'Subst.Item.Locked');
  bundle.addReducer('substItemLocked', function (state, action) {
    const {rank} = action;
    return update(state, {
      dump: {substitution: {[rank]: {locked: {$apply: b => !b}}}}
    });
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
        yield takeEvery([deps.rowSelected, deps.rowMoved], function* (action) {
          const row = yield select(state => state.workspace.selectedRow);
          grid.ensureRowVisible(row);
        });
      }
    });
  });

  bundle.include(AnswerBundle);
  bundle.use('Answer');

  /* DEVELOPMENT ACTIONS */

  bundle.defineAction('showSolve', 'Task.Solve.Show');
  bundle.addReducer('showSolve', function (state, action) {
    return {...state, showSolve: true};
  });

  bundle.defineAction('solveSubst', 'Task.Subst.Solve');
  bundle.addReducer('solveSubst', function (state, action) {
    const substitution = inverseSubstitution(state.full_task.substitution);
    return update(state, {dump: {substitution: {$set: substitution}}});
  });

  bundle.defineAction('solvePerm', 'Task.Perm.Solve');
  bundle.addReducer('solvePerm', function (state, action) {
    const nCols = state.full_task.colsPermutation.length;
    const nRows = state.full_task.rowsPermutation.length;
    const substitution = state.dump.substitution;
    const rowPerm = inversePermutation(state.full_task.rowsPermutation);
    const colPerm = inversePermutation(state.full_task.colsPermutation);
    const dump = {nCols, nRows, substitution, rowPerm, colPerm};
    return update(state, {dump: {$set: dump}});
  });

}

const alphabet = makeAlphabet('abcdefghijklmnopqrstuvwxyz0123456789 .-+|'.split(''));

const identitySubstitution = alphabet.symbols.map(function (symbol) {
  return {symbol, locked: false};
});

function taskLoaded (state) {
  const dump = makeDump(state.task, 40);
  return initWorkspace(state, dump);
}

function taskUpdated (state) {
  const dump = reconcileDump(state.task, state.dump);
  return initWorkspace(state, dump);
}

function workspaceLoaded (state, dump) {
  return updateWorkspace(state, dump);
}

function isWorkspaceReady (state) {
  return state.workspace.ready;
}

function makeDump (task, nCols) {
  const textLength = task.cipher_text.length;
  const nRows = Math.floor((textLength + nCols - 1) / nCols);
  const rowPerm = range(0, nRows).toArray();
  const colPerm = range(0, nCols).toArray();
  const substitution = identitySubstitution;
  return {nCols, nRows, rowPerm, colPerm, substitution};
}

function reconcileDump (task, dump) {
  return dump;
}

function dumpWorkspace (state) {
  return state.dump;
}

function initWorkspace (state, dump) {
  const cells = textToCells(alphabet, state.task.cipher_text);
  const workspace = {cells, hPos: 0, vPos: 0, mode: 'rows'};
  return updateWorkspace({...state, workspace}, dump);
}

function updateWorkspace (state, dump) {
  const workspace = {...state.workspace, ready: true};
  return {...state, dump, workspace};
}

function IntroSelector (state) {
  const {task, taskBaseUrl} = state;
  return {baseUrl: taskBaseUrl};
}

const Workspace = deps => EpicComponent(function (self) {

  const maxVisibleRows = 12;
  const maxVisibleCols = 50;
  const extraRenderedRows = 2;
  const extraRenderedCols = 2;
  const paddingLeft = 0;
  const paddingTop = 10;
  const cellWidth = 16;
  const cellHeight = 20;
  const innerPadding = 2;
  const scrollSpace = 20;
  const selectionHalo = 2; /* number of rows,cols visible around selection */
  const cellWidthRowExtend = 4; /*used to increase cell width in row mode */
  const cellHeightColExtend = 4; /*used to increase cell height in col mode */

  self.render = function () {
    const {showSolve} = self.props;
    const {substitution} = self.props.dump;
    const {mode, selectedRow, selectedCol} = self.props.workspace;
    const isMode = {[mode]: true};
    return (
      <div>
        <div className="panel panel-default">
          <div className="panel-heading">
            {"Questions (100 points chacune)"}
          </div>
          <div className="panel-body">
            <deps.Answer/>
          </div>
        </div>
        <div className="panel panel-default">
          <div className="panel-heading">
            {"Substitution"}
          </div>
          <div className="panel-body">
            {showSolve &&
              <Button className="pull-right" onClick={onSolveSubst}><i className="fa fa-flash"/></Button>}
            <SubstEditor alphabet={alphabet} substitution={substitution} cols={Math.ceil(alphabet.size / 2)}
              onLock={onToggleSubstLock} onSwapPairs={onSwapPairs} />
          </div>
        </div>
        <div className="panel panel-default">
          <div className="panel-heading">
            {"Permutation"}
          </div>
          <div className="panel-body">
            {showSolve &&
              <Button className="pull-right" onClick={onSolvePerm}><i className="fa fa-flash"/></Button>}
            <ButtonToolbar>
              <div className="input-group" style={{width: '64px'}}>
                <input className="input-medium form-control" type="number" value={self.props.dump.nCols} onChange={onColsChanged} maxLength='2' />
              </div>
              <ButtonGroup>
                <Button style={{width: '40px'}} active={isMode.rows} onClick={onSwitchToRows}><i className="fa fa-arrows-v"/></Button>
                <Button style={{width: '40px'}} active={isMode.cols} onClick={onSwitchToCols}><i className="fa fa-arrows-h"/></Button>
                <Button style={{width: '40px'}} active={isMode.text} onClick={onSwitchToText}><i className="fa fa-font"/></Button>
                {isMode.rows && <Button style={{width: '40px'}} disabled={selectedRow===undefined} onClick={onMoveRowFirst}><i className="fa fa-angle-double-up"/></Button>}
                {isMode.rows && <Button style={{width: '40px'}} disabled={selectedRow===undefined} onClick={onMoveRowUp}><i className="fa fa-angle-up"/></Button>}
                {isMode.rows && <Button style={{width: '40px'}} disabled={selectedRow===undefined} onClick={onMoveRowDown}><i className="fa fa-angle-down"/></Button>}
                {isMode.rows && <Button style={{width: '40px'}} disabled={selectedRow===undefined} onClick={onMoveRowLast}><i className="fa fa-angle-double-down"/></Button>}
                {isMode.cols && <Button style={{width: '40px'}} disabled={selectedCol===undefined} onClick={onMoveColFirst}><i className="fa fa-angle-double-left"/></Button>}
                {isMode.cols && <Button style={{width: '40px'}} disabled={selectedCol===undefined} onClick={onMoveColLeft}><i className="fa fa-angle-left"/></Button>}
                {isMode.cols && <Button style={{width: '40px'}} disabled={selectedCol===undefined} onClick={onMoveColRight}><i className="fa fa-angle-right"/></Button>}
                {isMode.cols && <Button style={{width: '40px'}} disabled={selectedCol===undefined} onClick={onMoveColLast}><i className="fa fa-angle-double-right"/></Button>}
              </ButtonGroup>
            </ButtonToolbar>
            <div className="text-grid" style={renderGridStyle()} onScroll={onScroll} ref={refGrid}>
              {isMode.rows && renderRows()}
              {isMode.cols && renderCols()}
              {isMode.text && renderText()}
              {renderGridSizer()}
            </div>
          </div>
        </div>
        {false && <div className="panel panel-default">
          <div className="panel-body">
            <textarea rows='10' cols='60' value={self.props.task.cipher_text} onChange={onCipherTextChanged}/>
          </div>
        </div>}
      </div>
    );
  };

  function refGrid (element) {
    const grid = element && {
      ensureRowVisible: function (row) {
        const frame = getVisibleFrame(true);
        if (row < frame.firstRow + selectionHalo) {
          const firstRow = Math.max(0, row - selectionHalo);
          element.scrollTop = firstRow * cellHeight;
        }
        if (row > frame.lastRow - 1 - selectionHalo) {
          const firstRow = Math.max(0, row - maxVisibleRows + selectionHalo);
          element.scrollTop = firstRow * cellHeight;
        }
      },
      ensureColVisible: function (col) {
        const frame = getVisibleFrame(true);
        if (col < frame.firstCol + selectionHalo) {
          const firstCol = Math.max(0, col - selectionHalo);
          element.scrollLeft = firstCol * cellWidth;
        }
        if (col > frame.lastCol - 1 - selectionHalo) {
          const firstRow = Math.max(0, col - maxVisibleCols + selectionHalo);
          element.scrollLeft = firstCol * cellWidth;
        }
      }
    };
    self.props.dispatch({type: deps.gridMounted, grid});
  }
  function onSwitchToText () {
    self.props.dispatch({type: deps.modeChanged, mode: 'text'});
  }
  function onSwitchToCols () {
    self.props.dispatch({type: deps.modeChanged, mode: 'cols'});
  }
  function onSwitchToRows () {
    self.props.dispatch({type: deps.modeChanged, mode: 'rows'});
  }
  function onScroll (event) {
    const top = event.target.scrollTop;
    const left = event.target.scrollLeft;
    const vPos = Math.floor(top / cellHeight);
    const hPos = Math.floor(left / cellWidth);
    self.props.dispatch({type: deps.gridScrolled, vPos, hPos});
  }
  function onColsChanged (event) {
    const nCols = parseInt(event.target.value);
    if (nCols >= 0) {
      if (self.props.dump.permChanged) {
        if (!confirm("La permutation des lignes et colonnes de la grille va être perdue. Continuer ?")) {
          return;
        }
      }
      self.props.dispatch({type: deps.gridResized, nCols});
    }
  }
  function onSelectRow (event) {
    const row = parseInt(event.currentTarget.getAttribute('data-row'));
    self.props.dispatch({type: deps.rowSelected, row});
  }
  function onSelectCol (event) {
    const col = parseInt(event.currentTarget.getAttribute('data-col'));
    self.props.dispatch({type: deps.colSelected, col});
  }
  function onMoveRowUp (event) {
    const row = self.props.workspace.selectedRow;
    self.props.dispatch({type: deps.rowMoved, row, direction: -1});
  }
  function onMoveRowDown (event) {
    const row = self.props.workspace.selectedRow;
    self.props.dispatch({type: deps.rowMoved, row, direction: 1});
  }
  function onMoveRowFirst (event) {
    const row = self.props.workspace.selectedRow;
    self.props.dispatch({type: deps.rowMoved, row, position: 'first'});
  }
  function onMoveRowLast (event) {
    const row = self.props.workspace.selectedRow;
    self.props.dispatch({type: deps.rowMoved, row, position: 'last'});
  }
  function onMoveColLeft (event) {
    const col = self.props.workspace.selectedCol;
    self.props.dispatch({type: deps.colMoved, col, direction: -1});
  }
  function onMoveColRight (event) {
    const col = self.props.workspace.selectedCol;
    self.props.dispatch({type: deps.colMoved, col, direction: 1});
  }
  function onMoveColFirst (event) {
    const col = self.props.workspace.selectedCol;
    self.props.dispatch({type: deps.colMoved, col, position: 'first'});
  }
  function onMoveColLast (event) {
    const col = self.props.workspace.selectedCol;
    self.props.dispatch({type: deps.colMoved, col, position: 'last'});
  }
  function onToggleSubstLock (rank) {
    self.props.dispatch({type: deps.substItemLocked, rank});
  }
  function onSwapPairs (rank1, rank2) {
    self.props.dispatch({type: deps.substItemsSwapped, rank1, rank2});
  }
  function onCipherTextChanged (event) {
    const text = event.target.value;
    self.props.dispatch({type: deps.cipherTextChanged, text});
  }
  function onSolveSubst () {
    self.props.dispatch({type: deps.solveSubst});
  }
  function onSolvePerm () {
    self.props.dispatch({type: deps.solvePerm});
  }

  /* grid and framing */
  function getFullFrame () {
    const {nCols, nRows} = self.props.dump;
    const firstRow = 0;
    const lastRow = nRows - 1;
    const firstCol = 0;
    const lastCol = nCols - 1;
    return {firstRow, lastRow, firstCol, lastCol};
  }
  function getVisibleFrame (narrow) {
    const extraRows = narrow ? 0 : extraRenderedRows;
    const extraCols = narrow ? 0 : extraRenderedCols;
    const {cells, hPos, vPos, mode} = self.props.workspace;
    const {nCols, nRows} = self.props.dump;
    const firstRow = Math.max(0, vPos - extraRows);
    const lastRow = Math.min(nRows - 1, vPos + maxVisibleRows + extraRows);
    const firstCol = Math.max(0, hPos - extraCols)
    const lastCol = Math.min(nCols - 1, hPos + maxVisibleCols + extraCols);
    return {firstRow, lastRow, firstCol, lastCol};
  }
  function renderGridSizer () {
    const {nCols, nRows} = self.props.dump;
    const top = paddingTop * 2 + nRows * cellHeight;
    const left = paddingLeft * 2 + nCols * cellWidth;
    return <div className='grid-sizer' style={{top,left}}/>;
  }
  function renderGridStyle () {
    const {nCols, nRows} = self.props.dump;
    const cols = Math.min(maxVisibleCols, nCols);
    const rows = Math.min(maxVisibleRows, nRows);
    return {
      width: `${cols * cellWidth + paddingLeft * 2 + scrollSpace}px`,
      height: `${rows * cellHeight + paddingTop * 2 + scrollSpace}px`,
    };
  }

  /* row mode */
  function renderRows () {
    const frame = getVisibleFrame();
    const rows = getRows(frame);
    return (
      <div className="text-rows no-select">
        {rows.map(row =>
          <div key={row.key} className={classnames(["text-row", row.selected && "text-row-selected"])} style={renderRowStyle(row)} data-row={row.y} onClick={onSelectRow}>
            <div className="text-row-bg" style={renderRowBgStyle(row)}></div>
            {row.cols.map(col => renderCell(col, renderRowColCellStyle(row, col)))}
          </div>)}
      </div>
    );
  }
  function renderRowColCellStyle (row, col) {
    return {
      left: `${(col.x - row.x1) * cellWidth}px`,
      width: `${cellWidth - innerPadding * 2 + cellWidthRowExtend}px`,
      height: `${cellHeight - innerPadding * 2}px`,
      margin: `${innerPadding}px`
    };
  }
  function renderRowStyle (row) {
    const {x1, x2, y} = row;
    return {
      left: `${paddingLeft + x1 * cellWidth}px`,
      top: `${paddingTop + y * cellHeight}px`,
      width: `${(x2 - x1 + 1) * cellWidth + cellWidthRowExtend}px`,
      height: `${cellHeight}px`
    };
  }
  function renderRowBgStyle (row) {
    const {x1, x2, y} = row;
    return {
      left: `${innerPadding}px`,
      top: `${innerPadding}px`,
      width: `${(x2 - x1 + 1) * cellWidth - innerPadding * 2 + cellWidthRowExtend}px`,
      height: `${cellHeight - innerPadding * 2}px`
    };
  }
  function getRows (frame) {
    const {cells, selectedRow} = self.props.workspace;
    const {rowPerm, colPerm} = self.props.dump;
    const {nCols, nRows} = self.props.dump;
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
      rows.push({
        key: row, cols, x1: firstCol, x2: lastCol, y,
        selected: selectedRow === y
      });
    });
    return rows;
  }

  /* col mode */
  function renderCols () {
    const frame = getVisibleFrame();
    const cols = getCols(frame);
    return (
      <div className="text-cols no-select">
        {cols.map(col =>
          <div key={col.key} className={classnames(["text-col", col.selected && "text-col-selected"])} style={renderColStyle(col)} data-col={col.x} onClick={onSelectCol}>
            <div className="text-col-bg" style={renderColBgStyle(col)}></div>
            {col.rows.map(row => renderCell(row, renderColRowCellStyle(col, row)))}
          </div>)}
      </div>
    );
  }
  function renderColRowCellStyle (col, row) {
    return {
      top: `${(row.y - col.y1) * cellHeight}px`,
      width: `${cellWidth - innerPadding * 2}px`,
      height: `${cellHeight - innerPadding * 2 + cellHeightColExtend}px`,
      margin: `${innerPadding}px`
    };
  }
  function renderColStyle (col) {
    const {y1, y2, x} = col;
    return {
      left: `${paddingLeft + x * cellWidth}px`,
      top: `${paddingTop + y1 * cellHeight}px`,
      width: `${cellWidth}px`,
      height: `${(y2 - y1 + 1) * cellHeight + cellHeightColExtend}px`
    };
  }
  function renderColBgStyle (row) {
    const {y1, y2, x} = row;
    return {
      left: `${innerPadding}px`,
      top: `${innerPadding}px`,
      width: `${cellWidth - innerPadding * 2}px`,
      height: `${(y2 - y1 + 1) * cellHeight - innerPadding * 2 + cellHeightColExtend}px`
    };
  }
  function getCols (frame) {
    const {cells, selectedCol} = self.props.workspace;
    const {rowPerm, colPerm} = self.props.dump;
    const {nCols, nRows} = self.props.dump;
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
      cols.push({
        key: col, rows, x, y1: firstRow, y2: lastRow,
        selected: selectedCol === x
      });
    });
    return cols;
  }

  /* cells */
  const paddingCell = {symbol: ' ', locked: false, padding: true};
  function renderCell (cell, style) {
    const {content} = cell;
    let body, classes;
    if ('rank' in content) {
      const clearCell = self.props.dump.substitution[content.rank];
      body = <span>{clearCell.symbol}</span>;
      classes = classnames(["text-cell", clearCell.locked && "text-cell-locked"]);
    } else {
      body = <span>{content.symbol}</span>;
      classes = "text-cell text-cell-literal";
    }
    return (
      <div key={cell.key} className={classes} style={style}>{body}</div>
    );
  }

  function renderText () {
    const frame = getFullFrame();
    const rows = getRows(frame);
    return (
      <div className="text-normal">
        {rows.map(row =>
          <div key={row.key} className="text-row" style={renderRowStyle(row)} data-row={row.y} onClick={onSelectRow}>
            {row.cols.map(col => renderCell(col, renderRowColCellStyle(row, col)))}
            <br/>
          </div>)}
      </div>
    );
  }

});

function WorkspaceSelector (state, props) {
  const {score, task, dump, workspace, submitAnswer, showSolve} = state;
  return {score, task, dump, workspace, submitAnswer, showSolve};
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
