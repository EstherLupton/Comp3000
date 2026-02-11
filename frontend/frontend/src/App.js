import React from 'react';
import EmbedForm from './components/embed.form';
import ExtractForm from './components/extract.form';
import './App.css';

function App() {
  return (
    <div className="App container py-4">
      <header className="mb-4 text-center">
        <h1 className="h3">HiddenPixels</h1>
        <p className="text-muted">Image steganography — embed and extract secret messages</p>
      </header>

      <div className="row g-4">
        <div className="col-12 col-md-6">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <EmbedForm />
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <ExtractForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
