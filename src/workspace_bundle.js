import React from "react";
import update from "immutability-helper";
import {connect} from "react-redux";
import classnames from "classnames";
import {Alert, ButtonToolbar, ButtonGroup, Button} from "react-bootstrap";
import {select, takeLatest, takeEvery} from "redux-saga/effects";
import {DragDropContext} from "react-dnd";
import HTML5Backend from "react-dnd-html5-backend";

import SubstEditor from "./subst";
import {
  inverseSubstitution,
  inversePermutation,
  arrayRotate,
  arraySwap,
  alphabet,
  makeDump,
  initWorkspace,
  updateWorkspace
} from "./utils";

const paddingLeft = 0;
const paddingTop = 10;
const cellWidth = 16;
const cellHeight = 20;
const innerPadding = 2;
const scrollSpace = 20;

class Workspace extends React.PureComponent {
  refGrid = element => {
    const grid = element && {
      scrollTo: (row, col) => {
        console.log("scrollTo", element, row, col);
        element.scrollTop = row * cellHeight;
        element.scrollLeft = col * cellWidth;
      },
      ensureRowVisible: row => {
        const frame = this.props.workspace.view.narrowFrame;
        const {maxVisibleRows, selectionHalo} = this.props.workspace;
        if (row < frame.firstRow + selectionHalo) {
          const firstRow = Math.max(0, row - selectionHalo);
          element.scrollTop = firstRow * cellHeight;
        }
        if (row > frame.lastRow - 1 - selectionHalo) {
          const firstRow = Math.max(0, row - maxVisibleRows + selectionHalo);
          element.scrollTop = firstRow * cellHeight;
        }
      },
      ensureColVisible: col => {
        const frame = this.props.workspace.view.narrowFrame;
        const {maxVisibleCols, selectionHalo} = this.props.workspace;
        if (col < frame.firstCol + selectionHalo) {
          const firstCol = Math.max(0, col - selectionHalo);
          element.scrollLeft = firstCol * cellWidth;
        }
        if (col > frame.lastCol - 1 - selectionHalo) {
          const firstCol = Math.max(0, col - maxVisibleCols + selectionHalo);
          element.scrollLeft = firstCol * cellWidth;
        }
      }
    };
    this.props.dispatch({type: this.props.actions.gridMounted, grid});
  };
  onSwitchToText = () => {
    this.props.dispatch({type: this.props.actions.modeChanged, mode: "text"});
  };
  onSwitchToCols = () => {
    this.props.dispatch({type: this.props.actions.modeChanged, mode: "cols"});
  };
  onSwitchToRows = () => {
    this.props.dispatch({type: this.props.actions.modeChanged, mode: "rows"});
  };
  onScroll = event => {
    const top = event.target.scrollTop;
    const left = event.target.scrollLeft;
    const vPos = Math.floor(top / cellHeight);
    const hPos = Math.floor(left / cellWidth);
    this.props.dispatch({type: this.props.actions.gridScrolled, vPos, hPos});
  };

  onColsChanged = event => {
    const nCols = parseInt(event.target.value);
    if (nCols >= 0) {
      console.log("onColsChanged", this.props.dump.permChanged);
      if (this.props.dump.permChanged) {
        this.props.dispatch({type: this.props.actions.resizeGrid, nCols});
      } else {
        this.props.dispatch({type: this.props.actions.gridResized, nCols});
      }
    }
  };

  onResizeGrid = () => {
    const {nColsTemp} = this.props.workspace;
    this.props.dispatch({
      type: this.props.actions.gridResized,
      nCols: nColsTemp
    });
  };

  onSelectRow = event => {
    const row = parseInt(event.currentTarget.getAttribute("data-row"));
    this.props.dispatch({type: this.props.actions.rowSelected, row});
  };

  onSelectCol = event => {
    const col = parseInt(event.currentTarget.getAttribute("data-col"));
    this.props.dispatch({type: this.props.actions.colSelected, col});
  };

  onMoveRowUp = _event => {
    const row = this.props.workspace.selectedRow;
    this.props.dispatch({
      type: this.props.actions.rowMoved,
      row,
      direction: -1
    });
  };

