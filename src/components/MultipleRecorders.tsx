import { useState, useReducer } from "react";
import usePipeSDK, { RecorderObject, PipeSDKObject } from "@addpipe/react-pipe-media-recorder"; // Importing the Pipe recorder npm package

// Define the states of the recorder
enum RecordingState {
  Initialized = "Initialized",
  Ready = "Ready",
  Recording = "Recording",
  Paused = "Paused",
  Playback = "Playback",
}

// Define the action types of the recorder
enum ActionType {
  LOADED = "LOADED",
  START_RECORDING = "START_RECORDING",
  STOP_RECORDING = "STOP_RECORDING",
  START_PLAYBACK = "START_PLAYBACK",
  PAUSE_PLAYBACK = "PAUSE_PLAYBACK",
  ADD_RECORDER = "ADD_RECORDER",
}

// Define the recorder and action interfaces
interface Recorder {
  id: string; // Unique identifier for each recorder
  status: RecordingState;
}

interface Action {
  type: ActionType;
  payload?: {
    id?: string; // Optional ID for identifying the recorder
    newId?: string; // New ID for adding a recorder
  };
}

// Initial state: an array of recorders
const initialState: Recorder[] = [];

// Reducer function
const reducer = (state: Recorder[], action: Action): Recorder[] => {
  switch (action.type) {
    case ActionType.ADD_RECORDER:
      if (!action.payload?.newId) {
        throw new Error("No newId provided for ADD_RECORDER");
      }
      return [...state, { id: action.payload.newId, status: RecordingState.Initialized }];
    case ActionType.LOADED:
    case ActionType.START_RECORDING:
    case ActionType.STOP_RECORDING:
    case ActionType.START_PLAYBACK:
    case ActionType.PAUSE_PLAYBACK:
      if (!action.payload?.id) {
        throw new Error("No id provided for action");
      }
      return state.map((recorder) =>
        recorder.id === (action.payload ? action.payload.id : "")
          ? {
              ...recorder,
              status: (() => {
                switch (action.type) {
                  case ActionType.LOADED:
                    return RecordingState.Ready;
                  case ActionType.START_RECORDING:
                    return RecordingState.Recording;
                  case ActionType.STOP_RECORDING:
                    return RecordingState.Ready;
                  case ActionType.START_PLAYBACK:
                    return RecordingState.Playback;
                  case ActionType.PAUSE_PLAYBACK:
                    return RecordingState.Paused;
                  default:
                    return recorder.status;
                }
              })(),
            }
          : recorder
      );
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
};

const RECORDER_IDS = ["custom-id-1", "custom-id-2", "custom-id-3"];

const MultipleRecorders = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const addRecorder = (id: string) => {
    dispatch({ type: ActionType.ADD_RECORDER, payload: { id, newId: id } });
  };

  // Store PipeSDK
  const [pipeSdk, setPipeSdk] = useState<PipeSDKObject>();

  // Using the Pipe recorder custom hook
  const { isLoaded } = usePipeSDK((PipeSDK) => {
    // Check to make sure the code below is only executed on the initial load
    if (isLoaded) return;

    // Store PipeSDK
    setPipeSdk(PipeSDK);

    // Inserting a new recorder into the page
    RECORDER_IDS.forEach((id) => {
      // Prepare the parameters needed to generate a new recorder
      const randomWidth = Math.floor(Math.random() * (100 - 70 + 1)) + 70;
      const pipeParams = { size: { width: `${randomWidth}%`, height: 390 }, qualityurl: "avq/360p.xml", accountHash: "NON-EXISTENT-HASH-SO-THAT-THE-VIDEOS-ARE-NOT-PROCESSED-AT-ALL", eid: "YOUR_ENV_CODE", mrt: 600, avrec: 1 };

      PipeSDK.insert(id, pipeParams, (pipeRecorder) => {
        addRecorder(id);

        // Update state when ready to record
        pipeRecorder.onReadyToRecord = () => {
          dispatch({ type: ActionType.LOADED, payload: { id: id } });
        };
      });
    });
  });

  // Check state of a recorder by ID
  const checkState = (id: string, checkState: RecordingState): boolean => {
    const recorder = state.find((rec) => rec.id === id);
    if (!recorder) {
      return false;
    }

    return recorder.status === checkState;
  };

  // Get a recorder by ID
  const getRecorder = (id: string): RecorderObject | undefined => {
    if (!pipeSdk) return;
    return pipeSdk.getRecorderById(id);
  };

  const startRecording = (id: string): void => {
    if (checkState(id, RecordingState.Initialized)) return;
    const recorder = getRecorder(id);
    recorder?.record();
    dispatch({ type: ActionType.START_RECORDING, payload: { id: id } });
  };

  const stopRecording = (id: string): void => {
    if (!checkState(id, RecordingState.Recording)) return;
    const recorder = getRecorder(id);
    recorder?.stopVideo();
    dispatch({ type: ActionType.STOP_RECORDING, payload: { id: id } });
  };

  const playbackRecording = (id: string): void => {
    if (checkState(id, RecordingState.Initialized)) return;

    const recorder = getRecorder(id);
    if (!recorder) return;

    // Start playback
    if (checkState(id, RecordingState.Paused) || checkState(id, RecordingState.Ready)) {
      recorder.playVideo();
      dispatch({ type: ActionType.START_PLAYBACK, payload: { id: id } });
    }

    // Pause playback
    if (checkState(id, RecordingState.Playback)) {
      recorder.pause();
      dispatch({ type: ActionType.PAUSE_PLAYBACK, payload: { id: id } });
    }

    // Listen for playback complete
    recorder.onPlaybackComplete = () => {
      if (checkState(id, RecordingState.Recording)) return;
      dispatch({ type: ActionType.LOADED, payload: { id: id } });
    };
  };

  return (
    <div>
      <div>
        <h1>Pipe React Demo with TypeScript</h1>
        <h2>Multiple recorders embedded</h2>
        <p>
          <small>
            Made by the <a href="https://addpipe.com">Pipe Recording Platform</a>
          </small>
        </p>
        <p>
          Demo react project integrating the <a
            target="_blank"
            href="https://www.npmjs.com/package/@addpipe/react-pipe-media-recorder"
            rel="noreferrer"
          >
            Pipe NPM package for React
          </a> using TypeScript.
        </p>
        {RECORDER_IDS.map((id, idx) => {
          return (
            <span key={id}>
              <h1>Recorder {idx + 1}</h1>
              {!isLoaded && <div className="placeholder">Loading the Pipe recorder</div>}
              <div id={id}></div>
              <br />
              <div id="controls">
                {!checkState(id, RecordingState.Initialized) && (
                  <>
                    <button onClick={() => startRecording(id)}>Record</button>
                    <button onClick={() => stopRecording(id)}>Stop</button>
                    <button onClick={() => playbackRecording(id)}>{checkState(id, RecordingState.Playback) ? "Pause" : "Play"}</button>
                  </>
                )}
              </div>
            </span>
          );
        })}
      </div>
      <p id="data"></p>
      <h2>Links:</h2>
      <ul>
        <li>
          Code for this demo on GitHub: <a
            target="_blank"
            href="https://github.com/addpipe/pipe-react-demo-ts"
            rel="noreferrer"
          >
            https://github.com/addpipe/pipe-react-demo-ts
          </a>
        </li>
      </ul>
    </div>
  );
};

export default MultipleRecorders;
