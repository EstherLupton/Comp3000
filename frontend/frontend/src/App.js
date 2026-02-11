import React from 'react';
import EmbedForm from './components/embed.form';
import ExtractForm from './components/extract.form';
import './App.css';

function App() {
  return (
    <div className="App">
      <h1>HiddenPixels – Image Steganography</h1>
      <div className="forms-container">
        <EmbedForm />
        <ExtractForm />
      </div>
    </div>
  );
}

export default App;