  onMoveRowDown = _event => {
    const row = this.props.workspace.selectedRow;
    this.props.dispatch({type: this.props.actions.rowMoved, row, direction: 1});
  };

  onMoveRowFirst = _event => {
    const row = this.props.workspace.selectedRow;
    this.props.dispatch({
      type: this.props.actions.rowMoved,
      row,
      position: "first"
    });
  };

  onMoveRowLast = _event => {
    const row = this.props.workspace.selectedRow;
    this.props.dispatch({
      type: this.props.actions.rowMoved,
      row,
      position: "last"
    });
  };

  onMoveColLeft = _event => {
    const col = this.props.workspace.selectedCol;
    this.props.dispatch({
      type: this.props.actions.colMoved,
      col,
      direction: -1
    });
  };

  onMoveColRight = _event => {
    const col = this.props.workspace.selectedCol;
    this.props.dispatch({type: this.props.actions.colMoved, col, direction: 1});
  };

  onMoveColFirst = _event => {
    const col = this.props.workspace.selectedCol;
    this.props.dispatch({
      type: this.props.actions.colMoved,
      col,
      position: "first"
    });
  };

  onMoveColLast = _event => {
    const col = this.props.workspace.selectedCol;
    this.props.dispatch({
      type: this.props.actions.colMoved,
      col,
      position: "last"
    });
  };

  onToggleSubstLock = rank => {
    this.props.dispatch({type: this.props.actions.substItemLocked, rank});
  };

  onSwapPairs = (rank1, rank2) => {
    this.props.dispatch({
      type: this.props.actions.substItemsSwapped,
      rank1,
      rank2
    });
  };

  onCipherTextChanged = event => {
    const text = event.target.value;
    this.props.dispatch({type: this.props.actions.cipherTextChanged, text});
  };

  onSolveSubst = () => {
    this.props.dispatch({type: this.props.actions.solveSubst});
  };

  onSolvePerm = () => {
    this.props.dispatch({type: this.props.actions.solvePerm});
  };

  /* grid and framing */
  renderGridSizer = () => {
    const {nCols, nRows} = this.props.dump;
    const top = paddingTop * 2 + nRows * cellHeight;
    const left = paddingLeft * 2 + nCols * cellWidth;
    return <div className="grid-sizer" style={{top, left}} />;
  };
  renderGridStyle = () => {
    const {nCols, nRows} = this.props.dump;
    const {maxVisibleCols, maxVisibleRows} = this.props.workspace;
    const cols = Math.min(maxVisibleCols, nCols);
    const rows = Math.min(maxVisibleRows, nRows);
    return {
      width: `${cols * cellWidth + paddingLeft * 2 + scrollSpace}px`,
      height: `${rows * cellHeight + paddingTop * 2 + scrollSpace}px`
    };
  };

  renderRows = () => {
    const {selectedRow, view} = this.props.workspace;
    const {frame, rows} = view;
    const {substitution} = this.props.dump;
    return (
      <RowsView
        frame={frame}
        rows={rows}
        substitution={substitution}
        selectedRow={selectedRow}
        onSelectRow={this.onSelectRow}
      />
    );
  };

  renderCols = () => {
    const {selectedCol, view} = this.props.workspace;
    const {frame, cols} = view;
    const {substitution} = this.props.dump;
    return (
      <ColsView
        frame={frame}
        cols={cols}
        substitution={substitution}
        selectedCol={selectedCol}
        onSelectCol={this.onSelectCol}
      />
    );
  };

  renderText = () => {
    const {frame, rows} = this.props.workspace.view;
    const {substitution} = this.props.dump;
    return <TextView frame={frame} rows={rows} substitution={substitution} />;
  };

