import React from 'react';
import EmbedForm from './components/embed.form';
import ExtractForm from './components/extract.form';
import ImageViews from "./components/image.views";
import { INSTRUCTIONS } from "./constants";
import './App.css';

function App() {
  const [activeTab, setActiveTab] = React.useState("embed");
  const [embedMethod, setEmbedMethod] = React.useState("lsb");
  const [lsbType, setLsbType] = React.useState("sequential");
  const [theme, setTheme] = React.useState(localStorage.getItem('theme') || 'dark');
  const [originalImage, setOriginalImage] = React.useState(null);
  const [steggedImage, setSteggedImage] = React.useState(null);
  const [differenceMap, setDifferenceMap] = React.useState(null);

  const getSteps = () => {
  const mode = activeTab; 
  if (embedMethod === 'dct') {
    return INSTRUCTIONS[mode].dct;
  }
  return INSTRUCTIONS[mode].lsb[lsbType];
};

  const currentInfo = getSteps();

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme])

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="background">
      <nav className="navbar">
        <div className="hidden-pixels-logo">HiddenPixels</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="embed-extract-buttons">
              <button 
                className={activeTab === "embed" ? "active" : ""} 
                onClick={() => setActiveTab("embed")}
              >
                Embed
              </button>
              <button 
                className={activeTab === "extract" ? "active" : ""} 
                onClick={() => setActiveTab("extract")}
              >
                Extract
              </button>
            </div>
          <button className="theme-toggle-button" onClick={toggleTheme}>
            {theme === 'dark' ? '🌞' : '🌙'}
          </button>
        </div>
      </nav>

      <div className="main-container">

        <aside className="side-column-instructions">
          <div className="column-label">HOW IT WORKS</div>
          <div key={JSON.stringify(currentInfo)} className="fade-in">
            <h3 style={{fontSize: '1rem', marginBottom: '10px'}}>{currentInfo.title}</h3>
            <ul className="method-steps">
              {currentInfo.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="center-column">
          <div className="glass-card main-form">
            
            <div className="form-content">
              {activeTab === "embed" ? (
                <EmbedForm 
                  embedMethod={embedMethod}
                  setEmbedMethod={setEmbedMethod}  
                  lsbType={lsbType}                
                  setLsbType={setLsbType}
                  setDifferenceMap={setDifferenceMap} 
                  setSteggedUrl={setSteggedImage}
                  setOriginalImage={setOriginalImage}
                  steggedUrl={steggedImage}
                /> 
              ) : (
                <ExtractForm 
                  embedMethod={embedMethod} 
                  setEmbedMethod={setEmbedMethod} 
                  lsbType={lsbType} 
                  setLsbType={setLsbType} 
                />
              )}
            </div>
          </div>
        </main>

        <aside className="side-column-preview-card">
          <div className="column-label">Image Data Map</div>
          <div className="preview-container">
            <ImageViews
              original={originalImage}
              stegged={steggedImage}
              difference={differenceMap}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;