import React from "react";
import classnames from "classnames";
import {DragSource, DropTarget} from "react-dnd";
import {alphabet} from "./utils";

export default class SubstEditor extends React.PureComponent {
  onDrop = (dragSource, dragTarget) => {
    const rank1 = dragTarget.source;
    const rank2 = dragSource.source;
    this.props.onSwapPairs(rank1, rank2);
  };

  renderSubstCell = (targetCell, sourceRank) => {
    const sourceSymbol = alphabet.symbols[sourceRank];
    const targetSymbol = targetCell.symbol;
    const isLocked = targetCell.locked;
    const isEditable = !isLocked;
    const Target = isEditable ? SubstTarget : BareSubstTarget;
    const cellClasses = ["subst-cell", isLocked ? "subst-cell-locked " : ""];
    return (
      <div key={sourceRank} className={classnames(cellClasses)}>
        <div className="subst-source">
          <div className="subst-char" data-rank={sourceRank}>
            <div className="subst-symbol">{sourceSymbol}</div>
          </div>
        </div>
        <Target
          source={sourceRank}
          target={targetCell}
          targetSymbol={targetSymbol}
          onDrop={this.onDrop}
          onLock={this.onLock}
          locked={isLocked}
        />
      </div>
    );
  };

  render () {
    const {substitution} = this.props;
    const cols = this.props.cols || substitution.length;
    const groups = [];
    let groupStart = 0;

    while (groupStart < substitution.length) {
      const group = substitution.slice(groupStart, groupStart + cols);
      groups.push(
        <div key={groupStart}>
          <div className="subst-label">
            <div className="subst-source">{"chiffré"}</div>
            <div className="subst-target">{"clair"}</div>
          </div>
          {group.map((targetCell, sourceRank) => {
            return this.renderSubstCell(targetCell, groupStart + sourceRank);
          })}
        </div>
      );
      groupStart += cols;
    }

    return <div className="subst">{groups}</div>;
  }
}

class BareSubstTarget extends React.PureComponent {
  onLock = event => {
    event.preventDefault();
    this.props.onLock(this.props.source);
  };

  render () {
    const {
      targetSymbol,
      locked,
      isDragging,
      connectDropTarget,
      connectDragSource
    } = this.props;

    const isDragTarget = typeof connectDropTarget === "function";
    const isDragSource = typeof connectDragSource === "function";
    const classes = [
      "subst-target",
      isDragSource && "draggable",
      isDragging && "dragging"
    ];
    let el = (
      <div className={classnames(classes)}>
        <div className="subst-char">
          <div className="subst-symbol">{targetSymbol}</div>
          <div className="subst-lock" onClick={this.onLock}>
            <i
              className={classnames([
                "fa",
                locked ? "fa-lock" : "fa-unlock-alt"
              ])}
            />
          </div>
        </div>
      </div>
    );
    if (isDragTarget) {
      el = connectDropTarget(el);
    }
    if (isDragSource) {
      el = connectDragSource(el);
    }
    return el;
  }
}

function sourceCollect (connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  };
}
const targetCollect = function (connect, _monitor) {
  return {
    connectDropTarget: connect.dropTarget()
  };
};
const sourceSpec = {
  beginDrag: function (props) {
    const {source, target} = props;
    return {source, target};
  }
};
const targetSpec = {
  drop: function (props, monitor, _component) {
    const dragSource = monitor.getItem();
    const {source, target} = props;
    const dragTarget = {source, target};
    props.onDrop(dragSource, dragTarget);
  }
};
const SubstTarget = DragSource("subst-target", sourceSpec, sourceCollect)(
  DropTarget("subst-target", targetSpec, targetCollect)(BareSubstTarget)
);