  render () {
    const {showSolve, dump, workspace} = this.props;
    const {substitution, nCols} = dump;
    const {mode, selectedRow, selectedCol, nColsTemp} = workspace;
    const nColsConfirm = nColsTemp !== nCols;
    const isMode = {[mode]: true};
    const {Answer} = this.props.views;

    return (
      <div className="taskWrapper">
        <div className="panel panel-default">
          <div className="panel-heading">
            {"Questions (100 points chacune)"}
          </div>
          <div className="panel-body">
            <Answer />
          </div>
        </div>
        <div className="panel panel-default">
          <div className="panel-heading">{"Substitution"}</div>
          <div className="panel-body">
            {showSolve && (
              <Button className="pull-right" onClick={this.onSolveSubst}>
                <i className="fa fa-flash" />
              </Button>
            )}
            <SubstEditor
              alphabet={alphabet}
              substitution={substitution}
              cols={Math.ceil(alphabet.size / 2)}
              onLock={this.onToggleSubstLock}
              onSwapPairs={this.onSwapPairs}
            />
          </div>
        </div>
        <div className="panel panel-default">
          <div className="panel-heading">{"Permutation"}</div>
          <div className="panel-body">
            {showSolve && (
              <Button className="pull-right" onClick={this.onSolvePerm}>
                <i className="fa fa-flash" />
              </Button>
            )}
            <ButtonToolbar>
              <div className="input-group" style={{width: "64px"}}>
                <input
                  className="input-medium form-control"
                  type="number"
                  value={nColsTemp}
                  onChange={this.onColsChanged}
                  maxLength="2"
                />
              </div>
              <ButtonGroup>
                <Button
                  style={{width: "40px"}}
                  active={isMode.rows}
                  onClick={this.onSwitchToRows}
                >
                  <i className="fa fa-arrows-v" />
                </Button>
                <Button
                  style={{width: "40px"}}
                  active={isMode.cols}
                  onClick={this.onSwitchToCols}
                >
                  <i className="fa fa-arrows-h" />
                </Button>
                <Button
                  style={{width: "40px"}}
                  active={isMode.text}
                  onClick={this.onSwitchToText}
                >
                  <i className="fa fa-font" />
                </Button>
                {isMode.rows && (
                  <Button
                    style={{width: "40px"}}
                    disabled={selectedRow === undefined}
                    onClick={this.onMoveRowFirst}
                  >
                    <i className="fa fa-angle-double-up" />
                  </Button>
                )}
                {isMode.rows && (
                  <Button
                    style={{width: "40px"}}
                    disabled={selectedRow === undefined}
                    onClick={this.onMoveRowUp}
                  >
                    <i className="fa fa-angle-up" />
                  </Button>
                )}
                {isMode.rows && (
                  <Button
                    style={{width: "40px"}}
                    disabled={selectedRow === undefined}
                    onClick={this.onMoveRowDown}
                  >
                    <i className="fa fa-angle-down" />
                  </Button>
                )}
                {isMode.rows && (
                  <Button
                    style={{width: "40px"}}
                    disabled={selectedRow === undefined}
                    onClick={this.onMoveRowLast}
                  >
                    <i className="fa fa-angle-double-down" />
                  </Button>
                )}
                {isMode.cols && (
                  <Button
                    style={{width: "40px"}}
                    disabled={selectedCol === undefined}
                    onClick={this.onMoveColFirst}
                  >
                    <i className="fa fa-angle-double-left" />
                  </Button>
                )}
                {isMode.cols && (
                  <Button
                    style={{width: "40px"}}
                    disabled={selectedCol === undefined}
                    onClick={this.onMoveColLeft}
                  >
                    <i className="fa fa-angle-left" />
                  </Button>
                )}
                {isMode.cols && (
                  <Button
                    style={{width: "40px"}}
                    disabled={selectedCol === undefined}
                    onClick={this.onMoveColRight}
                  >
                    <i className="fa fa-angle-right" />
                  </Button>
                )}
                {isMode.cols && (
                  <Button
                    style={{width: "40px"}}
                    disabled={selectedCol === undefined}
                    onClick={this.onMoveColLast}
                  >
                    <i className="fa fa-angle-double-right" />
                  </Button>
                )}
              </ButtonGroup>
            </ButtonToolbar>
            {nColsConfirm && (
              <div>
                <Alert bsStyle="danger">
                  <p>
                    {
                      "La permutation des lignes et colonnes de la grille va être perdue. Appliquer le changement ?"
                    }
                  </p>
                  <Button onClick={this.onResizeGrid}>Ok</Button>
                </Alert>
              </div>
            )}
            <div
              className="text-grid"
              style={this.renderGridStyle()}
              onScroll={this.onScroll}
              ref={this.refGrid}
            >
              {isMode.rows && this.renderRows()}
              {isMode.cols && this.renderCols()}
              {isMode.text && this.renderText()}
              {this.renderGridSizer()}
            </div>
          </div>
        </div>
        {false && (
          <div className="panel panel-default">
            <div className="panel-body">
              <textarea
                rows="10"
                cols="60"
                value={this.props.taskData.cipher_text}
                onChange={this.onCipherTextChanged}
              />
            </div>
          </div>
        )}
      </div>
    );
  }
}

