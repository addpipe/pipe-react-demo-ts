import { useState, useReducer } from "react";
import usePipeSDK, { RecorderObject } from "@addpipe/react-pipe-media-recorder"; // Importing the Pipe recorder npm package

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
}

// Define the state and action interfaces
interface State {
  status: RecordingState;
}

interface Action {
  type: ActionType;
}

// Initial state of the recorder
const initialState: State = {
  status: RecordingState.Initialized,
};

// Reducer function
const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case ActionType.LOADED:
      return { status: RecordingState.Ready };
    case ActionType.START_RECORDING:
      return { status: RecordingState.Recording };
    case ActionType.STOP_RECORDING:
      return { status: RecordingState.Ready };
    case ActionType.START_PLAYBACK:
      return { status: RecordingState.Playback };
    case ActionType.PAUSE_PLAYBACK:
      return { status: RecordingState.Paused };
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
};

const SingleRecorder = () => {
  // Track recorder state
  const [state, dispatch] = useReducer<(state: State, action: Action) => State>(reducer, initialState);

  // Storing the generated recorder inside of a state
  const [recorder, setRecorder] = useState<RecorderObject>();

  // Using the Pipe recorder custom hook
  const { isLoaded } = usePipeSDK((PipeSDK) => {
    // Check to make sure the code below is only executed on the initial load
    if (isLoaded) return;

    // Prepare the parameters needed to generate a new recorder
    const pipeParams = { size: { width: "80%", height: 390 }, qualityurl: "avq/360p.xml", accountHash: "NON-EXISTENT-HASH-SO-THAT-THE-VIDEOS-ARE-NOT-PROCESSED-AT-ALL", eid: "YOUR_ENV_CODE", mrt: 600, avrec: 1 };

    // Inserting a new recorder into the page
    PipeSDK.insert("custom-id", pipeParams, (pipeRecorder) => {
      setRecorder(pipeRecorder); // Store the recorder instance for later use

      // Update state when ready to record
      pipeRecorder.onReadyToRecord = () => {
        dispatch({ type: ActionType.LOADED });
      };
    });
  });

  const startRecording = (): void => {
    if (state.status === RecordingState.Initialized) return;
    recorder?.record();
    dispatch({ type: ActionType.START_RECORDING });
  };

  const stopRecording = (): void => {
    if (state.status !== RecordingState.Recording) return;
    recorder?.stopVideo();
    dispatch({ type: ActionType.STOP_RECORDING });
  };

  const playbackRecording = (): void => {
    if (state.status === RecordingState.Initialized || !recorder) return;

    // Start playback
    if (state.status === RecordingState.Paused || state.status === RecordingState.Ready) {
      recorder?.playVideo();
      dispatch({ type: ActionType.START_PLAYBACK });
    }

    // Pause playback
    if (state.status === RecordingState.Playback) {
      recorder?.pause();
      dispatch({ type: ActionType.PAUSE_PLAYBACK });
    }

    // Listen for playback complete
    recorder.onPlaybackComplete = () => {
      if (state.status === RecordingState.Recording) return;
      dispatch({ type: ActionType.LOADED });
    };
  };

  return (
    <div>
      <div>
        <h1>Pipe React Demo with TypeScript</h1>
        <h2>One single recorder embedded</h2>
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
          >Pipe NPM package for React</a> using TypeScript.
        </p>
        {!isLoaded && <div className="placeholder">Loading the Pipe recorder</div>}
        <div id="custom-id"></div>
        <br />
        <div id="controls">
          {recorder && state.status !== RecordingState.Initialized && (
            <>
              <button onClick={startRecording}>Record</button>
              <button onClick={stopRecording}>Stop</button>
              <button onClick={playbackRecording}>{state.status === RecordingState.Playback ? "Pause" : "Play"}</button>
            </>
          )}
        </div>
      </div>
      <p id="data"></p>
      <h2>Links:</h2>
      <ul>
        <li>
          Code for this demo on GitHub: <a target="_blank" href="https://github.com/addpipe/pipe-react-demo-ts" rel="noreferrer">https://github.com/addpipe/pipe-react-demo-ts</a>
        </li>
      </ul>
    </div>
  );
}

export default SingleRecorder