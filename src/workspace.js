
import React from 'react';
import EpicComponent from 'epic-component';
import classnames from 'classnames';
import {ButtonToolbar, ButtonGroup, Button} from 'react-bootstrap';

import SubstEditor from './subst';

const paddingLeft = 0;
const paddingTop = 10;
const cellWidth = 16;
const cellHeight = 20;
const innerPadding = 2;
const scrollSpace = 20;

export const Workspace = deps => EpicComponent(function (self) {

  self.render = function () {
    const {showSolve, alphabet, dump, workspace} = self.props;
    const {substitution} = dump;
    const {mode, selectedRow, selectedCol} = workspace;
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
        {<div className="saveBlock"><deps.SaveButton/></div>}
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
        const frame = self.props.workspace.view.narrowFrame;
        const {maxVisibleRows, selectionHalo} = self.props.workspace;
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
        const frame = self.props.workspace.view.narrowFrame;
        const {maxVisibleCols, selectionHalo} = self.props.workspace;
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
  function renderGridSizer () {
    const {nCols, nRows} = self.props.dump;
    const top = paddingTop * 2 + nRows * cellHeight;
    const left = paddingLeft * 2 + nCols * cellWidth;
    return <div className='grid-sizer' style={{top,left}}/>;
  }
  function renderGridStyle () {
    const {nCols, nRows} = self.props.dump;
    const {maxVisibleCols, maxVisibleRows} = self.props.workspace;
    const cols = Math.min(maxVisibleCols, nCols);
    const rows = Math.min(maxVisibleRows, nRows);
    return {
      width: `${cols * cellWidth + paddingLeft * 2 + scrollSpace}px`,
      height: `${rows * cellHeight + paddingTop * 2 + scrollSpace}px`,
    };
  }

  function renderRows () {
    const {selectedRow, view} = self.props.workspace;
    const {frame, rows} = view;
    const {substitution} = self.props.dump;
    return <RowsView frame={frame} rows={rows} substitution={substitution} selectedRow={selectedRow} onSelectRow={onSelectRow} />;
  }

  function renderCols () {
    const {selectedCol, view} = self.props.workspace;
    const {frame, cols} = view;
    const {substitution} = self.props.dump;
    return <ColsView frame={frame} cols={cols} substitution={substitution} selectedCol={selectedCol} onSelectCol={onSelectCol} />;
  }

  function renderText () {
    const {frame, rows} = self.props.workspace.view;
    const {substitution} = self.props.dump;
    return <TextView frame={frame} rows={rows} substitution={substitution} />;
  }

});

const RowsView = EpicComponent(function (self) {

  self.render = function () {
    const {frame, rows, substitution, selectedRow, onSelectRow} = self.props;
    return (
      <div className="text-rows no-select">
        {rows.map(row =>
          <div key={row.key} className={classnames(["text-row", row.y === selectedRow && "text-row-selected"])} style={renderRowStyle(row)} data-row={row.y} onClick={onSelectRow}>
            <div className="text-row-bg" style={renderRowBgStyle(row)}></div>
            {row.cols.map(col => renderCell(col, substitution))}
          </div>)}
      </div>
    );
  }

  function renderRowBgStyle (row) {
    const {x1, x2, y} = row;
    return {
      left: `0px`,
      top: `${innerPadding}px`,
      width: `${(x2 - x1 + 1) * cellWidth}px`,
      height: `${cellHeight - innerPadding * 2}px`
    };
  }

});

const ColsView = EpicComponent(function (self) {

  self.render = function () {
    const {frame, cols, substitution, selectedCol, onSelectCol} = self.props;
    return (
      <div className="text-cols no-select">
        {cols.map(col =>
          <div key={col.key} className={classnames(["text-col", col.x === selectedCol && "text-col-selected"])} style={renderColStyle(col)} data-col={col.x} onClick={onSelectCol}>
            <div className="text-col-bg" style={renderColBgStyle(col)}></div>
            {col.rows.map(row => renderCell(row, substitution))}
          </div>)}
      </div>
    );
  };

  function renderColBgStyle (row) {
    const {y1, y2, x} = row;
    return {
      left: `${innerPadding}px`,
      top: `0px`,
      width: `${cellWidth - innerPadding * 2}px`,
      height: `${(y2 - y1 + 1) * cellHeight}px`
    };
  }

});

const TextView = EpicComponent(function (self) {

  self.render = function () {
    const {frame, rows, substitution} = self.props;
    return (
      <div className="text-normal">
        {rows.map(row =>
          <div key={row.key} className="text-row" style={renderRowStyle(row)} data-row={row.y}>
            {row.cols.map(col => renderCell(col, substitution))}
            <br/>
          </div>)}
      </div>
    );
  };

});

function renderCell (cell, substitution) {
  const {content} = cell;
  let body, classes;
  if ('rank' in content) {
    const clearCell = substitution[content.rank];
    body = <span>{clearCell.symbol}</span>;
    classes = classnames(["text-cell", clearCell.locked && "text-cell-locked"]);
  } else {
    body = <span>{content.symbol}</span>;
    classes = "text-cell text-cell-literal";
  }
  return (
    <div key={cell.key} className={classes}>{body}</div>
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