class RowsView extends React.PureComponent {
  renderRowBgStyle = row => {
    const {x1, x2} = row;
    return {
      left: `0px`,
      top: `${innerPadding}px`,
      width: `${(x2 - x1 + 1) * cellWidth}px`,
      height: `${cellHeight - innerPadding * 2}px`
    };
  };

  render () {
    const {rows, substitution, selectedRow, onSelectRow} = this.props;
    return (
      <div className="text-rows no-select">
        {rows.map(row => (
          <div
            key={row.key}
            className={classnames([
              "text-row",
              row.y === selectedRow && "text-row-selected"
            ])}
            style={renderRowStyle(row)}
            data-row={row.y}
            onClick={onSelectRow}
          >
            <div className="text-row-bg" style={this.renderRowBgStyle(row)} />
            {row.cols.map(col => renderCell(col, substitution))}
          </div>
        ))}
      </div>
    );
  }
}

class ColsView extends React.PureComponent {
  renderColBgStyle = row => {
    const {y1, y2} = row;
    return {
      left: `${innerPadding}px`,
      top: `0px`,
      width: `${cellWidth - innerPadding * 2}px`,
      height: `${(y2 - y1 + 1) * cellHeight}px`
    };
  };

  render () {
    const {cols, substitution, selectedCol, onSelectCol} = this.props;
    return (
      <div className="text-cols no-select">
        {cols.map(col => (
          <div
            key={col.key}
            className={classnames([
              "text-col",
              col.x === selectedCol && "text-col-selected"
            ])}
            style={renderColStyle(col)}
            data-col={col.x}
            onClick={onSelectCol}
          >
            <div className="text-col-bg" style={this.renderColBgStyle(col)} />
            {col.rows.map(row => renderCell(row, substitution))}
          </div>
        ))}
      </div>
    );
  }
}

class TextView extends React.PureComponent {
  render () {
    const {rows, substitution} = this.props;
    return (
      <div className="text-normal">
        {rows.map(row => (
          <div
            key={row.key}
            className="text-row"
            style={renderRowStyle(row)}
            data-row={row.y}
          >
            {row.cols.map(col => renderCell(col, substitution))}
            <br />
          </div>
        ))}
      </div>
    );
  }
}

function renderCell (cell, substitution) {
  const {content} = cell;
  let body, classes;
  if ("rank" in content) {
    const clearCell = substitution[content.rank];
    body = <span>{clearCell.symbol}</span>;
    classes = classnames(["text-cell", clearCell.locked && "text-cell-locked"]);
  } else {
    body = <span>{content.symbol}</span>;
    classes = "text-cell text-cell-literal";
  }
  return (
    <div key={cell.key} className={classes}>
      {body}
    </div>
  );
}

function renderRowStyle (row) {
  const {x1, x2, y} = row;
  return {
    left: `${paddingLeft + x1 * cellWidth + 1}px`,
    top: `${paddingTop + y * cellHeight}px`,
    width: `${(x2 - x1 + 1) * cellWidth}px`,
    height: `${cellHeight}px`
  };
}

function renderColStyle (col) {
  const {y1, y2, x} = col;
  return {
    left: `${paddingLeft + x * cellWidth + 1}px`,
    top: `${paddingTop + y1 * cellHeight + 2}px`,
    width: `${cellWidth}px`,
    height: `${(y2 - y1 + 1) * cellHeight}px`
  };
}

function initReducer (state, _action) {
  return {
    ...state
  };
}

function modeChangedReducer (state, action) {
  const {mode} = action;
  return updateWorkspace(update(state, {workspace: {mode: {$set: mode}}}));
}

