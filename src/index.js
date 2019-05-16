import algoreaReactTask from "./algorea_react_task";
import {
  textToCells,
  alphabet,
  makeDump,
  blankAnswer,
  initWorkspace,
  updateWorkspace
} from "./utils";

import "font-awesome/css/font-awesome.css";
import "bootstrap/dist/css/bootstrap.css";
import "./style.css";
import "./platform.css";
import "rc-tooltip/assets/bootstrap.css";

import WorkspaceBundle from "./workspace_bundle";
import AnswerBundle from "./tools/answer_bundle";
import update from "immutability-helper";

const TaskBundle = {
  actionReducers: {
    appInit: appInitReducer,
    taskInit: taskInitReducer /* possibly move to algorea-react-task */,
    taskRefresh: taskRefreshReducer /* possibly move to algorea-react-task */,
    taskAnswerLoaded: taskAnswerLoaded,
    taskStateLoaded: taskStateLoaded
  },
  includes: [AnswerBundle, WorkspaceBundle],
  selectors: {
    getTaskState,
    getTaskAnswer
  }
};

if (process.env.NODE_ENV === "development") {
  /* eslint-disable no-console */
  TaskBundle.earlyReducer = function (state, action) {
    console.log("ACTION", action.type, action);
    return state;
  };
}

function appInitReducer (state, _action) {
  const taskMetaData = {
    id: "http://concours-alkindi.fr/tasks/2018/enigma",
    language: "fr",
    version: "fr.01",
    authors: "Sébastien Carlier",
    translators: [],
    license: "",
    taskPathPrefix: "",
    modulesPathPrefix: "",
    browserSupport: [],
    fullFeedback: true,
    acceptedAnswers: [],
    usesRandomSeed: true
  };
  return {...state, taskMetaData};
}

function taskInitReducer (state, _action) {
  const dump = makeDump(state.taskData, 40);
  return initWorkspace({...state, taskReady: true}, dump);
}

function taskRefreshReducer (state, _action) {
  const dump = state.dump;
  const cells = textToCells(alphabet, state.taskData.cipher_text);
  const workspace = {...state.workspace, cells};
  return updateWorkspace({...state, workspace}, dump);
}

function getTaskAnswer (state) {
  return {dump: state.dump};
}

function taskAnswerLoaded (
  state,
  {
    payload: {
      answer: {dump}
    }
  }
) {
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

function getTaskState (_state) {
  return {};
}

function taskStateLoaded (state, {payload: {_dump}}) {
  return state;
}

export function run (container, options) {
  return algoreaReactTask(container, options, TaskBundle);
}
