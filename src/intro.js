
import React from 'react';
import EpicComponent from 'epic-component';
import url from 'url';

export default EpicComponent(self => {

  self.render = function () {
    function asset (path) {
      return url.resolve(self.props.baseUrl, path);
    }
    return (
      <div className="taskInstructions">
        <h1>Énoncé</h1>
        <img src={asset("images/image.png")} alt="alt" />
      </div>
    );
  };
});
