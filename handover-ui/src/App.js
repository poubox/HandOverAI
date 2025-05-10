import React from "react";
import FileUpload from "./components/FileUpload"; // 🔽 추가

function App() {
  return (
    <div>
      <h1>Handover.AI</h1>
      <FileUpload /> {/* 🔽 우리가 만든 컴포넌트 */}
    </div>
  );
}

export default App;
