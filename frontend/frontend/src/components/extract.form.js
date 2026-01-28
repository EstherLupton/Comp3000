import React from "react";

function ExtractForm() {
  return (
    <div className="extract-form">
      <h2>Extract Message from Image</h2>
      <input type="file" accept="image/*" />
      <button>Extract Message</button>
    </div>
  );
}

export default ExtractForm;