function gridMountedReducer (state, action) {
  const {grid} = action;
  return update(state, {workspace: {grid: {$set: grid}}});
}

function gridScrolledReducer (state, action) {
  const {hPos, vPos} = action;
  state = update(state, {
    workspace: {
      hPos: {$set: hPos},
      vPos: {$set: vPos}
    }
  });
  if (state.workspace.mode === "text") {
    /* updateWorkspace is not needed in text mode */
    return state;
  }
  return updateWorkspace(state);
}

function resizeGridReducer (state, action) {
  const {nCols} = action;
  return update(state, {workspace: {nColsTemp: {$set: nCols}}});
}

function gridResizedReducer (state, action) {
  const {nCols} = action;
  const dump = makeDump(state.taskData, nCols);
  /* Preserve the substitution. */
  dump.substitution = state.dump.substitution;
  return updateWorkspace(
    update(state, {
      dump: {$set: dump},
      workspace: {nColsTemp: {$set: nCols}}
    })
  );
}

function rowSelectedReducer (state, action) {
  const {row} = action;
  function toggleSelection (prev) {
    return row === prev ? undefined : row;
  }
  /* updateWorkspace is not needed */
  return update(state, {workspace: {selectedRow: {$apply: toggleSelection}}});
}

function colSelectedReducer (state, action) {
  const {col} = action;
  function toggleSelection (prev) {
    return col === prev ? undefined : col;
  }
  /* updateWorkspace is not needed */
  return update(state, {workspace: {selectedCol: {$apply: toggleSelection}}});
}

function rowMovedReducer (state, action) {
  const {nRows, rowPerm} = state.dump;
  const {row, direction, position} = action;
  let perm, newRow;
  if (typeof direction === "number") {
    newRow = row + direction;
    if (newRow < 0 || newRow >= nRows) {
      return state;
    }
    perm = arraySwap(rowPerm, row, newRow);
  } else if (typeof position === "string") {
    if (position === "first") {
      newRow = 0;
      perm = arrayRotate(rowPerm, row, newRow);
    } else if (position === "last") {
      newRow = nRows - 1;
      perm = arrayRotate(rowPerm, row, newRow);
    } else {
      return state;
    }
  }
  return updateWorkspace(
    update(state, {
      workspace: {selectedRow: {$set: newRow}},
      dump: {
        rowPerm: perm,
        permChanged: {$set: true}
      }
    })
  );
}

function colMovedReducer (state, action) {
  const {nCols, colPerm} = state.dump;
  const {col, direction, position} = action;
  let perm, newCol;
  if (typeof direction === "number") {
    newCol = col + direction;
    if (newCol < 0 || newCol >= nCols) {
      return state;
    }
    perm = arraySwap(colPerm, col, newCol);
  } else if (typeof position === "string") {
    if (position === "first") {
      newCol = 0;
      perm = arrayRotate(colPerm, col, newCol);
    } else if (position === "last") {
      newCol = nCols - 1;
      perm = arrayRotate(colPerm, col, newCol);
    } else {
      return state;
    }
  }
  return updateWorkspace(
    update(state, {
      workspace: {selectedCol: {$set: newCol}},
      dump: {
        colPerm: perm,
        permChanged: {$set: true}
      }
    })
  );
}

function substItemsSwappedReducer (state, action) {
  const {substitution} = state.dump;
  const {rank1, rank2} = action;
  return updateWorkspace(
    update(state, {
      dump: {substitution: arraySwap(substitution, rank1, rank2)}
    })
  );
}

function substItemLockedReducer (state, action) {
  const {rank} = action;
  return updateWorkspace(
    update(state, {
      dump: {substitution: {[rank]: {locked: {$apply: b => !b}}}}
    })
  );
}

function cipherTextChangedReducer (state, action) {
  const {text} = action;
  const taskData = {cipher_text: text};
  const dump = makeDump(taskData, 40);
  return initWorkspace({...state, taskData}, dump);
}

function showSolveReducer (state, _action) {
  return {...state, showSolve: true};
}

function solveSubstReducer (state, _action) {
  const substitution = inverseSubstitution(state.full_task.substitution);
  return updateWorkspace(
    update(state, {dump: {substitution: {$set: substitution}}})
  );
}

