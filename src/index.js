
import runTask from 'alkindi-task-lib';
import update from 'immutability-helper';
import React from 'react';
import EpicComponent from 'epic-component';
import {ButtonToolbar, ButtonGroup, Button} from 'react-bootstrap';
import classnames from 'classnames';
import range from 'node-range';

import 'font-awesome/css/font-awesome.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'rc-tooltip/assets/bootstrap.css';
import './style.css';

export function run (container, options) {
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
      submitAnswer: {}
    };
  });

  bundle.defineView('Task', IntroSelector, Intro);

  const WorkspaceActions = bundle.pack('submitAnswer', 'SaveButton', 'gridScrolled', 'colSelected', 'rowSelected', 'modeChanged');
  bundle.defineView('Workspace', WorkspaceSelector, Workspace(WorkspaceActions));

  bundle.defineAction('modeChanged', 'Grid.Mode.Changed');
  bundle.addReducer('modeChanged', function (state, action) {
    const {mode} = action;
    return update(state,
      {workspace: {mode: {$set: mode}}});
  });

  bundle.defineAction('gridScrolled', 'Grid.Scrolled');
  bundle.addReducer('gridScrolled', function (state, action) {
    const {hPos, vPos} = action;
    let {workspace} = state;
    workspace = {...workspace, hPos, vPos};
    return {...state, workspace};
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

}

const alphabet = makeAlphabet('abcdefghijklmnopqrstuvwxyz0123456789 .-+|'.split(''));

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
  const textLength = task.clear_text.length;
  const nRows = Math.floor((textLength + nCols - 1) / nCols);
  const rowPerm = range(0, nRows).toArray();
  const colPerm = range(0, nCols).toArray();
  const substitution = alphabet.symbols.map(function (symbol) {
    return {symbol, locked: false};
  });
  return {nCols, nRows, rowPerm, colPerm, substitution};
}

function reconcileDump (task, dump) {
  return dump;
}

function dumpWorkspace (state) {
  return state.dump;
}

function initWorkspace (state, dump) {
  const cells = textToCells(alphabet, state.task.clear_text);
  const workspace = {cells, hPos: 0, vPos: 0, mode: 'cols'};
  return updateWorkspace({...state, workspace}, dump);
}

function updateWorkspace (state, dump) {
  const {substitution} = dump;
  const workspace = {...state.workspace, ready: true};
  return {...state, dump, workspace};
}

const Intro = EpicComponent(function (self) {
  self.render = function () {
    return <p>Task</p>;
  };
});

function IntroSelector (state) {
  const {task, taskBaseUrl} = state;
  return {baseUrl: taskBaseUrl};
}

