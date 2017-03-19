
import React from 'react';
import {Button} from 'react-bootstrap';
import EpicComponent from 'epic-component';
import classnames from 'classnames';
import {DragSource, DropTarget} from 'react-dnd';

export default EpicComponent(self => {

   function onDrop (dragSource, dragTarget) {
      const rank1 = dragTarget.source;
      const rank2 = dragSource.source;
      self.props.onSwapPairs(rank1, rank2);
   }

   self.render = function() {
      const {alphabet, substitution, onLock} = self.props;
      const cols = self.props.cols || substitution.length;
      function renderSubstCell (targetCell, sourceRank) {
         const sourceSymbol = alphabet.symbols[sourceRank];
         const targetSymbol = targetCell.symbol;
         const isLocked = targetCell.locked;
         const isEditable = !isLocked;
         const Target = isEditable ? SubstTarget : BareSubstTarget;
         const cellClasses = ['subst-cell', isLocked ? 'subst-cell-locked ' : ''];
         return (
            <div key={sourceRank} className={classnames(cellClasses)}>
               <div className='subst-source'>
                  <div className='subst-char' data-rank={sourceRank}>
                     <div className='subst-symbol'>{sourceSymbol}</div>
                  </div>
               </div>
               <Target source={sourceRank} target={targetCell} targetSymbol={targetSymbol} onDrop={onDrop} onLock={onLock} locked={isLocked} />
            </div>
         );
      }
      const groups = [];
      let groupStart = 0;
      while (groupStart < substitution.length) {
         const group = substitution.slice(groupStart, groupStart + cols);
         groups.push(
            <div key={groupStart}>
               <div className='subst-label'>
                  <div className='subst-source'>{"chiffré"}</div>
                  <div className='subst-target'>{"clair"}</div>
               </div>
               {group.map(function (targetCell, sourceRank) {
                  return renderSubstCell(targetCell, groupStart + sourceRank);
               })}
            </div>);
         groupStart += cols;
      }
      return (
         <div className='subst'>
            {groups}
         </div>
      );
   };

});

const BareSubstTarget = EpicComponent(self => {

   function onLock (event) {
      event.preventDefault();
      const {source} = self.props;
      self.props.onLock(source);
   }

   self.render = function () {
      const {targetSymbol, locked} = self.props;
      const {isDragging, connectDropTarget, connectDragSource} = self.props;
      const isDragTarget = typeof connectDropTarget === 'function';
      const isDragSource = typeof connectDragSource === 'function';
      const classes = ['subst-target', isDragSource && 'draggable', isDragging && 'dragging'];
      let el = (
         <div className={classnames(classes)}>
            <div className='subst-char' onClick={onLock}>
               <div className='subst-symbol'>{targetSymbol}</div>
               <div className='subst-lock'><i className={classnames(['fa', locked ? 'fa-lock' : 'fa-unlock-alt'])}></i></div>
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
   };

});

function sourceCollect (connect, monitor) {
   return {
      connectDragSource: connect.dragSource(),
      isDragging: monitor.isDragging()
   };
};
const targetCollect = function (connect, monitor) {
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
   drop: function (props, monitor, component) {
      const dragSource = monitor.getItem();
      const {source, target} = props;
      const dragTarget = {source, target};
      props.onDrop(dragSource, dragTarget);
   }
};
const SubstTarget =
   DragSource('subst-target', sourceSpec, sourceCollect)(
   DropTarget('subst-target', targetSpec, targetCollect)(
   BareSubstTarget));