function solvePermReducer (state, _action) {
  const nCols = state.full_task.colsPermutation.length;
  const nRows = state.full_task.rowsPermutation.length;
  const substitution = state.dump.substitution;
  const rowPerm = inversePermutation(state.full_task.rowsPermutation);
  const colPerm = inversePermutation(state.full_task.colsPermutation);
  const dump = {nCols, nRows, substitution, rowPerm, colPerm};
  return updateWorkspace(update(state, {dump: {$set: dump}}));
}

function WorkspaceSelector (state) {
  const {
    taskData,
    dump,
    workspace,
    actions: {
      gridMounted,
      gridScrolled,
      resizeGrid,
      gridResized,
      colSelected,
      rowSelected,
      modeChanged,
      rowMoved,
      colMoved,
      substItemsSwapped,
      substItemLocked,
      cipherTextChanged,
      solveSubst,
      solvePerm
    },
    views: {Answer}
  } = state;

  return {
    taskData,
    dump,
    workspace,
    actions: {
      gridMounted,
      gridScrolled,
      resizeGrid,
      gridResized,
      colSelected,
      rowSelected,
      modeChanged,
      rowMoved,
      colMoved,
      substItemsSwapped,
      substItemLocked,
      cipherTextChanged,
      solveSubst,
      solvePerm
    },
    views: {Answer}
  };
}

export default {
  actions: {
    gridMounted: "Grid.Mounted",
    gridScrolled: "Grid.Scrolled",
    modeChanged: "Grid.Mode.Changed",
    resizeGrid: "Grid.Resize",
    gridResized: "Grid.Resized",
    rowSelected: "Grid.Row.Selected",
    colSelected: "Grid.Col.Selected",
    rowMoved: "Grid.Row.Moved",
    colMoved: "Grid.Col.Moved",
    substItemsSwapped: "Subst.Items.Swapped",
    substItemLocked: "Subst.Item.Locked",
    cipherTextChanged: "Task.CipherText.Changed",
    /* DEVELOPMENT ACTIONS */
    showSolve: "Task.Solve.Show",
    solveSubst: "Task.Subst.Solve",
    solvePerm: "Task.Perm.Solve"
  },
  actionReducers: {
    init: initReducer,
    modeChanged: modeChangedReducer,
    gridMounted: gridMountedReducer,
    gridScrolled: gridScrolledReducer,
    resizeGrid: resizeGridReducer,
    gridResized: gridResizedReducer,
    rowSelected: rowSelectedReducer,
    colSelected: colSelectedReducer,
    rowMoved: rowMovedReducer,
    colMoved: colMovedReducer,
    substItemsSwapped: substItemsSwappedReducer,
    substItemLocked: substItemLockedReducer,
    cipherTextChanged: cipherTextChangedReducer,
    /* DEVELOPMENT ACTIONREDUCERS */
    showSolve: showSolveReducer,
    solveSubst: solveSubstReducer,
    solvePerm: solvePermReducer
  },
  saga: function*() {
    const actions = yield select(
      ({
        actions: {gridMounted, rowSelected, rowMoved, colSelected, colMoved}
      }) => ({
        gridMounted,
        rowSelected,
        rowMoved,
        colSelected,
        colMoved
      })
    );

    yield takeLatest(actions.gridMounted, function*(action) {
      const {grid} = action;
      if (grid) {
        const hPos = yield select(state => state.workspace.hPos);
        const vPos = yield select(state => state.workspace.vPos);
        grid.scrollTo(vPos, hPos);
        yield takeEvery([actions.rowSelected, actions.rowMoved], function*(
          _action
        ) {
          const row = yield select(state => state.workspace.selectedRow);
          grid.ensureRowVisible(row);
        });
        yield takeEvery([actions.colSelected, actions.colMoved], function*(
          _action
        ) {
          const col = yield select(state => state.workspace.selectedCol);
          grid.ensureColVisible(col);
        });
      }
    });
  },
  views: {
    Workspace: connect(WorkspaceSelector)(
      DragDropContext(HTML5Backend)(Workspace)
    )
  }
};
