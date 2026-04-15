import React from 'react';
import EmbedForm from './components/embed.form';
import ExtractForm from './components/extract.form';
import ImageViews from "./components/image.views";
import ExplanationContent from './components/explanation.component';
import { INSTRUCTIONS } from "./constants";
import './App.css';

function App() {
  const [activeTab, setActiveTab] = React.useState("explanation");
  const [embedMethod, setEmbedMethod] = React.useState("lsb");
  const [lsbType, setLsbType] = React.useState("sequential");
  const [theme, setTheme] = React.useState(localStorage.getItem('theme') || 'dark');
  const [originalImage, setOriginalImage] = React.useState(null);
  const [steggedImage, setSteggedImage] = React.useState(null);
  const [differenceMap, setDifferenceMap] = React.useState(null);

  const getSteps = () => {
    const mode = activeTab; 
    if (mode === "explanation" || !INSTRUCTIONS[mode]) {
      return { title: "Explanation Mode", steps: ["Read the details in the center panel."] };
    }

    if (embedMethod === 'dct') {
      return INSTRUCTIONS[mode].dct;
    }

    const modeData = INSTRUCTIONS[mode];
    if (modeData && modeData.lsb) {
      return modeData.lsb[lsbType];
    }
    return { title: "", steps: [] };
  };

  const currentInfo = getSteps();

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme])

  React.useEffect(() => {
  setOriginalImage(null);
  setSteggedImage(null);
  setDifferenceMap(null);
}, [activeTab]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="background">
      <nav className="navbar">
        <div className="hidden-pixels-logo">HiddenPixels</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="button">
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
              <button 
                className={activeTab === "explanation" ? "active" : ""} 
                onClick={() => setActiveTab("explanation")}
              >
                Explanation
              </button>

            </div>
          <button className="theme-toggle-button" onClick={toggleTheme}>
            {theme === 'dark' ? '🌞' : '🌙'}
          </button>
        </div>
      </nav>

      {activeTab === "explanation" ? (
        <div className = "explanation-full-container">
          <div className = "glass-card explanation-container">
            <ExplanationContent/>
            </div>
        </div>
      ) : (

      <div className="main-container">

        <aside className="glass-card">
          <div className="label">HOW IT WORKS</div>
          <div key={JSON.stringify(currentInfo)} className="fade-in">
            <label className="sub-label">{currentInfo.title}</label>
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
              ) : 
                activeTab === "extract" ? (
                <ExtractForm 
                  embedMethod={embedMethod} 
                  setEmbedMethod={setEmbedMethod} 
                  lsbType={lsbType} 
                  setLsbType={setLsbType} 
                />
                ) :
                activeTab === "explanation" ?
                   (
                    <ExplanationContent 
                      embedMethod={null}
                      setEmbedMethod={null}
                      lsbType={null}
                      setLsbType={null}
                      setDifferenceMap={null}
                      setSteggedUrl={null}
                      setOriginalImage={null}
                      steggedUrl={null}
                    />                   
              ) : null
              }
            </div>
          </div>
        </main>

        <aside className="glass-card">
          <div className="label">Image Data Map</div>
          <div className="preview-container">
            <ImageViews
              original={originalImage}
              stegged={steggedImage}
              difference={differenceMap}
            />
          </div>
        </aside>
      </div>
      )}
    </div>
  );
}

export default App;