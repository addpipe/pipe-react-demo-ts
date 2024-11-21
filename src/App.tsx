import { useState } from "react";
import "./App.css";
import SingleRecorder from "./components/SingleRecorder";
import MultipleRecorders from "./components/MultipleRecorders";

function App() {
  const [currentPage, setCurrentPage] = useState<"SINGLE" | "MULTIPLE">("SINGLE");

  return (
    <>
      <div className="navigation-top">
        <button
          disabled={currentPage === "SINGLE"}
          onClick={() => setCurrentPage("SINGLE")}
        >
          Single Recorder
        </button>
        <button
          disabled={currentPage === "MULTIPLE"}
          onClick={() => setCurrentPage("MULTIPLE")}
        >
          Multiple Recorders
        </button>
      </div>
      <hr />
      {currentPage === "SINGLE" && <SingleRecorder />}
      {currentPage === "MULTIPLE" && <MultipleRecorders />}
    </>
  );
}

export default App;