const Workspace = actions => EpicComponent(function (self) {

  const maxVisibleRows = 10;
  const maxVisibleCols = 60;
  const extraRenderedRows = 4;
  const extraRenderedCols = 4;
  const paddingLeft = 10;
  const paddingTop = 10;
  const cellWidth = 16;
  const cellHeight = 20;
  const innerPadding = 2;
  const scrollSpace = 20;

  self.render = function () {
    const {mode, selectedRow, selectedCol} = self.props.workspace;
    console.log('select', selectedRow, selectedCol);
    return (
      <div>
        <p>Workspace</p>
        <ButtonToolbar>
          <ButtonGroup>
            <Button style={{width: '40px'}} active={mode==='cols'} onClick={onSwitchToCols}><i className="fa fa-arrows-h"/></Button>
            <Button style={{width: '40px'}} active={mode==='rows'} onClick={onSwitchToRows}><i className="fa fa-arrows-v"/></Button>
          </ButtonGroup>
        </ButtonToolbar>
        <div className="text-grid" style={renderGridStyle()} onScroll={onScroll}>
          {mode === 'rows' && renderRows()}
          {mode === 'cols' && renderCols()}
          {renderGridSizer()}
        </div>
      </div>
    );
  };

  function onSwitchToCols () {
    self.props.dispatch({type: actions.modeChanged, mode: 'cols'});
  }
  function onSwitchToRows () {
    self.props.dispatch({type: actions.modeChanged, mode: 'rows'});
  }
  function onScroll (event) {
    const top = event.target.scrollTop;
    const left = event.target.scrollLeft;
    const vPos = Math.floor(top / cellHeight);
    const hPos = Math.floor(left / cellWidth);
    self.props.dispatch({type: actions.gridScrolled, vPos, hPos});
  }
  function onSelectRow (event) {
    const row = parseInt(event.currentTarget.getAttribute('data-row'));
    self.props.dispatch({type: actions.rowSelected, row});
  }
  function onSelectCol (event) {
    const col = parseInt(event.currentTarget.getAttribute('data-col'));
    self.props.dispatch({type: actions.colSelected, col});
  }

  /* grid and framing */
  function getVisibleFrame () {
    const {cells, hPos, vPos, mode} = self.props.workspace;
    const {nCols, nRows} = self.props.dump;
    const firstRow = Math.max(0, vPos - extraRenderedRows);
    const lastRow = Math.min(nRows - 1, vPos + maxVisibleRows + extraRenderedRows);
    const firstCol = Math.max(0, hPos - extraRenderedCols)
    const lastCol = Math.min(nCols - 1, hPos + maxVisibleCols + extraRenderedCols);
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
            {row.cols.map(col =>
              <div key={col.key} className="text-cell" style={renderRowColCellStyle(row, col)}>
                {renderCellContent(col)}
              </div>
            )}
          </div>)}
      </div>
    );
  }
  function renderRowColCellStyle (row, col) {
    return {
      left: `${(col.x - row.x1) * cellWidth}px`,
      width: `${cellWidth}px`,
      height: `${cellHeight}px`
    };
  }
  function renderRowStyle (row) {
    const {x1, x2, y} = row;
    return {
      left: `${paddingLeft + x1 * cellWidth}px`,
      top: `${paddingTop + y * cellHeight}px`,
      width: `${(x2 - x1 + 1) * cellWidth}px`,
      height: `${cellHeight}px`
    };
  }
  function renderRowBgStyle (row) {
    const {x1, x2, y} = row;
    return {
      left: `${innerPadding}px`,
      top: `${innerPadding}px`,
      width: `${(x2 - x1 + 1) * cellWidth - innerPadding * 2}px`,
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
        const cell = index < cells.length ? cells[index] : paddingCell;
        cols.push({key: col, cell, x, y});
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
            {col.rows.map(row =>
              <div key={row.key} className="text-cell" style={renderColRowCellStyle(col, row)}>
                {renderCellContent(row)}
              </div>
            )}
          </div>)}
      </div>
    );
  }
  function renderColRowCellStyle (col, row) {
    return {
      top: `${(row.y - col.y1) * cellHeight}px`,
      width: `${cellWidth}px`,
      height: `${cellHeight}px`
    };
  }
  function renderColStyle (col) {
    const {y1, y2, x} = col;
    return {
      left: `${paddingLeft + x * cellWidth}px`,
      top: `${paddingTop + y1 * cellHeight}px`,
      width: `${cellWidth}px`,
      height: `${(y2 - y1 + 1) * cellHeight}px`
    };
  }
  function renderColBgStyle (row) {
    const {y1, y2, x} = row;
    return {
      left: `${innerPadding}px`,
      top: `${innerPadding}px`,
      width: `${cellWidth - innerPadding * 2}px`,
      height: `${(y2 - y1 + 1) * cellHeight - innerPadding * 2}px`
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
        const cell = index < cells.length ? cells[index] : paddingCell;
        rows.push({key: row, cell, x, y});
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
  function renderCellContent (col) {
    const {cell} = col;
    if ('rank' in cell) {
      return <span>{alphabet.symbols[cell.rank]}</span>;
    } else {
      return <span>{cell.symbol}</span>;
    }
  }

});

function WorkspaceSelector (state, props) {
  const {score, task, dump, workspace, submitAnswer} = state;
  return {score, task, dump, workspace, submitAnswer};
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

