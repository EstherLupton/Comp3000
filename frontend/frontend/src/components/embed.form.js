import React from "react";

function EmbedForm() {
  return (
    <div className="embed-form">
      <h2>Embed Message into Image</h2>
      <input type="file" accept="image/*" />
      <textarea placeholder="Enter your secret message here"></textarea>
      <button>Embed Message</button>
    </div>
  );
}
export default EmbedForm;